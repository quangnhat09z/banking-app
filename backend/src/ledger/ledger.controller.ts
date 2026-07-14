import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { LedgerService } from './ledger.service';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Patch(':id/balance-after')
  updateBalanceAfter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('balance_after') balanceAfter: string,
  ) {
    void id;
    void balanceAfter;
    return this.ledgerService.updateEntry();
  }

  @Delete(':id')
  deleteEntry(@Param('id', ParseUUIDPipe) id: string) {
    void id;
    return this.ledgerService.deleteEntry();
  }
}
