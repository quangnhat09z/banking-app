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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { IsEnum } from 'class-validator';

class UpdateStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng cả 2 guard cho toàn bộ controller
@Roles(UserRole.ADMIN)              // Chỉ ADMIN mới được vào
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers(@Query() dto: GetUsersDto) {
    return this.adminService.getUsers(dto);
  }

  @Patch('users/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto.status);
  }
}