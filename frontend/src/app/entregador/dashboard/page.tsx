'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Power, MapPin, Package, Navigation, CheckCircle, Clock, DollarSign, Bike, MessageCircle, User as UserIcon } from 'lucide-react';

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

    const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
    const [activeDelivery, setActiveDelivery] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Função de segurança para extrair o nome da loja do Supabase
    const getStoreName = (order: any) => {
        if (!order || !order.stores) return undefined;
        return Array.isArray(order.stores) ? order.stores[0]?.name : order.stores.name;
    };

    // 1. CARREGA DADOS DO ENTREGADOR E CORRIDA ATIVA
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/entregador/login');
            return;
        }

        async function loadDashboard() {
            try {
                const { data: courier } = await supabase
                    .from('couriers')
                    .select('*')
                    .eq('id', user!.id)
                    .single();

                if (courier) {
                    setCourierData(courier);
                    setIsOnline(courier.is_online);
                }

                const { data: active } = await supabase
                    .from('deliveries')
                    .select('*, orders(customer_id, total_amount, stores(name))') 
                    .eq('courier_id', user!.id)
                    .neq('status', 'delivered')
                    .single();

                if (active) {
                    // Busca endereço do cliente separado
                    if (active.orders?.customer_id) {
                        const { data: customerData } = await supabase
                            .from('users')
                            .select('address')
                            .eq('id', active.orders.customer_id)
                            .single();
                        
                        active.customer_address = customerData?.address;
                    }
                    setActiveDelivery(active);
                }

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
            .select('*, orders(total_amount, stores(name))')
            .eq('status', 'pending_acceptance');

        if (data) setAvailableDeliveries(data);
    };

    // 2. REALTIME
    useEffect(() => {
        if (!isOnline || activeDelivery) return;

        const channel = supabase
            .channel('deliveries_radar')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'deliveries', filter: `status=eq.pending_acceptance` },
                () => {
                    new Audio('/notify.mp3').play().catch(() => { });
                    toast.info('Nova corrida disponível!');
                    fetchAvailableDeliveries();
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'deliveries' },
                (payload) => {
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
            toast.error('Ficaste offline.');
            setAvailableDeliveries([]);
        }
    };

    const acceptDelivery = async (deliveryId: string) => {
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .update({
                    courier_id: user!.id,
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .eq('id', deliveryId)
                .eq('status', 'pending_acceptance')
                .select('*, orders(customer_id, total_amount, stores(name))')
                .single();

            if (error || !data) throw new Error('Outro entregador já aceitou esta corrida.');

            if (data.orders?.customer_id) {
                const { data: customerData } = await supabase.from('users').select('address').eq('id', data.orders.customer_id).single();
                data.customer_address = customerData?.address;
            }

            toast.success('Corrida aceite! Dirige-te à loja.');
            setActiveDelivery(data);
            setAvailableDeliveries([]);
        } catch (error: any) {
            toast.error(error.message);
            fetchAvailableDeliveries();
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

            const { error } = await supabase.from('deliveries').update(updateData).eq('id', activeDelivery.id);
            if (error) throw error;

            if (flowConfig.nextStatus === 'delivered') {
                toast.success('Entrega finalizada com sucesso! Ganhos adicionados.');
                setActiveDelivery(null);
                if (isOnline) fetchAvailableDeliveries();
            } else {
                setActiveDelivery({ ...activeDelivery, status: flowConfig.nextStatus });
                toast.success('Estado atualizado!');
            }
        } catch (error) {
            toast.error('Erro ao atualizar o estado.');
        }
    };

    // FUNÇÃO CORRIGIDA PARA O GPS
    const openGPS = (address: string | undefined, isStore: boolean = false) => {
        if (!address) {
            toast.error('Localização não encontrada no sistema.');
            return;
        }
        // Se for loja, pesquisa pelo nome + Goiânia. Se for cliente, usa a morada exata.
        const searchQuery = isStore ? `${address}, Goiânia` : address;
        const encodedAddress = encodeURIComponent(searchQuery);
        
        // Link oficial e universal do Google Maps
        const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        window.open(url, '_blank');
    };

    if (isLoading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;

    return (
        <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">

                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Olá, {courierData?.full_name?.split(' ')[0]} 👋</h2>
                        <Link href="/entregador/carteira" className="inline-flex items-center gap-1 text-[#fa7109] text-sm font-bold hover:underline mt-1">
                            Ver minha Carteira <DollarSign className="w-4 h-4" />
                        </Link>
                    </div>

                    <button
                        onClick={toggleOnline}
                        disabled={!!activeDelivery}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${isOnline
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            } ${!!activeDelivery && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <Power className="w-5 h-5" />
                        {isOnline ? 'Online (Aguardar...)' : 'Iniciar Expediente'}
                    </button>
                </div>

                {activeDelivery ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-[#fa7109] p-6 text-white">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="animate-pulse w-2 h-2 rounded-full bg-white"></div>
                                <span className="text-sm font-bold uppercase tracking-wider">Corrida em Andamento</span>
                            </div>
                            <h3 className="text-2xl font-black">{getStoreName(activeDelivery.orders) || 'Loja Parceira'}</h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-green-700" /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">O Teu Ganho</p>
                                        <p className="text-xl font-black text-gray-900">R$ {Number(activeDelivery.delivery_fee).toFixed(2).replace('.', ',')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-2">
                                {(activeDelivery.status === 'accepted' || activeDelivery.status === 'at_store') && (
                                    <button
                                        onClick={() => openGPS(getStoreName(activeDelivery.orders), true)}
                                        className="flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-sm"><MapPin className="w-6 h-6" /></div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Passo 1: Recolha</p>
                                                <p className="text-base font-black">Navegar até à Loja</p>
                                            </div>
                                        </div>
                                        <Navigation className="w-6 h-6 animate-pulse" />
                                    </button>
                                )}

                                {(activeDelivery.status === 'collected' || activeDelivery.status === 'on_the_way') && (
                                    <button
                                        onClick={() => openGPS(activeDelivery.customer_address, false)}
                                        className="flex items-center justify-between p-4 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100 hover:bg-purple-100 transition-all shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-600 p-2.5 rounded-xl text-white shadow-sm"><UserIcon className="w-6 h-6" /></div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Passo 2: Entrega</p>
                                                <p className="text-base font-black">Navegar até ao Cliente</p>
                                            </div>
                                        </div>
                                        <Navigation className="w-6 h-6 animate-pulse" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: activeDelivery.order_id, channel: 'courier_store' } }))}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <MessageCircle className="w-4 h-4" /> Falar c/ Loja
                                </button>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: activeDelivery.order_id, channel: 'courier_customer' } }))}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <MessageCircle className="w-4 h-4" /> Falar c/ Cliente
                                </button>
                            </div>

                            {DELIVERY_FLOW[activeDelivery.status] && (() => {
                                const ActionIcon = DELIVERY_FLOW[activeDelivery.status].icon;
                                return (
                                    <button
                                        onClick={updateDeliveryStatus}
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black py-4 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
                                    >
                                        <ActionIcon className="w-6 h-6" />
                                        {DELIVERY_FLOW[activeDelivery.status].buttonText}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!isOnline ? (
                            <div className="bg-gray-100 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Power className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Estás offline</h3>
                                <p className="text-gray-500">Inicia o expediente para receber chamadas na tua zona.</p>
                            </div>
                        ) : availableDeliveries.length === 0 ? (
                            <div className="bg-orange-50 rounded-3xl p-12 text-center border-2 border-dashed border-[#fa7109]/30 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <div className="w-48 h-48 border-4 border-[#fa7109] rounded-full animate-ping"></div>
                                </div>
                                <Bike className="w-16 h-16 text-[#fa7109] mx-auto mb-4 relative z-10" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">A procurar corridas...</h3>
                                <p className="text-orange-800 relative z-10">Fica atento, pode tocar a qualquer momento.</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Novas Corridas ({availableDeliveries.length})</h3>
                                <div className="space-y-4">
                                    {availableDeliveries.map((delivery) => (
                                        <div key={delivery.id} className="bg-white rounded-3xl border-2 border-[#fa7109] p-5 shadow-xl shadow-[#fa7109]/10 animate-in slide-in-from-bottom-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-black text-gray-900">{getStoreName(delivery.orders) || 'Loja Parceira'}</h4>
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