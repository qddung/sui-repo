import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class AutoSignDto {
  @IsString()
  @IsNotEmpty()
  txPayload: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  scope: string[];
}

