import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly accountsService: AccountsService,
        private readonly jwtService: JwtService,
    ) { }

    private sanitizeUser(user: User) {
        const { password_hash, ...result } = user;
        return result;
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

        const user = await this.usersService.create({
            email: email,
            password_hash,
            full_name: full_name,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
        });

        const account = await this.accountsService.createForUser(user.id);

        return {
            message: 'Registration successful',
            user: this.sanitizeUser(user),
            account: {
                account_number: account.account_number,
                balance: account.balance,
            },
        };
    }

    // Đăng nhập người dùng
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        
        const user = await this.usersService.findByEmail(email);
        if (!user) { 
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('User account is not active');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const access_token = this.jwtService.sign(payload);

        return {
            message: 'Login successful',
            access_token,
            user: this.sanitizeUser(user),
        };
    }

}
