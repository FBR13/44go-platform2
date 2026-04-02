'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
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
  category: string | null;
  [key: string]: unknown;
};

type Props = { product: ProductDetailPayload };

export function ProductDetailClient({ product }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const images = useMemo(
    () => normalizeProductImages(product as Record<string, unknown>),
    [product],
  );
  const sizes = useMemo(
    () => normalizeProductSizes(product as Record<string, unknown>),
    [product],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length ? sizes[0]! : null,
  );
  const [adding, setAdding] = useState(false);

  const mainImage = images[activeIndex] ?? null;

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(n));

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      return;
    }
    setAdding(true);
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: images[0] ?? null,
      size: selectedSize,
    });
    setTimeout(() => setAdding(false), 400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
      <div className="space-y-4">
        <div className="aspect-square rounded-2xl border border-gray-200 bg-gray-100 overflow-hidden">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-24 h-24 opacity-40" strokeWidth={1.25} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <ul className="flex gap-2 flex-wrap">
            {images.map((src, i) => (
              <li key={`${src}-${i}`}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden bg-gray-100 ${
                    activeIndex === i
                      ? 'border-[#fa7109]'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        {product.category && (
          <p className="text-sm font-medium text-[#fa7109] mb-2">
            {product.category}
          </p>
        )}
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {product.name}
        </h1>
        <p className="mt-4 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">
          {formatPrice(product.price)}
        </p>

        {product.description && (
          <div className="mt-6 text-gray-600 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium text-gray-900 mb-2">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSize === s
                      ? 'border-[#fa7109] bg-orange-50 text-gray-900'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || (sizes.length > 0 && !selectedSize)}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adicionado!' : 'Adicionar ao carrinho'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="py-3.5 px-6 rounded-xl border border-gray-300 font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Ver carrinho
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          <Link
            href={`/store/${product.store_id}`}
            className="text-[#fa7109] hover:underline font-medium"
          >
            Ver loja
          </Link>
          {' · '}
          <Link href="/products" className="hover:underline">
            Voltar aos produtos
          </Link>
        </p>
      </div>
    </div>
  );
}
