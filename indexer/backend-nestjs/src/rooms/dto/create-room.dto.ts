import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  initialParticipants?: string[];

  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  onchainObjectId: string;

  @IsString()
  @IsOptional()
  hostCapId?: string;
}

