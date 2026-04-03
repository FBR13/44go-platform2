'use client';
import { useEffect, useState } from 'react';

export function StoreCarousel({ stores }: { stores: any[] }) {
  const [current, setCurrent] = useState(0);

  // Faz passar sozinho a cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === stores.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [stores.length]);

  if (!stores.length) return null;

  return (
    // Reduzimos a altura no mobile (h-[240px]) e mantivemos alta no PC (md:h-[450px])
    <div className="relative w-full h-[240px] md:h-[450px] overflow-hidden rounded-2xl md:rounded-3xl shadow-xl bg-gray-900 group">
      {stores.map((store, index) => (
        <div
          key={store.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Imagem de Fundo (Banner) */}
          <img
            src={store.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200'}
            className="w-full h-full object-cover opacity-50"
            alt={store.name}
          />
          
          {/* Fundo Gradiente extra para melhorar a leitura do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Conteúdo do "Cartaz" */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 md:p-6 text-center z-10">
            
            {/* Logo da Loja - Menor no mobile */}
            <div className="w-16 h-16 md:w-24 md:h-24 mb-3 md:mb-4 rounded-full border-2 md:border-4 border-white overflow-hidden bg-white shadow-lg">
              <img src={store.logo_url || '/logo-placeholder.png'} alt={store.name} className="w-full h-full object-contain" />
            </div>
            
            {/* Título - Reduzido no mobile */}
            <h2 className="text-2xl sm:text-3xl md:text-6xl font-black mb-1 md:mb-2 drop-shadow-lg px-2 line-clamp-1">
              {store.name}
            </h2>
            
            {/* Descrição - Oculta em telas muito pequenas para não poluir, visível a partir de 'sm' */}
            <p className="hidden sm:block text-sm md:text-xl max-w-lg font-light drop-shadow-md px-4 line-clamp-2">
              {store.description || 'Confira as novidades da nossa loja!'}
            </p>
            
            {/* Botão de Visitar */}
            <a 
              href={`/store/${store.slug}`}
              className="mt-3 md:mt-6 bg-gradient-to-r from-[#fa7109] to-[#ab0029] hover:opacity-90 text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold transition-all transform hover:scale-105 text-sm md:text-base shadow-lg"
            >
              Visitar Loja
            </a>
          </div>
        </div>
      ))}

      {/* Pontinhos de navegação */}
      <div className="absolute bottom-3 md:bottom-6 left-0 right-0 flex justify-center gap-1.5 md:gap-2 z-20">
        {stores.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? 'bg-[#fa7109] w-6 md:w-8' : 'bg-white/50 w-2 hover:bg-white/80'
            }`}
            aria-label={`Ir para a loja ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}