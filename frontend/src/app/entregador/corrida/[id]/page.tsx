'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTracking } from '@/hooks/useTracking';
import { supabase } from '@/lib/supabase';
import { MapPin, ShoppingBag, CheckCircle, Navigation, Phone } from 'lucide-react';
import { toast } from 'sonner';

type OrderStatusKey = 'dispatching' | 'at_store' | 'collected' | 'on_the_way' | 'delivered';

const STATUS_FLOW: Record<OrderStatusKey, { label: string; next: string; color: string }> = {
    'dispatching': { label: 'Cheguei na Loja', next: 'at_store', color: 'bg-blue-600' },
    'at_store': { label: 'Coletar Pedido', next: 'collected', color: 'bg-orange-600' },
    'collected': { label: 'Iniciar Entrega', next: 'on_the_way', color: 'bg-purple-600' },
    'on_the_way': { label: 'Finalizar Entrega', next: 'delivered', color: 'bg-green-600' },
    'delivered': { label: 'Entregue', next: '', color: 'bg-gray-400' } // Adicionado para evitar erro de índice
};

export default function OrderExecutionPage() {
    const { id: orderId } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState<{ status: OrderStatusKey;[key: string]: any } | null>(null);
    const [loading, setLoading] = useState(false);

    // Ativa o "Grito" do GPS
    useTracking(orderId as string, !!order && order.status !== 'delivered');

    useEffect(() => {
        fetchOrder();
        const channel = supabase.channel(`order_status_${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            },
                (payload) => {
                    setOrder(payload.new as { status: OrderStatusKey;[key: string]: any });
                })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [orderId]);

    async function fetchOrder() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, stores(*)')
            .eq('id', orderId)
            .single();

        if (error) {
            toast.error("Erro ao carregar dados da corrida");
            return;
        }

        // Usamos o 'as' aqui para dizer ao TS: "Eu garanto que esse dado vindo do banco tem o status correto"
        setOrder(data as { status: OrderStatusKey;[key: string]: any });
    }

    async function handleStatusAdvance() {
        if (!order || !STATUS_FLOW[order.status]) return;

        setLoading(true);
        const flow = STATUS_FLOW[order.status];

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-courier-id': user?.id || ''
                },
                body: JSON.stringify({ newStatus: flow.next })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erro ao atualizar');
            }

            toast.success(`Etapa concluída: ${flow.label}`);
            if (flow.next === 'delivered') {
                router.push('/entregador/dashboard'); // Volta pro radar após finalizar
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!order) return <div className="p-10 text-center font-bold">Carregando corrida...</div>;

    const currentFlow = STATUS_FLOW[order.status];

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-10">
            {/* MAPA PLACEHOLDER (Aqui entraria o Google Maps/Leaflet) */}
            <div className="h-64 bg-gray-200 relative flex items-center justify-center">
                <Navigation className="w-10 h-10 text-gray-400 animate-pulse" />
                <span className="absolute bottom-4 bg-white px-3 py-1 rounded-full text-xs font-black shadow-sm">
                    GPS ATIVO: TRANSMITINDO...
                </span>
            </div>

            <div className="p-6 -mt-6 bg-white rounded-t-[2.5rem] shadow-xl flex-1">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <span className="text-xs font-black text-[#fa7109] uppercase tracking-widest">Pedido #{order.id.slice(0, 8)}</span>
                        <h1 className="text-2xl font-black text-gray-900">{order.stores?.name}</h1>
                    </div>
                    <button className="p-4 bg-gray-100 rounded-2xl text-gray-900 active:scale-95">
                        <Phone size={20} />
                    </button>
                </div>

                {/* INFO DA ENTREGA */}
                <div className="space-y-6 mb-12">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin size={20} className="text-[#fa7109]" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Endereço de Entrega</p>
                            <p className="text-sm font-bold text-gray-800">{order.address_line1}, {order.city}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                            <ShoppingBag size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Pagamento</p>
                            <p className="text-sm font-bold text-gray-800">R$ {order.total_amount.toFixed(2)} - {order.payment_method}</p>
                        </div>
                    </div>
                </div>

                {/* BOTÃO DE AÇÃO DINÂMICO */}
                {currentFlow ? (
                    <button
                        onClick={handleStatusAdvance}
                        disabled={loading}
                        className={`w-full py-6 rounded-[2rem] text-white font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${currentFlow.color} ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span> : <CheckCircle size={24} />}
                        {currentFlow.label}
                    </button>
                ) : (
                    <div className="bg-gray-100 p-6 rounded-2xl text-center font-bold text-gray-500">
                        Aguardando atualização de status...
                    </div>
                )}
            </div>
        </div>
    );
}