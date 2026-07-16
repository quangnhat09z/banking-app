// src/auth/auth.service.ts
import {
  Injectable, ConflictException, UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly usersService: UsersService,
        private readonly accountsService: AccountsService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepo: Repository<RefreshToken>,
    ) { }


    // Hash helper 
    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    // Tạo cặp token 
    private async generateTokenPair(
        user: User,
        meta: { user_agent?: string; ip_address?: string },
    ) {
        const payload = { sub: user.id, email: user.email, role: user.role };

        // Access token — 15 phút
        const access_token = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        });

        // Refresh token — 7 ngày, dùng uuid làm giá trị
        const rawRefreshToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Lưu hash vào DB — không lưu plaintext
        const entity = this.refreshTokenRepo.create({
            user_id: user.id,
            token_hash: this.hashToken(rawRefreshToken),
            user_agent: meta.user_agent ?? null,
            ip_address: meta.ip_address ?? null,
            expires_at: expiresAt,
            is_revoked: false,
        } as RefreshToken);
        await this.refreshTokenRepo.save(entity);

        return { access_token, refresh_token: rawRefreshToken };
    }


    // Đăng ký người dùng
    async register(registerDto: RegisterDto) {
        const { email, password, full_name } = registerDto;

        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        return this.dataSource.transaction(async (manager) => {
            // Lấy Repository trực tiếp từ manager của Transaction này
            const userRepo = manager.getRepository(User);
            const newUser = userRepo.create({
                email: email,
                password_hash,
                full_name: full_name,
                role: UserRole.CUSTOMER,
                status: UserStatus.ACTIVE,
            });

            const savedUser = await userRepo.save(newUser);

            const savedAccount = await this.accountsService.createForUser(savedUser.id, manager);

            return {
                message: 'Registration successful',
                user: this.sanitizeUser(savedUser),
                account: {
                    account_number: savedAccount.account_number,
                    balance: savedAccount.balance,
                },
            };
        });
    }

    // Đăng nhập người dùng
    async login(
        dto: LoginDto,
        meta: { user_agent?: string; ip_address?: string } = {},
    ) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        if (user.status === UserStatus.LOCKED) {
            throw new UnauthorizedException('Account is locked');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateTokenPair(user, meta);

        return {
            message: 'Login successful',
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }


    // Logout 
    async logout(refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);
        const stored = await this.refreshTokenRepo.findOne({
            where: { token_hash: tokenHash },
        });
        if (stored) {
            stored.is_revoked = true;
            await this.refreshTokenRepo.save(stored);
        }
        return { message: 'Logged out successfully' };
    }

    // Logout tất cả thiết bị 
    async logoutAll(userId: string) {
        await this.revokeAllTokens(userId);
        return { message: 'Logged out of all devices successfully' };
    }

    // Đổi mật khẩu — revoke toàn bộ token cũ 
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException('User not found');

        const isMatch = await bcrypt.compare(dto.current_password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        if (dto.current_password === dto.new_password) {
            throw new UnauthorizedException('New password must be different from the current password');
        }

        // Cập nhật password
        user.password_hash = await bcrypt.hash(dto.new_password, 10);
        await this.usersService.save(user);

        // Revoke toàn bộ refresh token — đăng xuất tất cả thiết bị
        await this.revokeAllTokens(userId);

        return { message: 'Password changed successfully. Please login again.' };
    }

    async refresh(
        dto: RefreshTokenDto,
        meta: { user_agent?: string; ip_address?: string } = {},
    ) {
        const tokenHash = this.hashToken(dto.refresh_token);

        // Tìm token trong DB
        const stored = await this.refreshTokenRepo.findOne({
            where: { token_hash: tokenHash },
            relations: {
                user: true,
            },
        });

        // Không tồn tại → từ chối
        if (!stored) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        // Đã bị revoke → có thể là token bị đánh cắp → revoke toàn bộ
        if (stored.is_revoked) {
            await this.revokeAllTokens(stored.user_id);
            throw new UnauthorizedException(
                'Token has been revoked. All sessions have been logged out for security reasons.',
            );
        }

        // Hết hạn
        if (stored.expires_at < new Date()) {
            throw new UnauthorizedException('Refresh token is expired, please login again');
        }

        // Kiểm tra user còn active không
        if (stored.user.status === UserStatus.LOCKED) {
            throw new UnauthorizedException('Account is locked');
        }

        // Refresh Token Rotation — revoke token cũ, cấp token mới
        stored.is_revoked = true;
        await this.refreshTokenRepo.save(stored);

        const tokens = await this.generateTokenPair(stored.user, meta);

        return {
            message: 'Token has been refreshed',
            ...tokens,
        };
    }

    // Lấy danh sách phiên đăng nhập 
    async getActiveSessions(userId: string) {
        const sessions = await this.refreshTokenRepo.find({
            where: { user_id: userId, is_revoked: false },
            order: { created_at: 'DESC' },
        });

        return sessions
            .filter((s) => s.expires_at > new Date())
            .map((s) => ({
                id: s.id,
                user_agent: s.user_agent,
                ip_address: s.ip_address,
                created_at: s.created_at,
                expires_at: s.expires_at,
            }));
    }

    // Revoke tất cả token của 1 user 
    async revokeAllTokens(userId: string): Promise<void> {
        await this.refreshTokenRepo.update(
            { user_id: userId, is_revoked: false },
            { is_revoked: true },
        );
    }

    private sanitizeUser(user: User) {
        const { password_hash, ...result } = user;
        return result;
    }

}
