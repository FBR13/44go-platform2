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
    <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden rounded-3xl shadow-2xl bg-gray-900">
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
            className="w-full h-full object-cover opacity-60"
            alt={store.name}
          />
          
          {/* Conteúdo do "Cartaz" */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="w-24 h-24 mb-4 rounded-full border-4 border-white overflow-hidden bg-white">
              <img src={store.logo_url || '/logo-placeholder.png'} alt={store.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-2 drop-shadow-lg">{store.name}</h2>
            <p className="text-lg md:text-xl max-w-lg font-light drop-shadow-md">
              {store.description || 'Confira as novidades da nossa loja!'}
            </p>
            <a 
              href={`/store/${store.slug}`}
              className="mt-6 bg-gradient-to-r from-[#fa7109] to-[#ab0029] hover:bg-white hover:text-[#cecece] text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105"
            >
              Visitar Loja
            </a>
          </div>
        </div>
      ))}

      {/* Pontinhos de navegação */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
        {stores.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === current ? 'bg-[#fa7109] w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}