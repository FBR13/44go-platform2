'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Trash2, Lock, ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
  stock_quantity: number;
  store_id: string;
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(n));

  const fetchCart = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          store_id,
          order_items (
            id,
            quantity,
            unit_price,
            product_id,
            products ( title, image_url, stock_quantity ) 
          )
        `)
        .eq('customer_id', user.id)
        .eq('status', 'cart');

      if (error) throw error;

      const items: CartItem[] = [];
      data?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          items.push({
            id: item.id,
            order_id: order.id,
            product_id: item.product_id,
            title: item.products?.title || 'Produto Indisponível',
            image_url: item.products?.image_url,
            price: item.unit_price,
            quantity: item.quantity,
            stock_quantity: item.products?.stock_quantity || 0,
            store_id: order.store_id,
          });
        });
      });

      setCartItems(items);
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
      toast.error('Erro ao carregar seu carrinho.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCart();
    }
  }, [user, authLoading]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const itemToUpdate = cartItems.find(item => item.id === itemId);

    if (itemToUpdate && newQuantity > itemToUpdate.stock_quantity) {
      toast.error(`A loja possui apenas ${itemToUpdate.stock_quantity} unidades disponíveis.`);
      return;
    }

    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));

    const { error } = await supabase
      .from('order_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao atualizar quantidade.');
      fetchCart();
    }
  };

  const removeItem = async (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao remover item.');
      fetchCart();
    } else {
      toast.success('Item removido do carrinho!');
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckoutWithStripe = async () => {
    const orderId = cartItems[0]?.order_id;

    if (!orderId) {
      toast.error('Erro: Nenhum pedido encontrado no carrinho.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      await supabase
        .from('orders')
        .update({
          status: 'pending',
          total_amount: subtotal
        })
        .eq('id', orderId);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      toast.error(error.message || 'Falha ao processar pagamento. Tente novamente.');
      await supabase.from('orders').update({ status: 'cart' }).eq('id', orderId);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#fa7109] border-opacity-70"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center max-w-lg w-full border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Acesse sua conta</h1>
          <p className="text-gray-500 mb-8">Faça login para gerenciar e visualizar seu carrinho de compras.</p>
          <Link href="/auth/login" className="block w-full py-4 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-bold hover:shadow-lg transition-all">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Parece que você ainda não adicionou nada. Explore as melhores lojas da região e aproveite!
        </p>
        <Link href="/products" className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-bold hover:shadow-lg transition-all hover:-translate-y-1">
          <ArrowLeft className="w-5 h-5" /> Começar a explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
            Seu Carrinho
            <span className="bg-[#fa7109]/10 text-[#fa7109] text-sm py-1 px-3 rounded-full">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
            </span>
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* LISTA DE PRODUTOS */}
          <div className="flex-1 space-y-4">
            {cartItems.map((line) => (
              <div
                key={line.id}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center transition-all hover:shadow-md"
              >
                {/* Imagem */}
                <div className="w-full sm:w-28 h-28 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 p-1 relative overflow-hidden group">
                  {line.image_url ? (
                    <img src={line.image_url} alt={line.title} className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 flex flex-col text-center sm:text-left w-full">
                  <Link href={`/product/${line.product_id}`} className="font-bold text-gray-900 text-lg hover:text-[#fa7109] transition-colors line-clamp-2">
                    {line.title}
                  </Link>
                  <p className="text-gray-500 text-sm mt-1">Preço unitário: {formatPrice(line.price)}</p>

                  <div className="text-[#fa7109] font-black text-xl mt-2 sm:mt-auto">
                    {formatPrice(line.price * line.quantity)}
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-between h-full w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">

                  <button
                    type="button"
                    className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full transition-colors disabled:opacity-40 ml-auto sm:ml-0"
                    disabled={isProcessingPayment}
                    onClick={() => removeItem(line.id)}
                    title="Remover produto"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1">
                      <button
                        type="button"
                        className="p-1.5 rounded-full text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all"
                        disabled={line.quantity <= 1 || isProcessingPayment}
                        onClick={() => updateQuantity(line.id, line.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-gray-900 select-none">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="p-1.5 rounded-full text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all"
                        disabled={line.quantity >= line.stock_quantity || isProcessingPayment}
                        onClick={() => updateQuantity(line.id, line.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {line.quantity >= line.stock_quantity && (
                      <span className="text-[10px] text-[#fa7109] font-bold uppercase tracking-wider">Máximo</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RESUMO DO PEDIDO */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="text-green-600 font-medium">A calcular</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total estimado</span>
                  <span className="text-3xl font-black text-gray-900">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCheckoutWithStripe}
                  disabled={isProcessingPayment}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-bold text-lg hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></span>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" /> Pagar de forma Segura
                    </>
                  )}
                </button>

                <Link
                  href="/products"
                  className={`w-full text-center py-4 px-6 rounded-full border-2 border-gray-100 font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${isProcessingPayment ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Continuar comprando
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                <span>Pagamento 100% seguro e criptografado</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}