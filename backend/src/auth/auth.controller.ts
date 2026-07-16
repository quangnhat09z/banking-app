import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// logging
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';

import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(AuditInterceptor)
    @AuditLog({ action: AuditAction.REGISTER, entity: AuditEntity.USER })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditInterceptor)
    @AuditLog({ action: AuditAction.LOGIN, entity: AuditEntity.USER })
    login(@Body() dto: LoginDto, @Req() req: any) {
        return this.authService.login(dto, {
            user_agent: req.headers['user-agent'],
            ip_address: req.ip,
        });
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
        return this.authService.refresh(dto, {
            user_agent: req.headers['user-agent'],
            ip_address: req.ip,
        });
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AuditInterceptor)
    @AuditLog({ action: AuditAction.LOGOUT, entity: AuditEntity.USER })
    logout(@Body() dto: RefreshTokenDto) {
        return this.authService.logout(dto.refresh_token);
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    logoutAll(@CurrentUser() user: JwtPayload) {
        return this.authService.logoutAll(user.userId);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AuditInterceptor)
    @AuditLog({ action: AuditAction.PASSWORD_CHANGED, entity: AuditEntity.USER })
    changePassword(
        @CurrentUser() user: JwtPayload,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(user.userId, dto);
    }

    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    getSessions(@CurrentUser() user: JwtPayload) {
        return this.authService.getActiveSessions(user.userId);
    }
}
