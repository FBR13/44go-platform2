import { IsOptional, IsString } from 'class-validator';

export class ProductListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
