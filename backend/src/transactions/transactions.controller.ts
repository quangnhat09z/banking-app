// src/transactions/transactions.controller.ts
import { Body, Controller, Get, Post, UseGuards, Query, ParseUUIDPipe, Param, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';

//log
import { AuditInterceptor } from 'src/audit/interceptors/audit.interceptor';
import { AuditLog } from 'src/audit/decorators/audit-log.decorator';
import { AuditAction, AuditEntity } from 'src/audit/entities/audit-log.entity';

import { UserRole } from 'src/users/entities/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post('transfer')
  @UseInterceptors(AuditInterceptor)
  @AuditLog({ action: AuditAction.TRANSFER_CREATED, entity: AuditEntity.TRANSACTION })
  async transfer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTransferDto,
  ) {
    return this.transactionsService.transfer(user.userId, user.role as UserRole, dto);
  }

  @Post(':id/reverse')
  @UseInterceptors(AuditInterceptor)
  @AuditLog({ action: AuditAction.TRANSFER_REVERSED, entity: AuditEntity.TRANSACTION })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.reverseTransaction(id, user.userId);
  }

  @Get()
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() dto: GetTransactionsDto,
  ) {
    return this.transactionsService.getHistory(user.userId, dto);
  }
}