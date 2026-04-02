import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsUUID,
} from 'class-validator';

export class OrderItemInputDto {
  @IsUUID()
  product_id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  size?: string | null;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @IsString()
  @IsNotEmpty()
  delivery_type!: string;

  @IsString()
  @IsNotEmpty()
  payment_method!: string;

  @IsString()
  @IsNotEmpty()
  address_line1!: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  zip_code!: string;
}
