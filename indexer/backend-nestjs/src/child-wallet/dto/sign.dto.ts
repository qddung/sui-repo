import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SignTransactionDto {
  @IsString()
  @IsNotEmpty()
  ephemeralKeyId: string;

  @IsString()
  @IsNotEmpty()
  txPayload: string;

  @IsString()
  @IsOptional()
  requestedScope?: string;
}

