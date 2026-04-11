import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client!: SupabaseClient;
  private adminClient!: SupabaseClient;

  constructor() {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
    const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) as string;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ ERRO: Faltam variáveis de ambiente do Supabase no backend.');
    } else {
      this.client = createClient(supabaseUrl, supabaseAnonKey);
    }

    if (supabaseUrl && supabaseServiceKey) {
      this.adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new InternalServerErrorException('Supabase Client não inicializado.');
    }
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new InternalServerErrorException(
        'Supabase Admin Client não configurado. Verifique a SUPABASE_SERVICE_ROLE_KEY no .env'
      );
    }
    return this.adminClient;
  }

  // =========================================================================
  // 🔥 A FUNÇÃO QUE ESTAVA FALTANDO PARA LER O TOKEN JWT DO CLIENTE
  // =========================================================================
  async getUserIdFromJwt(jwt: string): Promise<string | null> {
    try {
      const supabase = this.getClient();
      const { data: { user }, error } = await supabase.auth.getUser(jwt);
      
      if (error || !user) {
        return null;
      }
      
      return user.id;
    } catch (err) {
      console.error('Erro ao decodificar JWT:', err);
      return null;
    }
  }
}