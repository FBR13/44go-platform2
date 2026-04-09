'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function StoreCarousel({ stores }: { stores: any[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === stores.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [stores.length, isPaused]);

  const nextSlide = () => setCurrent((prev) => (prev === stores.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? stores.length - 1 : prev - 1));

  if (!stores.length) return null;

  return (
    <div
      className="relative w-full h-[320px] sm:h-[450px] lg:h-[550px] overflow-hidden rounded-[2rem] shadow-2xl bg-gray-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {stores.map((store, index) => (
        <div
          key={store.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'
            }`}
        >
          {store.banner_url && (
            <img
              src={store.banner_url}
              className="w-full h-full object-cover opacity-60"
              alt={store.name}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10">
            <div className="w-20 h-20 md:w-28 md:h-28 mb-4 md:mb-6 rounded-[1.5rem] border-2 border-white/20 bg-white shadow-2xl flex items-center justify-center text-4xl overflow-hidden transform transition-transform group-hover:scale-105">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#fa7109] font-black text-3xl">{store.name?.charAt(0)}</span>
              )}
            </div>

            <span className="bg-[#fa7109] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-md">
              Loja em Destaque
            </span>

            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-3 drop-shadow-xl line-clamp-1">
              {store.name}
            </h2>

            {store.description && (
              <p className="hidden sm:block text-sm md:text-xl max-w-2xl font-medium text-gray-200 drop-shadow-md line-clamp-2 mb-2">
                {store.description}
              </p>
            )}

            <Link
              href={`/stores/${store.id}`}
              className="mt-6 md:mt-8 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3 md:px-12 md:py-4 rounded-full font-black transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(250,113,9,0.4)] text-base md:text-lg inline-block"
            >
              Visitar Loja
            </Link>
          </div>
        </div>
      ))}

      {/* Setas de Navegação - ADICIONADO Z-30 PARA FUNCIONAR O CLIQUE */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Evita conflitos com outros cliques
          prevSlide();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all hidden sm:block z-30"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all hidden sm:block z-30"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Pontinhos */}
      <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
        {stores.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-gradient-to-r from-[#fa7109] to-[#ab0029] w-8' : 'bg-white/40 w-2.5 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}