'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function CartNavLink() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      className="relative p-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#fa7109] transition-colors"
      aria-label={
        totalItems > 0
          ? `Carrinho, ${totalItems} itens`
          : 'Carrinho'
      }
    >
      <ShoppingCart className="w-6 h-6" strokeWidth={2} />
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-[10px] font-bold leading-none">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}
