'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Package, User, MapPin, Phone, Truck, CheckCircle, Clock, MessageCircle, Bike, Route } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  cart: { label: 'Em Carrinho', color: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: Clock },
  pending: { label: 'Pendente (Aguardando Pagamento)', color: 'text-orange-700 bg-orange-100 border-orange-200', icon: Clock },
  paid: { label: 'Pago (Preparando)', color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle },
  shipped: { label: 'Enviado / Entregue', color: 'text-blue-700 bg-blue-100 border-blue-200', icon: Truck },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCallingCourier, setIsCallingCourier] = useState(false);

  // Novos estados para a Lógica de Precificação de GPS
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(true);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrderDetails() {
      try {
        // ATUALIZADO: Puxando o endereço da loja também (stores)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`*, stores(address), order_items ( id, quantity, unit_price, products ( title, image_url ) )`)
          .eq('id', params.id)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: customerData } = await supabase
          .from('users')
          .select('full_name, phone, address, cep')
          .eq('id', orderData.customer_id)
          .single();

        setCustomer(customerData);

        // DISPARA O CÁLCULO DE ROTA SE ESTIVER PAGO
        if (orderData.status === 'paid' && customerData) {
           const storeAddress = Array.isArray(orderData.stores) ? orderData.stores[0]?.address : orderData.stores?.address;
           calculateRouteAndFee(storeAddress || 'Centro', customerData.address, customerData.cep);
        } else {
           setIsCalculatingRoute(false);
        }

      } catch (error) {
        toast.error('Erro ao carregar detalhes do pedido.');
        router.push('/dashboard/orders');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderDetails();
  }, [user, authLoading, params.id, router]);

  // ---> NOVA FUNÇÃO: MOTOR DE CÁLCULO IFOOD <---
  const calculateRouteAndFee = async (storeAddress: string, customerAddress: string, customerCep: string) => {
    setIsCalculatingRoute(true);
    try {
      // Helper para buscar Coordenadas no OpenStreetMap (Gratuito)
      const getCoords = async (address: string) => {
        const query = encodeURIComponent(`${address}, Goiânia - GO`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        return null;
      };

      const storeCoords = await getCoords(storeAddress);
      const customerCoords = await getCoords(`${customerAddress}, ${customerCep}`);

      let distanceKm = 0;

      if (storeCoords && customerCoords) {
        // Fórmula de Haversine (Distância em linha reta na esfera terrestre)
        const R = 6371; 
        const dLat = (customerCoords.lat - storeCoords.lat) * Math.PI / 180;
        const dLon = (customerCoords.lon - storeCoords.lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(storeCoords.lat * Math.PI / 180) * Math.cos(customerCoords.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        // Multiplicador 1.3 para compensar o trajeto das ruas (curvas) em vez da linha reta
        distanceKm = (R * c) * 1.3; 
      } else {
        // Fallback de segurança: Se a rua for muito nova e a API não achar, 
        // aplica uma média municipal segura para não travar o app.
        distanceKm = 4.2; 
      }

      // PRECIFICAÇÃO ESTILO IFOOD
      // Base: R$ 5,99 (até 2km)
      // Adicional: R$ 1,50 por km extra
      let finalFee = 5.99;
      if (distanceKm > 2) {
        finalFee += (distanceKm - 2) * 1.50;
      }

      setDeliveryDistance(distanceKm);
      setDeliveryFee(finalFee);

    } catch (error) {
      console.error("Erro ao calcular", error);
      setDeliveryDistance(4.2);
      setDeliveryFee(9.29); // Valor fallback
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      setOrder({ ...order, status: newStatus });
      toast.success('Status do pedido atualizado! ✨');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const callCourier = async () => {
    if (!deliveryFee) return;
    setIsCallingCourier(true);
    try {
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          delivery_fee: deliveryFee, // Agora usa o valor dinâmico!
          status: 'pending_acceptance',
        });

      if (deliveryError) {
        if (deliveryError.code === '23505') {
          throw new Error('Você já chamou um entregador para este pedido!');
        }
        throw deliveryError;
      }

      toast.success('Entregadores notificados! O radar deles já está apitando. 🛵');

    } catch (error: any) {
      toast.error(error.message || 'Erro ao acionar os entregadores.');
    } finally {
      setIsCallingCourier(false);
    }
  };

  if (isLoading || authLoading) return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
  if (!order) return null;

  const StatusIcon = STATUS_CONFIG[order.status]?.icon || Package;
  const shortId = order.id.split('-')[0].toUpperCase();
  const calculatedTotal = order.order_items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 py-8">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard/orders" className="text-sm font-medium text-gray-500 hover:text-[#fa7109] transition-colors mb-2 inline-block">
            &larr; Voltar para Pedidos
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Pedido #{shortId}</h1>
          <p className="text-sm text-gray-500 mt-1">Realizado em {new Date(order.created_at).toLocaleString('pt-BR')}</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border shadow-sm ${STATUS_CONFIG[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
          <StatusIcon className="w-5 h-5" />
          {STATUS_CONFIG[order.status]?.label || order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LADO ESQUERDO: Itens */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#fa7109]" /> Produtos do Pedido
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {order.order_items?.map((item: any) => (
                <li key={item.id} className="p-6 flex gap-4 items-center hover:bg-gray-50/50 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-full h-full p-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-lg">{item.products?.title}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#fa7109] text-lg">{formatPrice(item.unit_price * item.quantity)}</p>
                    <p className="text-xs text-gray-400">{formatPrice(item.unit_price)} / un</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-6 bg-gray-50 flex justify-between items-center border-t border-gray-100">
              <span className="font-medium text-gray-600">Valor Total dos Itens</span>
              <span className="text-2xl font-black text-[#fa7109]">{formatPrice(calculatedTotal)}</span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Cliente e Ações */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <User className="w-5 h-5 text-[#fa7109]" /> Dados do Cliente
            </h2>
            
            {customer ? (
              <div className="space-y-5 text-sm">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Nome</p>
                  <p className="font-bold text-gray-900 text-base">{customer.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Telefone</p>
                  <p className="font-bold text-gray-900 text-base">{customer.phone || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Endereço de Entrega</p>
                  <p className="font-bold text-gray-900 text-base leading-relaxed">
                    {customer.address}<br />
                    CEP: {customer.cep}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Dados do cliente não encontrados.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Ações do Pedido</h2>
            
            <div className="space-y-3">
              
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: order.id, channel: 'customer_store' } }))}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-md flex items-center justify-center gap-2 mb-6"
              >
                <MessageCircle className="w-5 h-5" />
                Chat com o Cliente
              </button>

              {order.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus('paid')}
                  disabled={isUpdating}
                  className="w-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprovar Pagamento
                </button>
              )}

              {/* BLOCO DE LOGÍSTICA */}
              {order.status === 'paid' && (
                <div className="space-y-4">
                  <button
                    onClick={() => handleUpdateStatus('shipped')}
                    disabled={isUpdating}
                    className="w-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Truck className="w-5 h-5" />
                    Marcar como Enviado (Manual)
                  </button>

                  {/* Logística 44Go Inteligente */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1"><Route className="w-3 h-3"/> Logística 44Go</h3>
                    
                    {isCalculatingRoute ? (
                      <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-orange-600 border border-orange-100">
                        <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-[#fa7109]"></span>
                        <span className="text-xs font-bold uppercase">Calculando rota...</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={callCourier}
                          disabled={isCallingCourier || !deliveryFee}
                          className="w-full bg-[#fa7109] hover:bg-[#e66607] disabled:bg-[#fa7109]/50 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                          {isCallingCourier ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span>
                          ) : (
                            <>
                              <Bike className="w-6 h-6 animate-bounce" />
                              Chamar Entregador
                            </>
                          )}
                        </button>
                        
                        {/* Resumo da Rota Dinâmico */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span>Trajeto estimado: <strong className="text-gray-700">{deliveryDistance?.toFixed(1)} km</strong></span>
                          <span>Custo: <strong className="text-[#fa7109] text-sm">{formatPrice(deliveryFee || 0)}</strong></span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {order.status === 'shipped' && (
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 font-medium mt-4">
                  Pedido em trânsito/concluído. ✅
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}