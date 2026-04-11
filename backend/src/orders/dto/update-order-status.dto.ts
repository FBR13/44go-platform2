import { IsIn, IsNotEmpty, IsString } from 'class-validator';


export type OrderStatus = 'pending' | 'dispatching' | 'at_store' | 'collected' | 'on_the_way' | 'delivered' | 'canceled';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['at_store', 'collected', 'on_the_way', 'delivered'])
  newStatus!: OrderStatus;
}