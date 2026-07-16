// src/auth/dto/change-password.dto.ts
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  new_password!: string;
}