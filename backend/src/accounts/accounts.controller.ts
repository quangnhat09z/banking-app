// src/accounts/accounts.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}

    @Get('me')
    async getMyAccount(@CurrentUser() user: JwtPayload) {
        const account = await this.accountsService.getMyAccount(user.userId);
        return {
            account_number: account.account_number,
            balance: account.balance,
            currency: account.currency,
            status: account.status, 
            created_at: account.created_at,
        };
    }
}
