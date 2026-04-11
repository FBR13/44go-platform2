import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !endpointSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente faltando no servidor (webhook).');
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta (API Keys)' },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecret);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.text();

  const headersList = await headers();
  const sig = headersList.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Aqui nós pegamos o orderId que foi passado na criação da sessão
    const orderId = session.metadata?.orderId;

    if (orderId) {
      // USANDO O ADMIN PARA ATUALIZAR O STATUS
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (error) {
        console.error('Erro ao atualizar pedido no banco:', error);
      } else {
        console.log(`Pedido ${orderId} atualizado para 'paid' com sucesso!`);
      }
    }
  }

  return NextResponse.json({ received: true });
}