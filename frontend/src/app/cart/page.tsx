'use client';

import Link from 'next/link';
import { Package, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(n));

  if (lines.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
        <h1 className="text-xl font-semibold text-gray-900">Seu carrinho está vazio</h1>
        <p className="mt-2 text-gray-600 text-sm">
          Os produtos que você adicionar ficam salvos neste navegador (mesmo após
          fechar a aba), até você concluir o pedido ou limpar o carrinho.
        </p>
        <Link
          href="/products"
          className="inline-block mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-medium hover:opacity-95 transition-opacity"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">
        Carrinho
      </h1>

      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white overflow-hidden">
        {lines.map((line) => (
          <li
            key={line.key}
            className="flex flex-col sm:flex-row gap-4 p-4 sm:items-center"
          >
            <div className="flex gap-4 flex-1 min-w-0">
              <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                {line.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-10 h-10 opacity-50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${line.productId}`}
                  className="font-semibold text-gray-900 hover:text-[#fa7109] transition-colors line-clamp-2"
                >
                  {line.name}
                </Link>
                {line.size && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tamanho: {line.size}
                  </p>
                )}
                <p className="text-sm font-medium text-gray-900 mt-2 sm:hidden">
                  {formatPrice(line.price * line.quantity)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-0 sm:pl-0">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  disabled={line.quantity <= 1}
                  onClick={() =>
                    updateQuantity(line.key, line.quantity - 1)
                  }
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                  onClick={() =>
                    updateQuantity(line.key, line.quantity + 1)
                  }
                >
                  +
                </button>
              </div>

              <p className="hidden sm:block w-28 text-right font-semibold text-gray-900 tabular-nums">
                {formatPrice(line.price * line.quantity)}
              </p>

              <button
                type="button"
                aria-label="Remover item"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => removeItem(line.key)}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 pt-6">
        <p className="text-lg">
          <span className="text-gray-600">Subtotal </span>
          <span className="font-bold text-gray-900 tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/products"
            className="text-center py-3 px-5 rounded-xl border border-gray-300 font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Continuar comprando
          </Link>
          <Link
            href="/checkout"
            className="text-center py-3 px-5 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-semibold hover:opacity-95 transition-opacity"
          >
            Finalizar pedido
          </Link>
        </div>
      </div>
    </div>
  );
}
