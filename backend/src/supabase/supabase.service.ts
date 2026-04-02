import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null = null;

  // 1. Injetamos o leitor oficial de .env do NestJS
  constructor(private configService: ConfigService) {}

  getClient(): SupabaseClient {
    if (!this.client) {
      // 2. Lemos as variáveis através do ConfigService (100% seguro contra atrasos)
      const url = this.configService.get<string>('SUPABASE_URL');
      const key = 
        this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? 
        this.configService.get<string>('SUPABASE_ANON_KEY');

      if (!url || !key) {
        throw new InternalServerErrorException(
          'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env do Backend.',
        );
      }
      
      this.client = createClient(url, key);
    }
    return this.client;
  }

  /** Valida JWT do Supabase (access_token do cliente) e devolve o id do usuário. */
  async getUserIdFromJwt(accessToken: string): Promise<string | null> {
    const { data, error } = await this.getClient().auth.getUser(accessToken);
    if (error || !data.user) return null;
    return data.user.id;
  }
}