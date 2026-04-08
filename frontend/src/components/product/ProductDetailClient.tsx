'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ShoppingCart, Zap, Store, Box, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  normalizeProductImages,
  normalizeProductSizes,
} from '@/lib/product-normalize';

export type ProductDetailPayload = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  base_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  category: string | null;
  [key: string]: unknown;
};

type Props = { product: ProductDetailPayload };

export function ProductDetailClient({ product }: Props) {
  const router = useRouter();
  const { addItem } = useCart();

  const images = useMemo(
    () => normalizeProductImages(product as Record<string, unknown>),
    [product]
  );
  const sizes = useMemo(
    () => normalizeProductSizes(product as Record<string, unknown>),
    [product]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length ? sizes[0]! : null
  );
  const [adding, setAdding] = useState(false);

  const mainImage = images[activeIndex] ?? null;

  // Lógica de Preços (Promoção Real)
  const basePrice = Number(product.base_price || product.price || 0);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;
  const finalPrice = salePrice && salePrice < basePrice ? salePrice : basePrice;
  const hasDiscount = salePrice !== null && salePrice < basePrice;

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);

  const handleAddToCart = (openSidebar = true) => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho.');
      return;
    }

    setAdding(true);
    addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image_url: images[0] ?? null,
      size: selectedSize,
      quantity: 1
    });

    if (openSidebar) {
      toast.success('Adicionado à sacola! 🛍️');
      window.dispatchEvent(new CustomEvent('toggle-cart-sidebar', { detail: true }));
    }

    setTimeout(() => setAdding(false), 400);
  };

  const handleBuyNow = () => {
    handleAddToCart(false);
    router.push('/cart');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Botão Voltar mobile */}
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors lg:hidden">
        <ArrowLeft size={20} /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start bg-white p-4 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">

        {/* COLUNA ESQUERDA: IMAGENS */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[2rem] border border-gray-100 bg-gray-50 overflow-hidden shadow-inner relative">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="w-24 h-24 opacity-40" strokeWidth={1} />
              </div>
            )}

            {hasDiscount && (
              <div className="absolute top-6 left-6 bg-green-500 text-white font-black px-4 py-1.5 rounded-full shadow-lg text-sm animate-in zoom-in">
                {Math.round(((basePrice - salePrice!) / basePrice) * 100)}% OFF
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setActiveIndex(i)}
                  className={`w-20 h-20 rounded-2xl border-2 shrink-0 overflow-hidden transition-all ${activeIndex === i ? 'border-[#fa7109] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: INFO E COMPRA */}
        <div className="flex flex-col h-full py-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              {product.category && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fa7109] bg-orange-50 px-3 py-1 rounded-full mb-3 inline-block">
                  {product.category}
                </span>
              )}
              <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter">
                {product.name}
              </h1>
            </div>

            {/* BADGE DE ESTOQUE (Igual ao seu print) */}
            <div className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shrink-0">
              <Box size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600">Estoque: {product.stock_quantity || 0}</span>
            </div>
          </div>

          <div className="mb-8">
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through font-medium block mb-[-8px]">
                {formatPrice(basePrice)}
              </span>
            )}
            <p className="text-5xl font-black text-[#fa7109] tracking-tighter">
              {formatPrice(finalPrice)}
            </p>
          </div>

          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Descrição do Produto</h3>
              <div className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
                {product.description || "Nenhuma descrição informada pelo lojista."}
              </div>
            </div>

            {sizes.length > 0 && (
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Selecione o Tamanho</h3>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[3.5rem] h-12 px-4 rounded-xl border-2 text-sm font-bold transition-all ${selectedSize === s
                          ? 'border-[#fa7109] bg-[#fa7109] text-white shadow-lg shadow-orange-200 scale-105'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GRUPO DE BOTÕES (Igual ao print) */}
          <div className="mt-12 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleAddToCart()}
                disabled={adding}
                className="flex-[1] h-16 rounded-2xl border-2 border-orange-100 bg-orange-50/50 text-[#fa7109] font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <ShoppingCart size={20} />
                {adding ? 'Adicionado!' : 'Add ao Carrinho'}
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-[1.5] h-16 rounded-2xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-black text-lg hover:shadow-xl hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap size={22} className="fill-white" />
                Comprar Agora
              </button>
            </div>

            <Link
              href={`/store/${product.store_id}`}
              className="w-full h-14 rounded-2xl bg-[#111827] text-white font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              <Store size={18} />
              Ver página da Loja
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 border-t border-gray-100 pt-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#fa7109]"><Package size={18} /></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Original</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#fa7109]"><Zap size={18} /></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Rápido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}