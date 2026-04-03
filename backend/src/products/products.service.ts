import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';

// Ajustado para refletir EXATAMENTE as colunas da sua tabela 'products'
export type ProductRow = {
  id: string;
  store_id: string;
  title: string;          // No banco é 'title', não 'name'
  description: string | null;
  base_price: number;     // No banco é 'base_price', não 'price'
  image_url: string | null;
  category: string | null;
  stock_quantity: number; // Coluna int4 do seu banco
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Busca todos os produtos com filtros de busca e categoria
   */
  async findAll(query?: ProductListQueryDto): Promise<ProductRow[]> {
    const q = query?.q?.trim();
    const category = query?.category?.trim();

    let req = this.supabase.getClient().from('products').select('*');

    // Filtro de busca: Ajustado para 'title'
    if (q) {
      req = req.ilike('title', `%${q}%`);
    }

    // Filtro de categoria
    if (category) {
      req = req.eq('category', category);
    }

    const { data, error } = await req.order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Erro ao buscar produtos: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []) as ProductRow[];
  }

  /**
   * Lista categorias únicas para preencher filtros no Frontend
   */
  async listCategories(): Promise<string[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      this.logger.error(`Erro ao listar categorias: ${error.message}`);
      throw new InternalServerErrorException('Não foi possível carregar as categorias.');
    }

    // Remove duplicatas e valores vazios de forma eficiente
    const categoriesSet = new Set<string>();
    data?.forEach((row: any) => {
      if (row.category?.trim()) {
        categoriesSet.add(row.category.trim());
      }
    });

    return Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  /**
   * Busca um produto específico pelo ID
   */
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

  /**
   * Cria um novo produto
   * Dica: Garanta que o seu CreateProductDto use 'title' e 'base_price'
   */
  async create(createProductDto: CreateProductDto): Promise<ProductRow> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .insert([createProductDto])
      .select()
      .single();

    if (error) {
      this.logger.error(`Erro na criação: ${error.message}`);
      throw new InternalServerErrorException(`Erro ao criar produto: ${error.message}`);
    }

    return data as ProductRow;
  }

  /**
   * Atualiza dados do produto
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductRow> {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .update({
        ...updateProductDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Erro na atualização: ${error.message}`);
      throw new InternalServerErrorException(`Erro ao atualizar produto: ${error.message}`);
    }

    return data as ProductRow;
  }

  /**
   * Remove um produto (Delete físico)
   */
  async remove(id: string): Promise<{ message: string }> {
    const { error } = await this.supabase
      .getClient()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Erro ao remover: ${error.message}`);
      throw new InternalServerErrorException(`Erro ao deletar produto: ${error.message}`);
    }

    return { message: `Produto #${id} removido com sucesso` };
  }
}