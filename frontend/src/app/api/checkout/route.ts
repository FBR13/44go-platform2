import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(req: Request) {
  // 1. Verificação de Segurança (Evita o erro de apiKey vazia no Build da Vercel)
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente faltando no servidor.');
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta (API Keys)' },
      { status: 500 }
    );
  }

  // 2. Inicia os clientes apenas dentro da requisição
  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2023-10-16' as any,
  });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }

    // 3. Buscar o pedido (usando service_role para ignorar RLS)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        stores ( stripe_account_id, commission_percent, name ),
        order_items ( quantity, unit_price, products ( title ) )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Erro no Banco: ${orderError?.message || 'Pedido não encontrado'}`);
    }

    const store = order.stores as any;
    if (!store?.stripe_account_id) {
      throw new Error('A loja não possui uma conta Stripe conectada.');
    }

    // 4. Preparar itens para o Checkout
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: 'brl',
        product_data: { name: item.products.title },
        unit_amount: Math.round(item.unit_price * 100), // Converte para centavos
      },
      quantity: item.quantity,
    }));

    // 5. Cálculo do Split (Taxa da plataforma)
    // Se não houver comissão cadastrada, usamos 0 como padrão
    const commissionPercent = store.commission_percent || 0;
    const totalAmountCentavos = Math.round(order.total_amount * 100);
    const feeAmount = Math.round(totalAmountCentavos * (commissionPercent / 100));

    // 6. Criar Sessão de Checkout com Split de Pagamento
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/orders/${orderId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/orders/${orderId}?canceled=true`,
      metadata: { orderId },
      
      payment_intent_data: {
        application_fee_amount: feeAmount, // Comissão do 44Go
        transfer_data: {
          destination: store.stripe_account_id, // Valor líquido para o Lojista
        },
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ Erro no Checkout:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}