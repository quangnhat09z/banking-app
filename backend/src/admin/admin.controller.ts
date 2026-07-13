// src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { IsEnum } from 'class-validator';

//log
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { AuditService } from '../audit/audit.service';

class UpdateStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng cả 2 guard cho toàn bộ controller
@Roles(UserRole.ADMIN)              // Chỉ ADMIN mới được vào
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService
  ) { }

  @Get('users')
  getUsers(@Query() dto: GetUsersDto) {
    return this.adminService.getUsers(dto);
  }

  @Patch('users/:id/status')
  @UseInterceptors(AuditInterceptor)
  @AuditLog({ action: AuditAction.ACCOUNT_LOCKED, entity: AuditEntity.ACCOUNT })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: AuditEntity,
  ) {
    return this.auditService.findAll(+page, +limit, { action, entity });
  }

  // Xem audit log của 1 entity cụ thể
  @Get('audit-logs/:entity/:id')
  getEntityAuditLogs(
    @Param('entity') entity: AuditEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.auditService.findByEntity(entity, id);
  }

}