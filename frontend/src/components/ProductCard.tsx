'use client';

import { useState } from 'react';
import { ProductModal } from './ProductModal';
import { ShoppingCart, Plus, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

export function ProductCard({ product }: { product: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addItem } = useCart();

  // LÓGICA DE PREÇO REAL
  const basePrice = Number(product.base_price || 0);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;

  // O preço final é o de oferta (se existir), senão é o base
  const finalPrice = salePrice && salePrice < basePrice ? salePrice : basePrice;
  const hasDiscount = salePrice !== null && salePrice < basePrice;

  const formatPrice = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();

    addItem({
      productId: product.id,
      name: product.title || product.name,
      price: finalPrice,
      image_url: product.image_url,
      size: null,
      quantity: 1
    });

    toast.success('Adicionado à sacola! 🛍️', {
      description: product.title || product.name,
    });

    window.dispatchEvent(new CustomEvent('toggle-cart-sidebar', { detail: true }));
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
      >
        {/* ÁREA DA IMAGEM */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart size={40} strokeWidth={1.5} />
            </div>
          )}

          {/* BADGE DE DESCONTO REAL (Só aparece se houver desconto) */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 animate-in zoom-in">
              <Tag size={10} fill="white" />
              {Math.round(((basePrice - salePrice!) / basePrice) * 100)}% OFF
            </div>
          )}
        </div>

        {/* INFO DO PRODUTO */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug group-hover:text-[#fa7109] transition-colors mb-2">
            {product.title || product.name}
          </h3>

          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {/* Preço Original Riscado (Só aparece se houver desconto) */}
              {hasDiscount && (
                <span className="text-[11px] text-gray-400 line-through mb-[-4px]">
                  {formatPrice(basePrice)}
                </span>
              )}
              <span className="text-[#fa7109] font-black text-lg">
                {formatPrice(finalPrice)}
              </span>
            </div>

            {/* BOTÃO ADICIONAR RÁPIDO */}
            <button
              onClick={handleQuickAdd}
              className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center ${hasDiscount
                  ? 'bg-green-100 text-green-600 hover:bg-green-500 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-[#fa7109] hover:text-white'
                }`}
              title="Adicionar à sacola"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <ProductModal
        product={{ ...product, current_price: finalPrice }} // Passa o preço correto pro modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}