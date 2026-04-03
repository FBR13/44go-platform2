'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Configuração de cores e textos para cada Status do Pedido
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  cart: { 
    label: '🛒 Em Carrinho', 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
  },
  pending: { 
    label: '⏳ Pendente', 
    className: 'bg-orange-100 text-orange-800 border-orange-200' 
  },
  paid: { 
    label: '✅ Pago', 
    className: 'bg-green-100 text-green-800 border-green-200' 
  },
  shipped: { 
    label: '🚚 Enviado', 
    className: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrders() {
      try {
        // 1. Descobre a loja do lojista logado
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('seller_id', user!.id)
          .single();

        if (storeError || !store) throw new Error('Loja não encontrada.');

        // 2. Busca os pedidos e a quantidade de itens amarrados a eles
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            customer_id,
            items:order_items ( quantity )
          `)
          .eq('store_id', store.id)
          .order('created_at', { ascending: false }); // Mais recentes primeiro

        if (ordersError) throw ordersError;

        // 3. Busca o nome dos clientes na tabela 'users' pública
        const customerIds = [...new Set(ordersData?.map(o => o.customer_id) || [])];
        let customersData: any[] = [];
        
        if (customerIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', customerIds);
          customersData = users || [];
        }

        // 4. Junta tudo para exibir na tela
        const enrichedOrders = ordersData?.map(order => {
          const customer = customersData.find(c => c.id === order.customer_id);
          const totalItems = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
          
          return {
            ...order,
            customer_name: customer?.full_name || 'Cliente anônimo',
            short_id: order.id.split('-')[0].toUpperCase(), 
            total_items: totalItems
          };
        }) || [];

        setOrders(enrichedOrders);

      } catch (error: any) {
        console.error(error);
        toast.error('Erro ao carregar pedidos.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin h-8 w-8 border-4 border-[#fa7109] border-t-transparent rounded-full"></span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gerenciar Pedidos</h1>
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#fa7109] transition-colors">
          &larr; Voltar ao Painel
        </Link>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center shadow-sm">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum pedido ainda</h3>
            <p className="text-gray-500">Quando os clientes adicionarem produtos ao carrinho, eles aparecerão aqui.</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
            const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div key={order.id} className="bg-white p-5 sm:p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                
                {/* Info do Pedido */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-gray-900">#{order.short_id}</h3>
                    <span className="text-xs text-gray-400 font-medium">{orderDate}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold text-gray-800">{order.customer_name}</span> • {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="font-bold text-green-600">
                    R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Status e Ação */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-md border ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                  
                  {/* A MÁGICA ACONTECE AQUI: O botão virou Link */}
                  <Link 
                    href={`/dashboard/orders/${order.id}`}
                    className="text-sm font-bold text-[#fa7109] hover:text-white hover:bg-[#fa7109] transition-colors bg-orange-50 px-4 py-2 rounded-lg text-center"
                  >
                    Ver detalhes &rarr;
                  </Link>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}