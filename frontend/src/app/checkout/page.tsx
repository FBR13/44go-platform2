'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  store_id: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Formulário
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  // 1. Busca os itens do carrinho e o endereço salvo do usuário
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/checkout');
      return;
    }

    async function fetchCheckoutData() {
      try {
        // Busca os pedidos em carrinho
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`id, store_id, order_items ( id, quantity, unit_price, product_id, products (title) )`)
          .eq('customer_id', user!.id)
          .eq('status', 'cart');

        if (ordersError) throw ordersError;

        const items: CartItem[] = [];
        ordersData?.forEach((order: any) => {
          order.order_items?.forEach((item: any) => {
            items.push({
              id: item.id,
              order_id: order.id,
              product_id: item.product_id,
              title: item.products?.title || 'Produto',
              price: item.unit_price,
              quantity: item.quantity,
              store_id: order.store_id,
            });
          });
        });

        setCartItems(items);

        // Busca o perfil para preencher o endereço automaticamente
        const { data: profile } = await supabase
          .from('users')
          .select('address, cep')
          .eq('id', user!.id)
          .single();

        if (profile) {
          if (profile.cep) setZipCode(profile.cep);
          if (profile.address) {
            // Tenta separar o endereço se já estiver salvo
            const parts = profile.address.split(',');
            setAddressLine1(parts[0] || profile.address);
            if (parts[1]) setCity(parts[1].trim());
          }
        }
      } catch (error) {
        console.error('Erro ao carregar checkout:', error);
        toast.error('Erro ao carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCheckoutData();
  }, [user, authLoading, router]);

  // 2. Finalizar Pedido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Formata o endereço completo para salvar no perfil
      const fullAddress = `${addressLine1.trim()} ${addressLine2.trim() ? '(' + addressLine2.trim() + ')' : ''}, ${city.trim()} - ${stateUf.trim()}`;

      // Atualiza o endereço do usuário no banco para as próximas compras
      await supabase
        .from('users')
        .update({ address: fullAddress, cep: zipCode.trim() })
        .eq('id', user!.id);

      // Pega os IDs únicos dos pedidos que estão no carrinho
      const orderIds = [...new Set(cartItems.map(item => item.order_id))];

      // Muda o status de todos os pedidos para 'pending' (Pendente)
      for (const orderId of orderIds) {
        const orderTotal = cartItems
          .filter(item => item.order_id === orderId)
          .reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'pending', 
            total_amount: orderTotal 
          })
          .eq('id', orderId);

        if (error) throw error;
      }

      toast.success('Pedido enviado com sucesso! 🎉');
      
      // Redireciona para a tela de sucesso passando os IDs
      const idsString = orderIds.join(',');
      router.push(`/checkout/sucesso?ids=${encodeURIComponent(idsString)}`);

    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao finalizar o pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (authLoading || isLoading) {
    return <div className="max-w-lg mx-auto text-center py-20 text-gray-500 flex justify-center"><span className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#fa7109]"></span></div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio!</h2>
        <Link href="/products" className="text-[#fa7109] font-medium hover:underline">Voltar às compras</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Finalizar pedido</h1>
      <p className="text-gray-600 text-sm mb-8">Preencha o endereço e a forma de entrega. O pagamento é simulado nesta versão.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <legend className="text-sm font-semibold text-gray-900 px-1">Endereço de entrega</legend>
            <div>
              <label htmlFor="addr1" className="block text-sm font-medium text-gray-700 mb-1">Logradouro e número</label>
              <input id="addr1" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none" placeholder="Rua, número" />
            </div>
            <div>
              <label htmlFor="addr2" className="block text-sm font-medium text-gray-700 mb-1">Complemento (opcional)</label>
              <input id="addr2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none" placeholder="Apto, bloco, referência" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none" />
              </div>
              <div>
                <label htmlFor="uf" className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                <input id="uf" required maxLength={2} value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase().slice(0, 2))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none uppercase" placeholder="GO" />
              </div>
              <div>
                <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input id="cep" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none" placeholder="00000-000" />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <legend className="text-sm font-semibold text-gray-900 px-1">Entrega</legend>
            <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none">
              <option value="delivery">Entrega no endereço</option>
              <option value="pickup">Retirada na loja</option>
            </select>
          </fieldset>

          <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
            <legend className="text-sm font-semibold text-gray-900 px-1">Pagamento (simulado)</legend>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none">
              <option value="pix">PIX</option>
              <option value="card">Cartão</option>
              <option value="cash">Dinheiro na entrega</option>
            </select>
          </fieldset>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/cart" className="text-center py-3 px-5 rounded-xl border border-gray-300 font-medium text-gray-800 hover:bg-gray-50 transition-colors">
              Voltar ao carrinho
            </Link>
            <button type="submit" disabled={submitting} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-semibold hover:opacity-95 transition-opacity disabled:opacity-60 shadow-lg shadow-orange-500/20">
              {submitting ? 'Processando…' : 'Confirmar pedido'}
            </button>
          </div>
        </form>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 border border-gray-200 rounded-xl p-6 bg-gray-50/80 shadow-inner">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo da Compra</h2>
            <ul className="text-sm text-gray-600 space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
              {cartItems.map((l) => (
                <li key={l.id} className="flex justify-between gap-2 border-b border-gray-200/50 pb-2 last:border-0">
                  <span className="truncate flex-1 font-medium text-gray-800">
                    {l.quantity}x {l.title}
                  </span>
                  <span className="font-semibold text-gray-900">{formatPrice(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-3">
                <span>Entrega</span>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded font-medium text-gray-700">A combinar</span>
              </div>
              <p className="text-xl font-black text-gray-900 border-t border-gray-200 pt-3 flex justify-between">
                <span>Total</span>
                <span className="text-[#fa7109]">{formatPrice(subtotal)}</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}