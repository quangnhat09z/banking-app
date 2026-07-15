import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateTellerDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    full_name!: string;

    @IsEmail()
    @MaxLength(150)
    email!: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(72) // bcrypt giới hạn 72 bytes
    password!: string;
}