import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StoresService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createStoreDto: CreateStoreDto) {
    const supabase = this.supabaseService.getClient();

    const generatedSlug = createStoreDto.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data, error } = await supabase
      .from('stores')
      .insert([
        { 
          name: createStoreDto.name, 
          seller_id: createStoreDto.seller_id,
          slug: generatedSlug
        }
      ])
      .select()
      .single(); 

    if (error) {
      throw new InternalServerErrorException(`Erro no Supabase: ${error.message}`);
    }

    return data;
  }

  // 👇 AQUI ESTÁ A CORREÇÃO QUE VAI FAZER O CARROSSEL FUNCIONAR
  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) {
      throw new InternalServerErrorException(`Erro ao buscar lojas: ${error.message}`);
    }

    return data;
  }

  findOne(id: string) {
    return `This action returns a #${id} store`;
  }

  // 👇 AQUI ESTÁ A CORREÇÃO QUE SALVA AS IMAGENS E TEXTOS
  async update(id: string, updateStoreDto: UpdateStoreDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('stores')
      .update({
        name: updateStoreDto.name,
        description: updateStoreDto.description,
        logo_url: updateStoreDto.logo_url,
        banner_url: updateStoreDto.banner_url,
        phone: updateStoreDto.phone,
        whatsapp: updateStoreDto.whatsapp,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Erro ao atualizar loja: ${error.message}`);
    }

    return data;
  }

  remove(id: string) {
    return `This action removes a #${id} store`;
  }
} 