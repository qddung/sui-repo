import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifySignatureDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsOptional()
  walletType?: string;
}

