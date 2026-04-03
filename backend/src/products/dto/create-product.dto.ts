import {
    IsString,
    IsNumber,
    IsOptional,
    IsNotEmpty,
    Min
} from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    base_price!: number;

    @IsString()
    @IsOptional()
    image_url?: string;

    @IsString()
    @IsNotEmpty()
    store_id!: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    stock_quantity!: number;
}