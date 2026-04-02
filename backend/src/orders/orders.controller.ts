import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

function bearerToken(authorization?: string): string | null {
  if (!authorization?.toLowerCase().startsWith('bearer ')) return null;
  const t = authorization.slice(7).trim();
  return t || null;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = bearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException(
        'Envie Authorization: Bearer <access_token> (usuário logado).',
      );
    }
    return this.ordersService.create(token, createOrderDto);
  }

  /** Pedidos do usuário autenticado (deve vir antes de :id). */
  @Get('me')
  findMine(@Headers('authorization') authorization?: string) {
    const token = bearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException(
        'Envie Authorization: Bearer <access_token>.',
      );
    }
    return this.ordersService.findMine(token);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
