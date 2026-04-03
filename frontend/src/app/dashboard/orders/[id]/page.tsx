'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
// IMPORTAMOS O MessageCircle AQUI PARA O ÍCONE DO CHAT
import { Package, User, MapPin, Phone, Truck, CheckCircle, Clock, MessageCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    cart: { label: 'Em Carrinho', color: 'text-yellow-700 bg-yellow-100', icon: Clock },
    pending: { label: 'Pendente (Aguardando Pagamento)', color: 'text-orange-700 bg-orange-100', icon: Clock },
    paid: { label: 'Pago (Preparando)', color: 'text-green-700 bg-green-100', icon: CheckCircle },
    shipped: { label: 'Enviado / Entregue', color: 'text-blue-700 bg-blue-100', icon: Truck },
};

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [order, setOrder] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const formatPrice = (n: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

    useEffect(() => {
        if (authLoading || !user) return;

        async function fetchOrderDetails() {
            try {
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select(`
            *,
            order_items ( id, quantity, unit_price, products ( title, image_url ) )
          `)
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

            } catch (error) {
                console.error('Erro:', error);
                toast.error('Erro ao carregar detalhes do pedido.');
                router.push('/dashboard/orders');
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrderDetails();
    }, [user, authLoading, params.id, router]);

    const handleUpdateStatus = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);

            if (error) throw error;

            setOrder({ ...order, status: newStatus });
            toast.success('Status do pedido atualizado! ✨');
        } catch (error) {
            toast.error('Erro ao atualizar status.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
    }

    if (!order) return null;

    const StatusIcon = STATUS_CONFIG[order.status]?.icon || Package;
    const shortId = order.id.split('-')[0].toUpperCase();

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">

            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <Link href="/dashboard/orders" className="text-sm font-medium text-gray-500 hover:text-[#fa7109] transition-colors mb-2 inline-block">
                        &larr; Voltar para Pedidos
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                        Pedido #{shortId}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Realizado em {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border shadow-sm ${STATUS_CONFIG[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                    <StatusIcon className="w-5 h-5" />
                    {STATUS_CONFIG[order.status]?.label || order.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LADO ESQUERDO: Itens do Pedido */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#fa7109]" />
                                Produtos do Pedido
                            </h2>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {order.order_items?.map((item: any) => (
                                <li key={item.id} className="p-5 flex gap-4 items-center">
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                        {item.products?.image_url ? (
                                            <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-full h-full p-4 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{item.products?.title}</p>
                                        <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{formatPrice(item.unit_price * item.quantity)}</p>
                                        <p className="text-xs text-gray-400">{formatPrice(item.unit_price)} / un</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="p-5 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                            <span className="font-medium text-gray-600">Valor Total dos Itens</span>
                            <span className="text-xl font-black text-[#fa7109]">{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* LADO DIREITO: Cliente e Ações */}
                <div className="space-y-6">

                    {/* Info do Cliente */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <User className="w-5 h-5 text-[#fa7109]" />
                            Dados do Cliente
                        </h2>

                        {customer ? (
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1">Nome</p>
                                    <p className="font-bold text-gray-900">{customer.full_name}</p>
                                </div>

                                {/* O WHATSAPP SAIU, FICOU SÓ O TELEFONE DE CONTATO GERAL */}
                                <div>
                                    <p className="text-gray-500 font-medium mb-1 flex items-center gap-1"><Phone className="w-4 h-4" /> Telefone</p>
                                    <p className="font-bold text-gray-900">{customer.phone || 'Não informado'}</p>
                                </div>

                                <div>
                                    <p className="text-gray-500 font-medium mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> Endereço de Entrega</p>
                                    <p className="font-bold text-gray-900 leading-relaxed">
                                        {customer.address}<br />
                                        CEP: {customer.cep}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Dados do cliente não encontrados.</p>
                        )}
                    </div>

                    {/* Ações do Lojista */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                            Ações do Pedido
                        </h2>

                        <div className="space-y-3">

                            {/* NOVO BOTÃO DE CHAT PREPARADO PARA A PRÓXIMA FEATURE */}
                            <Link
                                href={`/dashboard/orders/${order.id}/chat`}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Abrir Chat do Pedido
                            </Link>

                            {order.status === 'pending' && (
                                <button
                                    onClick={() => handleUpdateStatus('paid')}
                                    disabled={isUpdating}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Marcar como Pago
                                </button>
                            )}

                            {order.status === 'paid' && (
                                <button
                                    onClick={() => handleUpdateStatus('shipped')}
                                    disabled={isUpdating}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Truck className="w-5 h-5" />
                                    Marcar como Enviado
                                </button>
                            )}

                            {order.status === 'shipped' && (
                                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 font-medium mt-4">
                                    Este pedido já foi concluído. ✅
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}