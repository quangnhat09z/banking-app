// src/transactions/transactions.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser} from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  async transfer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTransferDto,
  ) {
    return this.transactionsService.transfer(user.userId, dto);
  }
}