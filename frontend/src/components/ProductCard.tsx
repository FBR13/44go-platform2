'use client';

import { useState } from 'react';
import { ProductModal } from './ProductModal'; // <-- Importe o Modal

export function ProductCard({ product }: { product: any }) {
  // Estado para controlar se o modal está aberto ou não
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* O CARD DO PRODUTO */}
      <div 
        onClick={() => setIsModalOpen(true)} // <-- Ao clicar, abre o modal
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
      >
        {/* IMAGEM DO CARD */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">📦</div>
          )}
          
          {/* Efeitinho hover "Ver Detalhes" */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-full text-sm">Ver Detalhes</span>
          </div>
        </div>

        {/* INFO DO CARD */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-gray-900 line-clamp-2 text-sm sm:text-base mb-1">
            {product.title || product.name}
          </h3>
          <p className="text-[#fa7109] font-extrabold text-lg mt-auto">
            R$ {Number(product.base_price || product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* O MODAL QUE SÓ APARECE QUANDO O ESTADO FOR TRUE */}
      <ProductModal 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}