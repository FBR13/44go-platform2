'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ShoppingCart, Zap, Store, Box, ArrowLeft, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { normalizeProductImages, normalizeProductSizes } from '@/lib/product-normalize';

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

  const images = useMemo(() => normalizeProductImages(product as Record<string, unknown>), [product]);
  const sizes = useMemo(() => normalizeProductSizes(product as Record<string, unknown>), [product]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes.length ? sizes[0]! : null);
  const [adding, setAdding] = useState(false);

  const isOutOfStock = (product.stock_quantity ?? 0) <= 0;
  const isLowStock = (product.stock_quantity ?? 0) > 0 && (product.stock_quantity ?? 0) <= 5;

  const basePrice = Number(product.base_price || product.price || 0);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;
  const finalPrice = salePrice && salePrice < basePrice ? salePrice : basePrice;
  const hasDiscount = salePrice !== null && salePrice < basePrice;

  const formatPrice = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const handleAddToCart = (openSidebar = true) => {
    if (isOutOfStock) {
      toast.error('Este produto está esgotado no momento. 😔');
      return;
    }
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
      toast.success('Adicionado à sacola! ✨');
      window.dispatchEvent(new CustomEvent('toggle-cart-sidebar', { detail: true }));
    }
    setTimeout(() => setAdding(false), 400);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#fa7109] transition-all lg:hidden font-bold">
        <ArrowLeft size={20} /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start bg-white p-4 sm:p-10 rounded-[3rem] shadow-sm border border-gray-100">

        {/* IMAGENS */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[2.5rem] border border-gray-100 bg-gray-50 overflow-hidden shadow-inner relative group">
            {images[activeIndex] ? (
              <img src={images[activeIndex]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={60} strokeWidth={1} /></div>
            )}

            {hasDiscount && !isOutOfStock && (
              <div className="absolute top-6 left-6 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-black px-5 py-2 rounded-2xl shadow-xl text-sm uppercase tracking-tighter">
                {Math.round(((basePrice - salePrice!) / basePrice) * 100)}% OFF
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <div className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl">Esgotado</div>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActiveIndex(i)} className={`w-20 h-20 rounded-2xl border-2 shrink-0 overflow-hidden transition-all ${activeIndex === i ? 'border-[#fa7109] scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTEÚDO */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              {product.category && (
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fa7109] bg-orange-50 px-4 py-1.5 rounded-full inline-block border border-orange-100/50">
                  {product.category}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-none tracking-tighter">
                {product.name}
              </h1>
            </div>

            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${isOutOfStock ? 'bg-red-50 border-red-100 text-red-600' : isLowStock ? 'bg-orange-50 border-orange-100 text-[#fa7109]' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
              <Box size={16} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase tracking-tight">{isOutOfStock ? 'Sem estoque' : `Estoque: ${product.stock_quantity}`}</span>
            </div>
          </div>

          <div className="mb-10">
            {hasDiscount && (
              <span className="text-xl text-gray-400 line-through font-bold block mb-[-4px] opacity-70">
                {formatPrice(basePrice)}
              </span>
            )}
            <p className="text-6xl font-black text-gray-900 tracking-tighter">
              {formatPrice(finalPrice)}
            </p>
          </div>

          <div className="space-y-8 flex-grow">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <div className="w-4 h-[2px] bg-gray-200" /> Detalhes do Produto
              </h3>
              <div className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                {product.description || "O lojista ainda não adicionou uma descrição para este item."}
              </div>
            </div>

            {sizes.length > 0 && (
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-gray-200" /> Tamanho
                </h3>
                <div className="flex flex-wrap gap-4">
                  {sizes.map((s) => (
                    <button key={s} type="button" onClick={() => setSelectedSize(s)} disabled={isOutOfStock} className={`min-w-[4rem] h-14 px-6 rounded-2xl border-2 text-sm font-black transition-all ${selectedSize === s ? 'border-[#fa7109] bg-[#fa7109] text-white shadow-xl shadow-orange-500/20 scale-105' : 'border-gray-100 bg-white text-gray-400 hover:border-[#fa7109]/30 hover:text-[#fa7109] disabled:opacity-30 disabled:hover:border-gray-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleAddToCart()}
              disabled={adding || isOutOfStock}
              className={`h-16 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-3 active:scale-95 ${isOutOfStock ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-orange-100 bg-orange-50/30 text-[#fa7109] hover:bg-orange-50 shadow-sm'}`}
            >
              <ShoppingCart size={22} />
              {isOutOfStock ? 'Indisponível' : adding ? 'Adicionado!' : 'Pôr na Sacola'}
            </button>

            <button
              onClick={() => { if (!isOutOfStock) { handleAddToCart(false); router.push('/cart'); } }}
              disabled={isOutOfStock}
              className={`h-16 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white hover:shadow-orange-500/30 hover:-translate-y-0.5'}`}
            >
              <Zap size={24} className={isOutOfStock ? "" : "fill-white"} />
              {isOutOfStock ? 'Esgotado' : 'Comprar Agora'}
            </button>
          </div>

          <Link href={`/stores/${product.store_id}`} className="mt-4 w-full h-14 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-black transition-all hover:gap-5">
            <Store size={18} /> Visitar Vitrine da Loja
          </Link>
        </div>
      </div>
    </div>
  );
}