import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateNonceDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

