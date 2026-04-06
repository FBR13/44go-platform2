'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Package, Clock, CheckCircle, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  cart: { label: 'Em Carrinho', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ShoppingBag },
  pending: { label: 'Aguardando Pagamento', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
  paid: { label: 'Pagamento Aprovado', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  shipped: { label: 'Enviado / Concluído', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck },
};

export default function SellerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrders() {
      try {
        // 1. Descobre quais são as lojas deste vendedor
        const { data: myStores, error: storesError } = await supabase
          .from('stores')
          .select('id')
          .eq('seller_id', user!.id);

        if (storesError) throw storesError;

        const storeIds = myStores?.map(s => s.id) || [];

        if (storeIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // 2. Busca os pedidos dessas lojas com os itens (SEM a tabela users no join)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id, status, total_amount, created_at, customer_id,
            order_items ( quantity )
          `)
          .in('store_id', storeIds)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // 3. Pega os IDs únicos dos clientes para buscar os nomes separadamente
        const customerIds = [...new Set(ordersData?.map(o => o.customer_id).filter(Boolean))];
        let customersMap: Record<string, string> = {};

        if (customerIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', customerIds);
          
          if (!usersError && usersData) {
            usersData.forEach(u => {
              customersMap[u.id] = u.full_name;
            });
          }
        }

        // 4. Formata os dados unindo as informações para a tela
        const formattedOrders = ordersData?.map(order => {
          return {
            ...order,
            short_id: order.id.split('-')[0].toUpperCase(),
            customer_name: customersMap[order.customer_id] || 'Cliente anônimo',
            total_items: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
          };
        }) || [];

        setOrders(formattedOrders);
      } catch (error: any) {
        console.error('Erro detalhado ao buscar pedidos:', error.message || error);
        toast.error('Não foi possível carregar os pedidos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gerenciar Pedidos</h1>
          <p className="text-gray-500 mt-1">Acompanhe as vendas da sua loja</p>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#fa7109] transition-colors bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          &larr; Voltar ao Painel
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum pedido ainda</h2>
          <p className="text-gray-500">Quando os clientes comprarem seus produtos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Package };
            const StatusIcon = statusInfo.icon;

            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-orange-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                
                {/* LADO ESQUERDO: Info principal */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-gray-900 text-lg">#{order.short_id}</h3>
                    <span className="text-sm text-gray-400 font-medium">{new Date(order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{order.customer_name}</span>
                    <span className="text-gray-300">•</span>
                    <span>{order.total_items} {order.total_items === 1 ? 'item' : 'itens'}</span>
                  </div>
                  
                  <p className={`font-bold text-lg ${order.total_amount > 0 ? 'text-[#fa7109]' : 'text-gray-400'}`}>
                    {order.total_amount > 0 ? formatPrice(order.total_amount) : 'Valor a calcular'}
                  </p>
                </div>

                {/* LADO DIREITO: Status e Botão */}
                <div className="flex flex-col sm:items-end gap-4 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${statusInfo.className}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </div>
                  
                  <Link 
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gray-50 text-gray-900 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 hover:text-[#fa7109] transition-colors border border-gray-200 group-hover:border-orange-200"
                  >
                    Ver detalhes
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}