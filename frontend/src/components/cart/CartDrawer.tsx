'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Trash2, Plus, Minus, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { lines, subtotal, removeItem, updateQuantity } = useCart();

  // Ouve o evento global para abrir/fechar de qualquer lugar do site
  useEffect(() => {
    const handleToggle = (e: any) => setIsOpen(e.detail);
    window.addEventListener('toggle-cart-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-cart-sidebar', handleToggle);
  }, []);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <>
      {/* Overlay escuro */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Gaveta Lateral */}
      <div 
        className={`fixed inset-y-0 right-0 z-[110] w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#fa7109]" /> 
            Sua Sacola
            <span className="bg-orange-100 text-[#fa7109] text-xs py-0.5 px-2 rounded-full font-bold ml-1">
              {lines.length}
            </span>
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium">Sua sacola está vazia.</p>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.key} className="flex gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  {line.image_url ? (
                    <img src={line.image_url} alt={line.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <Package size={24}/>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{line.name}</h4>
                    <p className="text-[#fa7109] font-black text-sm mt-1">{formatPrice(line.price * line.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        className="p-1 hover:bg-gray-200 text-gray-600 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-900">{line.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        className="p-1 hover:bg-gray-200 text-gray-600 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(line.key)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        {lines.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-2xl font-black text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <Link 
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Finalizar Compra
            </Link>
          </div>
        )}
      </div>
    </>
  );
}