import { IsArray, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateChildWalletDto {
  @IsArray()
  @IsString({ each: true })
  scope: string[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  expiresInHours?: number;
}

