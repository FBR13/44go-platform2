'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CartItem {
  id: string; // ID do order_item
  order_id: string; // ID do pedido principal
  product_id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
  store_id: string;
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(n));

  // 1. Busca os itens no banco de dados
  const fetchCart = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Busca todos os pedidos do usuário que estão com status 'cart' (Carrinho)
      // E já traz os itens (order_items) e os detalhes do produto (products) na mesma query!
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
            products (
              title,
              image_url
            )
          )
        `)
        .eq('customer_id', user.id)
        .eq('status', 'cart');

      if (error) throw error;

      // "Achata" a resposta para facilitar a exibição na tela
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

  // 2. Atualiza a quantidade direto no banco
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Atualiza a tela instantaneamente (Optimistic UI) para não parecer travado
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));

    const { error } = await supabase
      .from('order_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao atualizar quantidade.');
      fetchCart(); // Reverte a tela em caso de erro
    }
  };

  // 3. Remove o item do banco
  const removeItem = async (itemId: string) => {
    // Remove da tela instantaneamente
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao remover item.');
      fetchCart(); // Reverte a tela em caso de erro
    } else {
      toast.success('Item removido do carrinho!');
    }
  };

  // Calcula o total na hora
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
        <h1 className="text-xl font-semibold text-gray-900">Faça login para ver seu carrinho</h1>
        <Link href="/auth/login" className="inline-block mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-medium hover:opacity-95 transition-opacity">
          Fazer Login
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
        <h1 className="text-xl font-semibold text-gray-900">Seu carrinho está vazio</h1>
        <p className="mt-2 text-gray-600 text-sm">
          Nenhum produto foi adicionado ainda. Explore as lojas da região e aproveite!
        </p>
        <Link href="/products" className="inline-block mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-medium hover:opacity-95 transition-opacity">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">
        Seu Carrinho 🛒
      </h1>

      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        {cartItems.map((line) => (
          <li key={line.id} className="flex flex-col sm:flex-row gap-4 p-4 sm:items-center hover:bg-gray-50 transition-colors">
            
            {/* Imagem */}
            <div className="flex gap-4 flex-1 min-w-0">
              <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 relative">
                {line.image_url ? (
                  <img src={line.image_url} alt={line.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8 opacity-50" />
                  </div>
                )}
              </div>
              
              {/* Informações do Produto */}
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <Link href={`/product/${line.product_id}`} className="font-bold text-gray-900 hover:text-[#fa7109] transition-colors line-clamp-2 text-lg">
                  {line.title}
                </Link>
                <p className="text-[#fa7109] font-semibold mt-1">
                  {formatPrice(line.price)} <span className="text-sm font-normal text-gray-500">/unidade</span>
                </p>
              </div>
            </div>

            {/* Controles de Quantidade e Preço Total */}
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0 mt-2 sm:mt-0">
              
              {/* Botões +/- */}
              <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                <button
                  type="button"
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-[#fa7109] disabled:opacity-40 transition-colors"
                  disabled={line.quantity <= 1}
                  onClick={() => updateQuantity(line.id, line.quantity - 1)}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-[#fa7109] transition-colors"
                  onClick={() => updateQuantity(line.id, line.quantity + 1)}
                >
                  +
                </button>
              </div>

              {/* Preço Total do Item */}
              <p className="hidden sm:block w-32 text-right font-black text-gray-900 tabular-nums text-lg">
                {formatPrice(line.price * line.quantity)}
              </p>

              {/* Botão de Lixeira */}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                onClick={() => removeItem(line.id)}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Resumo do Pedido */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-inner">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">Total estimado (sem frete)</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">
            {formatPrice(subtotal)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/products"
            className="text-center py-3.5 px-6 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
          >
            Continuar comprando
          </Link>
          <Link
            href="/checkout"
            className="text-center py-3.5 px-10 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-orange-500/20"
          >
            Avançar para o Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}