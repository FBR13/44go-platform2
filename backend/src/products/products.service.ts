import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';

export type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  created_at?: string;
  /** jsonb ou texto — o frontend normaliza */
  sizes?: unknown;
  /** jsonb array de URLs — opcional; senão usa `image_url` */
  images?: unknown;
};

@Injectable()
export class ProductsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(query?: ProductListQueryDto): Promise<ProductRow[]> {
    const q = query?.q?.trim();
    const category = query?.category?.trim();

    let req = this.supabase.getClient().from('products').select('*');

    if (q) {
      req = req.ilike('name', `%${q}%`);
    }
    if (category) {
      req = req.eq('category', category);
    }

    const { data, error } = await req;

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return (data ?? []) as ProductRow[];
  }

  async listCategories(): Promise<string[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select('category');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const set = new Set<string>();
    for (const row of data ?? []) {
      const c = (row as { category?: string | null }).category;
      if (c && String(c).trim()) {
        set.add(String(c).trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  async findOne(id: string): Promise<ProductRow> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Produto #${id} não encontrado`);
    }
    return data as ProductRow;
  }

  async create(createProductDto: CreateProductDto): Promise<ProductRow> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .insert([createProductDto]) // Insere os dados que vieram do Frontend
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Erro ao criar produto: ${error.message}`);
    }

    return data as ProductRow;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductRow> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .update(updateProductDto) // Atualiza apenas os campos enviados
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Erro ao atualizar produto: ${error.message}`);
    }

    return data as ProductRow;
  }

  async remove(id: string): Promise<{ message: string }> {
    const { error } = await this.supabase
      .getClient()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(`Erro ao deletar produto: ${error.message}`);
    }

    return { message: `Produto #${id} removido com sucesso` };
  }
}
