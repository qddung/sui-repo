import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateEphemeralKeyDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scope?: string[];
}

