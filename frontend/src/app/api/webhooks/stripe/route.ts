import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// NOVO: Cliente Admin para conseguir atualizar o banco sem ser bloqueado pela segurança
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
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