import { IsString, IsNotEmpty, IsIn, IsObject, IsOptional } from 'class-validator';

export class OfferDto {
  @IsString()
  @IsNotEmpty()
  sdp: string;
}

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  sdp: string;
}

export class CandidateDto {
  @IsObject()
  @IsNotEmpty()
  candidate: any;

  @IsString()
  @IsIn(['host', 'guest'])
  from: 'host' | 'guest';
}

export class EndCallDto {
  @IsString()
  @IsIn(['host', 'guest'])
  @IsOptional()
  role?: 'host' | 'guest';
}

