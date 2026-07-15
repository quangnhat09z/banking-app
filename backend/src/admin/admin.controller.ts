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
  DefaultValuePipe,
  ParseIntPipe,
  Delete,
  Post
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { GetLedgerEntriesDto } from './dto/get-ledger-entries.dto';
import { IsEnum } from 'class-validator';

//log
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { AuditService } from '../audit/audit.service';

import { UsersService } from '../users/users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { CreateTellerDto } from 'src/auth/dto/create-teller.dto';

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
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
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
  getAuditLogs(@Query() dto: GetAuditLogsDto,) {
    return this.auditService.findAll(dto);
  }

  // Xem audit log của 1 entity cụ thể
  @Get('audit-logs/:entity/:id')
  getEntityAuditLogs(
    @Param('entity') entity: AuditEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.auditService.findByEntity(entity, id);
  }

  // xóa mềm user
  @Delete('users/:id')
  @UseInterceptors(AuditInterceptor)
  @AuditLog({ action: AuditAction.ACCOUNT_DELETED, entity: AuditEntity.USER })
  async softDeleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    await this.usersService.softDeleteUser(id, admin.userId);
    return { message: 'User soft deleted successfully' };
  }

  // Lấy danh sách user đã bị xóa mềm
  @Get('users/deleted')
  getDeletedUsers() {
    return this.usersService.findDeletedUsers();
  }

  // Lấy lịch sử thay đổi của tài khoản
  @Get('users/:id/history')
  getAccountHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getAccountHistory(id);
  }

  // Cập nhật email của user
  @Patch('users/:id/email')
  @UseInterceptors(AuditInterceptor)
  @AuditLog({ action: AuditAction.USER_UPDATED, entity: AuditEntity.USER })
  updateEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('email') newEmail: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.usersService.updateEmail(id, newEmail, admin.userId);
  }
  @Get('accounts/:id/verify-balance')
  verifyAccountBalance(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.verifyAccountBalance(id);
  }

  @Get('ledger-entries')
  getAllLedgerEntries(@Query() dto: GetLedgerEntriesDto) {
    return this.adminService.getAllLedgerEntries(dto);
  }

  @Get('accounts/:id/ledger-entries')
  getAccountLedgerEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: GetLedgerEntriesDto,
  ) {
    return this.adminService.getAccountLedgerEntries(id, dto);
  }

  @Post('tellers')
  @UseInterceptors(AuditInterceptor)
  @AuditLog({ action: AuditAction.REGISTER, entity: AuditEntity.USER })
  createTeller(@Body() dto: CreateTellerDto) {
    return this.adminService.createTeller(dto);
  }
}
