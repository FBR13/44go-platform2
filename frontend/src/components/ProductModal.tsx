'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // A MÁGICA DO CARRINHO BLINDADA
  const handleAddToCart = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa fazer login para comprar! 🔐');
      router.push('/auth/login');
      return false;
    }

    if (!product.store_id) {
      toast.error('Erro: Produto sem loja vinculada.');
      return false;
    }

    setIsAdding(true);

    try {
      // 1. Pega o preço correto (tenta base_price, senão usa price, senão 0)
      const unitPrice = Number(product.base_price || product.price || 0);

      // 2. Verifica se o cliente já tem um carrinho aberto NESSA loja
      let { data: cart, error: cartError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', user.id)
        .eq('store_id', product.store_id)
        .eq('status', 'cart')
        .maybeSingle();

      if (cartError) throw cartError;

      let cartId = cart?.id;

      // 3. Se não tiver um carrinho, cria um novo
      if (!cartId) {
        const { data: newCart, error: newCartError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            store_id: product.store_id,
            status: 'cart',
            total_amount: 0 // Começa zerado, a gente calcula na hora de exibir
          })
          .select('id')
          .single();

        if (newCartError) throw newCartError;
        cartId = newCart.id;
      }

      // 4. Verifica se o produto já está NESSE carrinho
      const { data: existingItem } = await supabase
        .from('order_items')
        .select('id, quantity')
        .eq('order_id', cartId)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        // Se já existe, apenas soma +1 na quantidade
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        
        if (updateError) throw updateError;
      } else {
        // Se não existe, insere o item novo
        const { error: insertError } = await supabase
          .from('order_items')
          .insert({
            order_id: cartId,
            product_id: product.id,
            unit_price: unitPrice,
            quantity: 1
          });
        
        if (insertError) throw insertError;
      }

      toast.success('Produto adicionado ao carrinho! 🛒');
      
      // DISPARA UM AVISO GLOBAL PARA O HEADER ATUALIZAR O NÚMERO DO CARRINHO!
      window.dispatchEvent(new Event('cart-updated'));
      
      return true;
    } catch (error: any) {
      console.error("Erro no carrinho:", error);
      toast.error('Não foi possível adicionar ao carrinho.');
      return false;
    } finally {
      setIsAdding(false);
      onClose(); // Fecha o modal
    }
  };

  const handleBuyNow = async () => {
    // Só redireciona se a função de adicionar retornar TRUE (sucesso)
    const success = await handleAddToCart();
    if (success) {
      // Como o carrinho no DB não tem página de checkout unificada ainda, 
      // podemos mandar o usuário pra tela de compras para ele ver o pedido criado
      router.push('/orders'); 
    }
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
              R$ {Number(product.base_price || product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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