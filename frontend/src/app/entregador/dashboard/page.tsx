'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Power, MapPin, Package, Navigation, CheckCircle, Clock, DollarSign, Bike, MessageCircle } from 'lucide-react';

// Dicionário para gerenciar o fluxo da entrega
const DELIVERY_FLOW: any = {
  accepted: { nextStatus: 'at_store', buttonText: 'Cheguei na Loja', icon: MapPin },
  at_store: { nextStatus: 'collected', buttonText: 'Pedido Coletado', icon: Package },
  collected: { nextStatus: 'on_the_way', buttonText: 'Sair para Entrega', icon: Navigation },
  on_the_way: { nextStatus: 'delivered', buttonText: 'Confirmar Entrega', icon: CheckCircle },
};

export default function CourierDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const [courierData, setCourierData] = useState<any>(null);
  
  // Lista de entregas tocando na tela (disponíveis)
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  // A entrega que ele aceitou e está fazendo agora
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. CARREGA DADOS DO ENTREGADOR E CORRIDA ATIVA
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/entregador/login');
      return;
    }

    async function loadDashboard() {
      try {
        // Pega os dados do entregador
        const { data: courier } = await supabase
          .from('couriers')
          .select('*')
          .eq('id', user!.id)
          .single();

        if (courier) {
          setCourierData(courier);
          setIsOnline(courier.is_online);
        }

        // Verifica se ele já tem uma corrida em andamento
        const { data: active } = await supabase
          .from('deliveries')
          .select('*, orders(stores(name), total_amount)')
          .eq('courier_id', user!.id)
          .neq('status', 'delivered')
          .single();

        if (active) setActiveDelivery(active);

        // Se estiver online e não tiver corrida ativa, busca as disponíveis
        if (courier?.is_online && !active) {
          fetchAvailableDeliveries();
        }

      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [user, authLoading, router]);

  const fetchAvailableDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*, orders(stores(name), total_amount)')
      .eq('status', 'pending_acceptance');
    
    if (data) setAvailableDeliveries(data);
  };

  // 2. REALTIME (ESCUTANDO NOVAS CORRIDAS)
  useEffect(() => {
    if (!isOnline || activeDelivery) return;

    const channel = supabase
      .channel('deliveries_radar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries', filter: `status=eq.pending_acceptance` },
        (payload) => {
          // Toca som de nova corrida (precisa ter o notify.mp3 na pasta public)
          new Audio('/notify.mp3').play().catch(() => {});
          toast.info('Nova corrida disponível!');
          fetchAvailableDeliveries(); // Atualiza a lista
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries' },
        (payload) => {
          // Se alguém aceitou, remove da tela
          if (payload.new.status !== 'pending_acceptance') {
             setAvailableDeliveries(prev => prev.filter(d => d.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOnline, activeDelivery]);

  // 3. FUNÇÕES DE AÇÃO
  const toggleOnline = async () => {
    const newState = !isOnline;
    setIsOnline(newState);
    
    await supabase.from('couriers').update({ is_online: newState }).eq('id', user!.id);
    
    if (newState) {
      toast.success('Você está online! Procurando corridas...');
      fetchAvailableDeliveries();
    } else {
      toast.error('Você ficou offline.');
      setAvailableDeliveries([]);
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    try {
      // Tenta travar a corrida para este entregador
      const { data, error } = await supabase
        .from('deliveries')
        .update({ 
          courier_id: user!.id, 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', deliveryId)
        .eq('status', 'pending_acceptance') // Só atualiza se ainda estiver pendente (evita concorrência)
        .select('*, orders(stores(name), total_amount)')
        .single();

      if (error || !data) throw new Error('Outro entregador já aceitou esta corrida.');

      toast.success('Corrida aceita! Dirija-se à loja.');
      setActiveDelivery(data);
      setAvailableDeliveries([]); // Limpa a tela
    } catch (error: any) {
      toast.error(error.message);
      fetchAvailableDeliveries(); // Recarrega a lista
    }
  };

  const updateDeliveryStatus = async () => {
    if (!activeDelivery) return;
    
    const flowConfig = DELIVERY_FLOW[activeDelivery.status];
    if (!flowConfig) return;

    try {
      const updateData: any = { status: flowConfig.nextStatus };
      if (flowConfig.nextStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', activeDelivery.id);

      if (error) throw error;

      if (flowConfig.nextStatus === 'delivered') {
        toast.success('Entrega finalizada com sucesso! Ganhos adicionados.');
        setActiveDelivery(null);
        if (isOnline) fetchAvailableDeliveries();
      } else {
        setActiveDelivery({ ...activeDelivery, status: flowConfig.nextStatus });
        toast.success('Status atualizado!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  if (isLoading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* HEADER DO DASHBOARD */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Olá, {courierData?.full_name?.split(' ')[0]} 👋</h2>
            <Link href="/entregador/carteira" className="inline-flex items-center gap-1 text-[#fa7109] text-sm font-bold hover:underline mt-1">
              Ver minha Carteira <DollarSign className="w-4 h-4" />
            </Link>
          </div>
          
          <button
            onClick={toggleOnline}
            disabled={!!activeDelivery} // Não pode ficar offline no meio de uma corrida
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
              isOnline 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            } ${!!activeDelivery && 'opacity-50 cursor-not-allowed'}`}
          >
            <Power className="w-5 h-5" />
            {isOnline ? 'Online (Aguardando...)' : 'Iniciar Expediente'}
          </button>
        </div>

        {/* ÁREA DE CORRIDA ATIVA */}
        {activeDelivery ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#fa7109] p-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <div className="animate-pulse w-2 h-2 rounded-full bg-white"></div>
                <span className="text-sm font-bold uppercase tracking-wider">Corrida em Andamento</span>
              </div>
              <h3 className="text-2xl font-black">{activeDelivery.orders?.stores?.name || 'Loja Parceira'}</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-green-700" /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Seu Ganho</p>
                    <p className="text-xl font-black text-gray-900">R$ {Number(activeDelivery.delivery_fee).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase">Distância Estimada</p>
                  <p className="text-lg font-bold text-gray-900">4.5 km</p>
                </div>
              </div>

              {/* 👇 BLOCO NOVO: BOTÕES DE CHAT 👇 */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: activeDelivery.order_id, tab: 'store' } }))}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Falar c/ Loja
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: activeDelivery.order_id, tab: 'customer' } }))}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Falar c/ Cliente
                </button>
              </div>
              {/* 👆 FIM DO BLOCO DE CHAT 👆 */}

              {/* BOTÃO DE AÇÃO (Muda baseado no status) */}
              {DELIVERY_FLOW[activeDelivery.status] && (() => {
                const ActionIcon = DELIVERY_FLOW[activeDelivery.status].icon;
                return (
                  <button
                    onClick={updateDeliveryStatus}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black py-4 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    <ActionIcon className="w-6 h-6" />
                    {DELIVERY_FLOW[activeDelivery.status].buttonText}
                  </button>
                );
              })()}
            </div>
          </div>
        ) : (
          /* ÁREA DE CORRIDAS DISPONÍVEIS (RADAR) */
          <div className="space-y-4">
            {!isOnline ? (
              <div className="bg-gray-100 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                <Power className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Você está offline</h3>
                <p className="text-gray-500">Inicie o expediente para receber chamados em Goiânia.</p>
              </div>
            ) : availableDeliveries.length === 0 ? (
              <div className="bg-orange-50 rounded-3xl p-12 text-center border-2 border-dashed border-[#fa7109]/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-48 h-48 border-4 border-[#fa7109] rounded-full animate-ping"></div>
                </div>
                <Bike className="w-16 h-16 text-[#fa7109] mx-auto mb-4 relative z-10" />
                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">Procurando corridas...</h3>
                <p className="text-orange-800 relative z-10">Fique atento, o chamado pode tocar a qualquer momento.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Novas Corridas ({availableDeliveries.length})</h3>
                <div className="space-y-4">
                  {availableDeliveries.map((delivery) => (
                    <div key={delivery.id} className="bg-white rounded-3xl border-2 border-[#fa7109] p-5 shadow-xl shadow-[#fa7109]/10 animate-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black text-gray-900">{delivery.orders?.stores?.name || 'Loja Parceira'}</h4>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <MapPin className="w-4 h-4" /> 4.5 km até o cliente
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-green-600 uppercase">Valor da Entrega</p>
                          <p className="text-2xl font-black text-gray-900">R$ {Number(delivery.delivery_fee).toFixed(2).replace('.', ',')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => acceptDelivery(delivery.id)}
                        className="w-full bg-[#fa7109] hover:bg-[#e06300] text-white font-black py-4 rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-6 h-6" /> Aceitar Corrida
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}