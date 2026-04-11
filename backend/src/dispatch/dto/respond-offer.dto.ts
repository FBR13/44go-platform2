import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class RespondOfferDto {
  @IsNotEmpty()
  @IsString()
  attemptId!: string;

  @IsNotEmpty()
  @IsString()
  courierId!: string; // Quem está respondendo

  @IsNotEmpty()
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';
}