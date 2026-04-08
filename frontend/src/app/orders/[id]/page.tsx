'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Package, Store, CheckCircle, Clock, Truck, MessageCircle, Star, X, Bike } from 'lucide-react'; // <-- Adicionado o ícone Bike!

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  pending: { label: 'Aguardando Pagamento', color: 'text-orange-700 bg-orange-100', icon: Clock, description: 'O lojista está aguardando o seu pagamento.' },
  paid: { label: 'Pagamento Aprovado', color: 'text-green-700 bg-green-100', icon: CheckCircle, description: 'Pagamento confirmado! O lojista está preparando seu pedido.' },
  shipped: { label: 'Saiu para Entrega', color: 'text-blue-700 bg-blue-100', icon: Truck, description: 'Seu pedido já está a caminho do endereço de entrega.' },
  delivered: { label: 'Pedido Entregue', color: 'text-purple-700 bg-purple-100 border-purple-200', icon: Package, description: 'Pedido entregue com sucesso! Não esqueça de avaliar os produtos.' },
};

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o Modal de Avaliação
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProductToReview, setSelectedProductToReview] = useState<any>(null);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  // 1. FUNÇÃO PARA BUSCAR DADOS (EXTRAÍDA PARA REUSO)
  const fetchOrderDetails = async () => {
    if (!user) return;
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *, 
          stores ( id, seller_id, name ), 
          order_items ( id, quantity, unit_price, product_id, products ( title, image_url ) )
        `)
        .eq('id', params.id)
        .eq('customer_id', user.id)
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
        setSeller(sellerData);
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('order_id', orderData.id)
        .eq('client_id', user.id);
        
      if (reviewsData) {
        setReviewedProductIds(reviewsData.map(r => r.product_id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. EFEITO PARA CARREGAMENTO INICIAL
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }
    fetchOrderDetails();
  }, [user, authLoading, params.id]);

  // 3. EFEITO REALTIME
  useEffect(() => {
    if (!params.id) return;

    // Escuta mudanças na tabela 'orders' para este ID específico
    const channel = supabase
      .channel(`order_status_${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          console.log('Mudança detectada no status do pedido!', payload);
          setOrder((prev: any) => ({ ...prev, status: payload.new.status }));
          
          if (payload.new.status === 'paid') {
            toast.success('Pagamento confirmado com sucesso!');
          }
          if (payload.new.status === 'shipped') {
            toast.info('Seu pedido saiu para entrega! 🛵');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const handleSubmitReview = async () => {
    if (reviewScore === 0) {
      toast.error('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const store = Array.isArray(order.stores) ? order.stores[0] : order.stores;

      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: order.id,
          product_id: selectedProductToReview.product_id,
          store_id: store.id,
          client_id: user!.id,
          rating: reviewScore,
          comment: reviewComment.trim() || null
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      setReviewedProductIds(prev => [...prev, selectedProductToReview.product_id]);
      closeReviewModal();
    } catch (error) {
      console.error('Erro ao avaliar:', error);
      toast.error('Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openReviewModal = (item: any) => {
    setSelectedProductToReview(item);
    setReviewScore(0);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setTimeout(() => setSelectedProductToReview(null), 200);
  };

  if (isLoading || authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
  if (!order) return null;

  const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, color: 'text-gray-700 bg-gray-100', icon: Package, description: '' };
  const StatusIcon = statusInfo.icon;
  const shortId = order.id.split('-')[0].toUpperCase();
  const isDelivered = order.status === 'delivered';

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
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border shadow-sm transition-all duration-500 ${statusInfo.color}`}>
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
              {order.order_items?.map((item: any) => {
                const isReviewed = reviewedProductIds.includes(item.product_id);
                return (
                  <li key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 hidden sm:block">
                      {item.products?.image_url ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.products?.title}</p>
                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-bold text-gray-900">{formatPrice(item.unit_price * item.quantity)}</p>
                      {isDelivered && (
                        isReviewed ? (
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Avaliado
                          </span>
                        ) : (
                          <button onClick={() => openReviewModal(item)} className="text-xs font-bold text-purple-700 hover:text-white border border-purple-200 hover:bg-purple-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" /> Avaliar Produto
                          </button>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100"><Store className="w-5 h-5 text-[#fa7109]" /> Dados da Loja</h2>
            {seller ? (
              <div className="space-y-2 text-sm text-gray-600">
                 <p><strong className="text-gray-900">Responsável:</strong> {seller.full_name}</p>
                 {seller.phone && <p><strong className="text-gray-900">Telefone:</strong> {seller.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Buscando informações da loja...</p>
            )}
            
            {/* 👇 CAIXA DE BOTÕES DE CHAT 👇 */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
              
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: order.id, channel: 'customer_store' } }))}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com a Loja
              </button>

              {/* Botão do Entregador - Só aparece quando o pedido for 'shipped' (Saiu pra entrega) ou 'delivered' */}
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { orderId: order.id, channel: 'courier_customer' } }))}
                  className="w-full bg-[#fa7109] hover:bg-[#e66607] text-white font-bold py-3.5 rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Bike className="w-5 h-5 animate-pulse" />
                  Falar com o Entregador
                </button>
              )}
            </div>
            {/* 👆 FIM DA CAIXA DE BOTÕES 👆 */}

          </div>
        </div>
      </div>

      {/* MODAL DE AVALIAÇÃO */}
      {isReviewModalOpen && selectedProductToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900">Avaliar Produto</h3>
              <button onClick={closeReviewModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-12 h-12 rounded bg-white overflow-hidden shrink-0">
                  {selectedProductToReview.products?.image_url ? (
                    <img src={selectedProductToReview.products.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-full h-full p-2 text-gray-300" />
                  )}
                </div>
                <p className="font-medium text-gray-900 text-sm line-clamp-2">
                  {selectedProductToReview.products?.title}
                </p>
              </div>
              <div className="mb-6 flex flex-col items-center">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewScore(star)} className={`transition-all duration-200 ${reviewScore >= star ? 'scale-110' : 'hover:scale-110 opacity-40'}`}>
                      <Star className={`w-10 h-10 ${reviewScore >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Comentário (opcional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="O que você achou do produto?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all h-24"
                />
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewScore === 0}
                className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingReview ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span> : 'Enviar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}