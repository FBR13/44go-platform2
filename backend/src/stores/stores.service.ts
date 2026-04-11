import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StoresService {
  // Criamos um logger para investigar o que o NestJS está recebendo
  private readonly logger = new Logger(StoresService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createStoreDto: CreateStoreDto) {
    const supabase = this.supabaseService.getClient();

    // 👇 O ESPIÃO: Isso vai aparecer no terminal onde o NestJS está rodando
    this.logger.log('--- TENTANDO CRIAR LOJA ---');
    this.logger.log(`Dados recebidos do Frontend: ${JSON.stringify(createStoreDto)}`);

    // Validação extra de segurança
    if (!createStoreDto.seller_id) {
      throw new InternalServerErrorException('O seller_id chegou VAZIO no backend!');
    }

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
      this.logger.error(`Erro ao inserir no Supabase: ${error.message}`);
      throw new InternalServerErrorException(`Erro no Supabase: ${error.message}`);
    }

    this.logger.log(`Loja criada com sucesso! ID: ${data.id}`);
    return data;
  }

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

  // ===========================================================================
  // 🔥 NOVO: MOTOR DE ELEGIBILIDADE - MODO ENTREGA RÁPIDA (POSTGIS)
  // ===========================================================================
  async findFastDeliveryStores(lat: number, lng: number) {
    this.logger.log(`--- BUSCANDO LOJAS ENTREGA RÁPIDA (Lat: ${lat}, Lng: ${lng}) ---`);
    const supabase = this.supabaseService.getClient();

    // Chama a RPC criada no Supabase para cálculo espacial
    const { data, error } = await supabase
      .rpc('get_fast_delivery_stores', { 
        user_lat: lat, 
        user_lng: lng 
      });

    if (error) {
      this.logger.error(`Erro na RPC PostGIS: ${error.message}`);
      throw new InternalServerErrorException('Erro crítico ao calcular áreas de entrega.');
    }

    if (!data || data.length === 0) {
      this.logger.log('Nenhuma loja elegível no raio. Acionando Fallback para Marketplace.');
      return {
        eligible: false,
        fallbackTo: 'MARKETPLACE',
        message: 'Nenhuma loja com entrega rápida no seu raio atual.',
        stores: []
      };
    }

    // Engine de Cálculo (SLA e ETA Dinâmico)
    const storesWithEta = data.map(store => {
      const distanceKm = store.distance_meters / 1000;
      
      // Lógica de Negócio Centralizada no Backend:
      // Exemplo: 15 min preparo base + 4 min por KM percorrido
      const basePrepTime = 15;
      const timePerKm = 4;
      const etaMinutes = Math.round(basePrepTime + (distanceKm * timePerKm));

      return {
        ...store,
        distance_km: Number(distanceKm.toFixed(1)),
        eta_minutes: etaMinutes,
        eta_range: `${etaMinutes - 5}-${etaMinutes + 5} min` // Padrão iFood
      };
    });

    this.logger.log(`Sucesso: ${storesWithEta.length} lojas prontas para Entrega Rápida.`);

    return {
      eligible: true,
      fallbackTo: null,
      stores: storesWithEta
    };
  }
  // ===========================================================================

  findOne(id: string) {
    return `This action returns a #${id} store`;
  }

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