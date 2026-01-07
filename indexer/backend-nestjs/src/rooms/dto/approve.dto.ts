import { IsString, IsOptional } from 'class-validator';

export class ApproveGuestDto {
  @IsString()
  @IsOptional()
  txDigest?: string;
}

