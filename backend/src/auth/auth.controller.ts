import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// logging
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @UseInterceptors(AuditInterceptor)
    @AuditLog({ action: AuditAction.REGISTER, entity: AuditEntity.USER })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @UseInterceptors(AuditInterceptor)
    @AuditLog({ action: AuditAction.LOGIN, entity: AuditEntity.USER })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
