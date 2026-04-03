'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // <-- Importando o usuário
import { supabase } from '@/lib/supabase'; // <-- Importando o banco

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { user } = useAuth(); // Pegando quem está logado
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // A MÁGICA DO CARRINHO ACONTECE AQUI
  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Você precisa fazer login para comprar! 🔐');
      return;
    }

    setIsAdding(true);

    try {
      // 1. Verifica se o cliente já tem um carrinho aberto NESSA loja
      let { data: cart, error: cartError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .eq('store_id', product.store_id)
        .eq('status', 'cart')
        .maybeSingle();

      if (cartError) throw cartError;

      // 2. Se não tiver um carrinho, a gente cria um novo pedido com status 'cart'
      if (!cart) {
        const { data: newCart, error: newCartError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            store_id: product.store_id,
            status: 'cart',
            total_amount: 0
          })
          .select()
          .single();

        if (newCartError) throw newCartError;
        cart = newCart;
      }

      // 3. Adiciona o produto dentro daquele carrinho (order_items)
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: cart.id,
          product_id: product.id,
          unit_price: product.base_price,
          quantity: 1
        });

      if (itemError) {
        // Se der erro de item duplicado, você pode tratar depois para só somar +1 na quantidade
        throw itemError;
      }

      toast.success('Produto adicionado ao carrinho! 🛒');
      
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao adicionar ao carrinho: ' + error.message);
    } finally {
      setIsAdding(false);
      onClose(); // Fecha o modal após adicionar
    }
  };

  const handleBuyNow = () => {
    // Para comprar agora, podemos só adicionar ao carrinho e redirecionar direto pra tela de checkout
    handleAddToCart().then(() => {
      toast.success('Redirecionando para o pagamento... 💳');
      // router.push('/checkout'); -> Faremos isso depois!
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row z-10 animate-in fade-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 hover:bg-gray-100 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
          ✕
        </button>

        <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-6xl mb-2">📦</span>
              <p>Sem imagem</p>
            </div>
          )}
          {product.category && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 shadow-sm">
              {product.category}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col overflow-y-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
            {product.title || product.name}
          </h2>
          
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <p className="text-3xl font-black text-[#fa7109]">
              R$ {Number(product.base_price || product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium">
              Estoque: {product.stock_quantity ?? 'N/A'}
            </span>
          </div>

          <div className="flex-grow">
            <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Descrição do Produto</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line mb-8 text-sm sm:text-base">
              {product.description || 'Nenhuma descrição fornecida pelo lojista para este produto.'}
            </p>
          </div>

          <div className="space-y-3 mt-auto pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full bg-orange-50 hover:bg-orange-100 text-[#fa7109] border border-orange-200 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdding ? 'Adicionando...' : '🛒 Add ao Carrinho'}
              </button>
              
              <button 
                onClick={handleBuyNow}
                disabled={isAdding}
                className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-3.5 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                ⚡ Comprar Agora
              </button>
            </div>

            <Link 
              href={`/stores/${product.store_id}`}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              onClick={onClose}
            >
              🏪 Ver página da Loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}