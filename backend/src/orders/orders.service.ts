import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

type ProductLite = {
  id: string;
  store_id: string;
  price: number;
};

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(accessToken: string, dto: CreateOrderDto) {
    const userId = await this.supabase.getUserIdFromJwt(accessToken);
    if (!userId) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    if (!dto.items?.length) {
      throw new BadRequestException('Nenhum item no pedido.');
    }

    const client = this.supabase.getClient();
    const productIds = [...new Set(dto.items.map((i) => i.product_id))];

    const { data: products, error: pErr } = await client
      .from('products')
      .select('id, store_id, price')
      .in('id', productIds);

    if (pErr) {
      throw new InternalServerErrorException(pErr.message);
    }
    if (!products?.length) {
      throw new BadRequestException('Nenhum produto válido encontrado.');
    }

    const productMap = new Map(
      (products as ProductLite[]).map((p) => [p.id, p]),
    );

    const byStore = new Map<string, CreateOrderDto['items']>();
    for (const line of dto.items) {
      const p = productMap.get(line.product_id);
      if (!p) {
        throw new BadRequestException(
          `Produto ${line.product_id} não encontrado.`,
        );
      }
      const sid = p.store_id;
      if (!byStore.has(sid)) {
        byStore.set(sid, []);
      }
      byStore.get(sid)!.push(line);
    }

    const created: Record<string, unknown>[] = [];

    for (const [storeId, storeLines] of byStore) {
      const merged = new Map<
        string,
        { product_id: string; quantity: number; size: string | null }
      >();
      for (const line of storeLines) {
        const k = `${line.product_id}::${line.size ?? ''}`;
        const prev = merged.get(k);
        if (prev) {
          prev.quantity += line.quantity;
        } else {
          merged.set(k, {
            product_id: line.product_id,
            quantity: line.quantity,
            size: line.size ?? null,
          });
        }
      }
      const lines = Array.from(merged.values());

      let total = 0;
      const itemRows: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
        size: string | null;
      }> = [];

      for (const line of lines) {
        const p = productMap.get(line.product_id)!;
        const unit = Number(p.price);
        total += unit * line.quantity;
        itemRows.push({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: unit,
          size: line.size ?? null,
        });
      }

      const { data: order, error: oErr } = await client
        .from('orders')
        .insert({
          user_id: userId,
          store_id: storeId,
          status: 'pending',
          total_amount: total,
          delivery_type: dto.delivery_type,
          payment_method: dto.payment_method,
          address_line1: dto.address_line1,
          address_line2: dto.address_line2 ?? null,
          city: dto.city,
          state: dto.state,
          zip_code: dto.zip_code,
        })
        .select('id, user_id, store_id, status, total_amount, created_at')
        .single();

      if (oErr) {
        throw new InternalServerErrorException(oErr.message);
      }

      const { error: oiErr } = await client.from('order_items').insert(
        itemRows.map((r) => ({
          order_id: order.id,
          product_id: r.product_id,
          quantity: r.quantity,
          unit_price: r.unit_price,
          size: r.size,
        })),
      );

      if (oiErr) {
        await client.from('orders').delete().eq('id', order.id);
        throw new InternalServerErrorException(oiErr.message);
      }

      created.push(order as Record<string, unknown>);
    }

    return { success: true, orders: created };
  }

  async findMine(accessToken: string) {
    const userId = await this.supabase.getUserIdFromJwt(accessToken);
    if (!userId) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  findAll() {
    return `This action returns all orders`;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Pedido #${id} não encontrado`);
    }
    return data;
  }

  update(id: string, _updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
