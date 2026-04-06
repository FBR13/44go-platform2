'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Package, Clock, CheckCircle, Truck, ShoppingBag, Star } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: '⏳ Aguardando Pagamento', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
  paid: { label: '✅ Pagamento Aprovado', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  shipped: { label: '🚚 Saiu para Entrega', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck },
  delivered: { label: '📦 Pedido Entregue', className: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchMyOrders() {
      try {
        // Busca os pedidos do usuário, MAS IGNORA os que estão em 'cart' (carrinho)
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            order_items ( quantity )
          `)
          .eq('customer_id', user!.id)
          .neq('status', 'cart') // Não mostra carrinhos abandonados
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Formata os dados
        const formattedOrders = data?.map(order => ({
          ...order,
          short_id: order.id.split('-')[0].toUpperCase(),
          total_items: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        })) || [];

        setOrders(formattedOrders);
      } catch (error) {
        console.error('Erro ao buscar compras:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyOrders();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Faça login para ver suas compras</h1>
        <Link href="/auth/login" className="bg-[#fa7109] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e06300] transition-colors">Entrar na minha conta</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-[70vh]">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 p-3 rounded-full text-[#fa7109]">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Minhas Compras</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Você ainda não fez nenhuma compra</h2>
          <p className="text-gray-500 mb-6">Que tal explorar as lojas da região e encontrar produtos incríveis?</p>
          <Link href="/products" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Package };
            const StatusIcon = statusInfo.icon;

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-gray-900 text-lg">Pedido #{order.short_id}</h3>
                    <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {order.total_items} {order.total_items === 1 ? 'item' : 'itens'} no valor de <strong className="text-gray-900">{formatPrice(order.total_amount)}</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-3 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${statusInfo.className}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </div>
                  
                  {/* Se estiver entregue, chama pra avaliar. Se não, só acompanha. */}
                  {order.status === 'delivered' ? (
                    <Link 
                      href={`/orders/${order.id}`}
                      className="text-sm font-bold text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-1.5"
                    >
                      <Star className="w-4 h-4 fill-purple-700" />
                      Avaliar Produtos
                    </Link>
                  ) : (
                    <Link 
                      href={`/orders/${order.id}`}
                      className="text-sm font-bold text-[#fa7109] hover:underline"
                    >
                      Acompanhar &rarr;
                    </Link>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}