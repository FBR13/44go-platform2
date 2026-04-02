import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da loja é obrigatório' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'O ID do vendedor é obrigatório' })
  seller_id!: string;
}