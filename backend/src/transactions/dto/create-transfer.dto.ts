// src/transactions/dto/create-transfer.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty({ message: 'Target account number is not empty' })
  to_account_number!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @Min(1, { message: 'Amount must be a positive number' })
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  // Chống double-submit: client tự sinh UUID cho mỗi lần bấm "Chuyển"
  @IsString()
  @IsNotEmpty({ message: 'idempotency_key is required' })
  idempotency_key!: string;

  // TELLER tạo giao dịch hộ customer — truyền userId của customer
  // CUSTOMER không được dùng field này
  @IsOptional()
  @IsUUID()
  on_behalf_of?: string; 
}