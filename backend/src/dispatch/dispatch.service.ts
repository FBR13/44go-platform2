import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);
  private readonly OFFER_TIMEOUT_MS = 30000; // 30 segundos para o motoboy aceitar

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Gatilho principal: Chamado quando o pedido é PAGO (pelo webhook do Stripe)
   */
  async startDispatchForOrder(orderId: string, storeLat: number, storeLng: number) {
    this.logger.log(`🚀 Iniciando Motor de Despacho para o Pedido: ${orderId}`);
    await this.processNextCourier(orderId, storeLat, storeLng);
  }

  /**
   * Função Recursiva: Tenta o melhor, se falhar, tenta o próximo.
   */
  private async processNextCourier(orderId: string, storeLat: number, storeLng: number) {
    const supabase = this.supabaseService.getAdminClient(); // Usamos Admin para ter poder total

    // 1. Busca o Ranking de entregadores num raio de 5km (5000 metros)
    const { data: rankedCouriers, error: rankError } = await supabase
      .rpc('find_best_couriers', {
        store_lat: storeLat,
        store_lng: storeLng,
        max_radius_meters: 5000 
      });

    if (rankError) {
      this.logger.error(`Erro ao buscar ranking: ${rankError.message}`);
      throw new InternalServerErrorException('Falha no algoritmo de match.');
    }

    if (!rankedCouriers || rankedCouriers.length === 0) {
      this.logger.warn(`⚠️ Nenhum entregador disponível num raio de 5km para o pedido ${orderId}.`);
      // Aqui entraria a lógica de "Redistribuição" (Aumentar o raio ou avisar a loja)
      return;
    }

    // 2. Descobre quem JÁ recusou ou ignorou essa corrida
    const { data: previousAttempts } = await supabase
      .from('dispatch_attempts')
      .select('courier_id')
      .eq('order_id', orderId);

    const attemptedCourierIds = previousAttempts?.map(a => a.courier_id) || [];

    // 3. Filtra a lista deixando apenas quem AINDA NÃO recebeu a oferta
    const availableCouriers = rankedCouriers.filter(
      courier => !attemptedCourierIds.includes(courier.courier_id)
    );

    if (availableCouriers.length === 0) {
      this.logger.warn(`❌ Todos os entregadores próximos recusaram o pedido ${orderId}.`);
      return;
    }

    // 4. Pega o absoluto MELHOR entregador da lista (Top 1)
    const bestCourier = availableCouriers[0];

    this.logger.log(`🎯 Oferta gerada! Entregador ID: ${bestCourier.courier_id} | Score: ${bestCourier.score}`);

    // 5. Insere a oferta no banco (Isso vai "apitar" no celular dele via WebSockets)
    const { data: offer, error: offerError } = await supabase
      .from('dispatch_attempts')
      .insert([{
        order_id: orderId,
        courier_id: bestCourier.courier_id,
        status: 'pending',
        score: bestCourier.score
      }])
      .select()
      .single();

    if (offerError) {
      this.logger.error(`Erro ao criar oferta: ${offerError.message}`);
      return;
    }

    // 6. Inicia a contagem regressiva (SLA de Aceite)
    setTimeout(() => {
      this.checkOfferTimeout(offer.id, orderId, storeLat, storeLng);
    }, this.OFFER_TIMEOUT_MS);
  }

  /**
   * Checa se o entregador ignorou o pedido depois dos 30 segundos
   */
  private async checkOfferTimeout(attemptId: string, orderId: string, storeLat: number, storeLng: number) {
    const supabase = this.supabaseService.getAdminClient();

    // Verifica o status atual da oferta
    const { data: attempt } = await supabase
      .from('dispatch_attempts')
      .select('status')
      .eq('id', attemptId)
      .single();

    if (attempt && attempt.status === 'pending') {
      this.logger.warn(`⏰ Entregador ignorou a oferta ${attemptId} (Timeout). Marcando como expirada.`);
      
      // Marca como timeout
      await supabase
        .from('dispatch_attempts')
        .update({ status: 'timeout' })
        .eq('id', attemptId);

      // Punição: Podemos baixar o acceptance_rate dele aqui depois (Score do Vendedor/Entregador)

      // Chama a roleta de novo para o PRÓXIMO entregador!
      await this.processNextCourier(orderId, storeLat, storeLng);
    } else {
      this.logger.log(`✅ A oferta ${attemptId} já foi respondida (aceita/recusada). O ciclo de timeout foi cancelado.`);
    }
  }

  // =========================================================================
  // 🔥 NOVO: RECEBE A RESPOSTA DO ENTREGADOR (SIM ou NÃO) E VALIDA
  // =========================================================================
  async handleCourierResponse(attemptId: string, courierId: string, action: 'accept' | 'reject') {
    const supabase = this.supabaseService.getAdminClient();

    // 1. Verifica se a oferta ainda é dele e se ainda está 'pending'
    const { data: attempt, error } = await supabase
      .from('dispatch_attempts')
      .select(`
        *,
        orders!inner (
          id,
          stores!inner (latitude, longitude)
        )
      `)
      .eq('id', attemptId)
      .eq('courier_id', courierId)
      .single();

    if (error || !attempt) {
      this.logger.error(`Oferta não encontrada ou erro no banco: ${error?.message}`);
      throw new InternalServerErrorException('Oferta não encontrada ou você não tem permissão.');
    }

    if (attempt.status !== 'pending') {
      return { success: false, message: 'Oferta expirada ou já respondida.' };
    }

    if (action === 'accept') {
      this.logger.log(`✅ Entregador ${courierId} ACEITOU o pedido ${attempt.order_id}`);
      
      // Atualiza a oferta para aceita
      await supabase
        .from('dispatch_attempts')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', attemptId);
      
      // Bloqueia o pedido para este motoboy e muda status
      await supabase
        .from('orders')
        .update({ courier_id: courierId, status: 'dispatching' })
        .eq('id', attempt.order_id);
      
      return { success: true, message: 'Corrida confirmada! Vá para a loja.' };
    } 
    
    if (action === 'reject') {
      this.logger.log(`❌ Entregador ${courierId} RECUSOU o pedido ${attempt.order_id}`);
      
      // Atualiza a oferta para rejeitada
      await supabase
        .from('dispatch_attempts')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', attemptId);
      
      // Pega os dados da loja que vieram no join para chamar o próximo
      const storeData = Array.isArray(attempt.orders.stores) ? attempt.orders.stores[0] : attempt.orders.stores;
      const storeLat = storeData.latitude;
      const storeLng = storeData.longitude;

      // CHAMA A ROLETA DE NOVO IMEDIATAMENTE (Passa pro próximo da fila)
      await this.processNextCourier(attempt.order_id, storeLat, storeLng);

      return { success: true, message: 'Corrida recusada. Chamando próximo.' };
    }
  }
}