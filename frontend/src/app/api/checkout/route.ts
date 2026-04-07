import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

// NOVO: Criamos o cliente "Admin" usando a service_role para burlar o bloqueio (RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 1. Buscar o pedido usando o supabaseAdmin!
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        stores ( stripe_account_id, commission_percent, name ),
        order_items ( quantity, unit_price, products ( title ) )
      `)
      .eq('id', orderId)
      .single();

    // CÓDIGO ESPIÃO: Se der erro, mostra exatamente o que o banco reclamou
    if (orderError || !order) {
      throw new Error(`Erro no Banco: ${orderError?.message || orderError?.details || 'Pedido não existe no banco'}`);
    }

    const store = order.stores;
    if (!store?.stripe_account_id) {
      throw new Error('A loja deste produto não tem um stripe_account_id cadastrado no Supabase!');
    }

    // 2. Preparar os itens para o Stripe
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: 'brl',
        product_data: { name: item.products.title },
        unit_amount: Math.round(item.unit_price * 100), // Stripe usa centavos
      },
      quantity: item.quantity,
    }));

    // 3. Calcular a sua comissão (Application Fee) em centavos
    const totalAmount = order.total_amount * 100;
    const feeAmount = Math.round(totalAmount * (store.commission_percent / 100));

    // 4. Criar Sessão de Checkout com SPLIT
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/orders/${orderId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/orders/${orderId}?canceled=true`,

      // 👉 ADICIONADO AQUI: Metadata para o Webhook saber qual pedido atualizar!
      metadata: { orderId },

      // A MÁGICA DO SPLIT ACONTECE AQUI:
      payment_intent_data: {
        application_fee_amount: feeAmount, // O que fica para o 44Go
        transfer_data: {
          destination: store.stripe_account_id, // O que vai para o Lojista
        },
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Erro no Checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}