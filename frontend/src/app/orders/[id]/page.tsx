'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Package, Store, CheckCircle, Clock, Truck, MessageCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  pending: { label: 'Aguardando Pagamento', color: 'text-orange-700 bg-orange-100', icon: Clock, description: 'O lojista está aguardando o seu pagamento.' },
  paid: { label: 'Pagamento Aprovado', color: 'text-green-700 bg-green-100', icon: CheckCircle, description: 'Pagamento confirmado! O lojista está preparando seu pedido.' },
  shipped: { label: 'Saiu para Entrega', color: 'text-blue-700 bg-blue-100', icon: Truck, description: 'Seu pedido já está a caminho do endereço de entrega.' },
};

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrderDetails() {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`*, stores ( seller_id ), order_items ( id, quantity, unit_price, products ( title, image_url ) )`)
          .eq('id', params.id)
          .eq('customer_id', user!.id)
          .single();

        if (orderError || !orderData) throw new Error('Pedido não encontrado.');
        setOrder(orderData);

        const store = Array.isArray(orderData.stores) ? orderData.stores[0] : orderData.stores;

        if (store?.seller_id) {
          const { data: sellerData } = await supabase
            .from('users')
            .select('full_name, phone')
            .eq('id', store.seller_id)
            .single();
          setSellerInfo(sellerData);
        }
      } catch (error) {
        toast.error('Não foi possível carregar os detalhes do pedido.');
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderDetails();
  }, [user, authLoading, params.id, router]);

  if (isLoading || authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
  if (!order) return null;

  const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, color: 'text-gray-700 bg-gray-100', icon: Package, description: '' };
  const StatusIcon = statusInfo.icon;
  const shortId = order.id.split('-')[0].toUpperCase();
  const calculatedTotal = order.order_items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/orders" className="text-sm font-medium text-gray-500 hover:text-[#fa7109] transition-colors mb-2 inline-block">
            &larr; Voltar para Minhas Compras
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Pedido #{shortId}</h1>
          <p className="text-sm text-gray-500 mt-1">Realizado em {new Date(order.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border shadow-sm ${statusInfo.color}`}>
          <StatusIcon className="w-5 h-5" />
          {statusInfo.label}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-[#fa7109]" /> Produtos Comprados</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {order.order_items?.map((item: any) => (
                <li key={item.id} className="p-5 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                    {item.products?.image_url ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.products?.title}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(item.unit_price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100"><Store className="w-5 h-5 text-[#fa7109]" /> Dados da Loja</h2>
            
            {/* 👇 O BOTÃO QUE ABRE A BOLINHA FLUTUANTE 👇 */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: order.id } }))}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com o Lojista
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function setSellerInfo(sellerData: any) {
    throw new Error('Function not implemented.');
}