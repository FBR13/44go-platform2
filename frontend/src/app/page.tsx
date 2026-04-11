'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SectionContainer } from '@/components/SectionContainer';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES, DAILY_OFFERS } from '@/lib/mock-data';
import { StoreCarousel } from '@/components/StoreCarousel';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Shirt, // Masculino/Feminino
  Smartphone, // Eletrônicos
  Watch, // Acessórios
  Baby, // Infantil
  Footprints, // Calçados
  Sparkle // Beleza
} from 'lucide-react';

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setRealProducts(data || []);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
    }

    async function fetchStores() {
      try {
        const { data, error } = await supabase.from('stores').select('*');
        if (error) throw error;
        setStores(data?.filter((s: any) => s.banner_url) || []);
      } catch (error) {
        console.error("Erro ao carregar lojas:", error);
      }
    }

    fetchProducts();
    fetchStores();
  }, []);

  const filteredProducts = realProducts.filter((product: any) => {
    const productTitle = (product.title || product.name || '').toLowerCase();
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = productTitle.includes(search);
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    // Fundo da página levemente cinza para destacar os cards brancos
    <div className="flex flex-col min-h-screen bg-gray-50/50 -mt-4 sm:-mt-8">

      {/* ========================================================
          1. HERO SECTION (Fundo Branco, Curvado embaixo)
          ======================================================== */}
      <section className="relative bg-white pt-16 sm:pt-24 pb-20 sm:pb-28 px-4 text-center rounded-b-[2.5rem] sm:rounded-b-[4rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100/50 text-[#fa7109] text-xs sm:text-sm font-bold tracking-wide mb-6 sm:mb-8 transition-transform hover:scale-105 cursor-default">
            <Sparkles className="w-4 h-4" />
            Compre direto dos lojistas da região da 44
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
            O Seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">Marketplace</span> Local
          </h1>

          <p className="text-base sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed px-4 font-medium">
            Compre dos melhores comércios da sua região ou crie a sua própria loja virtual em poucos minutos. O 44Go conecta você a tudo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
            {!user ? (
              <Link href="/auth/register" className="w-full sm:w-auto bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-4 rounded-2xl text-base sm:text-lg font-bold hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                Criar minha conta
              </Link>
            ) : (
              <Link href="/dashboard" className="w-full sm:w-auto bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-4 rounded-2xl text-base sm:text-lg font-bold hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                Ir para meu Painel
              </Link>
            )}
            <Link href="#produtos" className="w-full sm:w-auto bg-white text-gray-800 border-2 border-gray-200 px-8 py-4 rounded-2xl text-base sm:text-lg font-bold hover:border-[#fa7109] hover:text-[#fa7109] transition-all flex items-center justify-center gap-2">
              Explorar Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. CARROSSEL DE BANNERS (Sobrepondo o Hero)
          ======================================================== */}
      {stores.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-20">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-white">
            <StoreCarousel stores={stores} />
          </div>
        </section>
      )}

      {/* ========================================================
          3. CATEGORIAS (Estilo App Icons)
          ======================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            O que você procura?
          </h2>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-4 sm:gap-6 pb-6 pt-2 snap-x">
          {[
            { id: 1, name: 'Moda Feminina', icon: <Shirt className="w-8 h-8" />, color: 'text-pink-500' },
            { id: 2, name: 'Moda Masculina', icon: <Shirt className="w-8 h-8" />, color: 'text-blue-500' },
            { id: 3, name: 'Calçados', icon: <Footprints className="w-8 h-8" />, color: 'text-orange-500' },
            { id: 4, name: 'Acessórios', icon: <Watch className="w-8 h-8" />, color: 'text-purple-500' },
            { id: 5, name: 'Beleza', icon: <Sparkle className="w-8 h-8" />, color: 'text-rose-500' },
            { id: 6, name: 'Eletrônicos', icon: <Smartphone className="w-8 h-8" />, color: 'text-cyan-500' },
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              className="flex-shrink-0 flex flex-col items-center gap-3 w-[100px] sm:w-[120px] group outline-none snap-start"
            >
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl ${selectedCategory === category.name
                  ? 'bg-gradient-to-br from-[#fa7109] to-[#ab0029] text-white shadow-orange-500/30 scale-105'
                  : 'bg-white border border-gray-100'
                }`}>
                <div className={selectedCategory === category.name ? 'text-white' : category.color}>
                  {category.icon}
                </div>
              </div>
              <span className={`text-xs sm:text-[13px] font-black text-center uppercase tracking-tighter transition-colors ${selectedCategory === category.name ? 'text-[#fa7109]' : 'text-gray-500 group-hover:text-gray-900'
                }`}>
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================
          4. OFERTAS DO DIA (Container com Fundo Dinâmico)
          ======================================================== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-[2.5rem] p-6 sm:p-10 border border-orange-100/50 shadow-sm relative overflow-hidden">
          {/* Elemento decorativo de fundo */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <TrendingUp className="w-64 h-64 text-[#fa7109]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white p-2.5 rounded-xl shadow-sm text-[#fa7109]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ofertas do Dia 🔥</h2>
                <p className="text-sm font-medium text-[#fa7109]">Preços especiais com tempo limitado</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {DAILY_OFFERS.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <ProductCard product={product as any} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. VITRINE GERAL DE PRODUTOS
          ======================================================== */}
      <div id="produtos" className="pb-20">
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-[#fa7109]" />
                {searchTerm ? `Resultados para "${searchTerm}"` : selectedCategory ? `Itens de ${selectedCategory}` : "Destaques da Região"}
              </h2>
              <p className="text-gray-500 mt-1 font-medium">
                {searchTerm || selectedCategory ? `${filteredProducts.length} produto(s) encontrado(s)` : "As novidades recém-postadas pelos lojistas"}
              </p>
            </div>

            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  router.push('/');
                }}
                className="text-sm font-bold text-[#fa7109] bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors w-fit"
              >
                Limpar Filtros ✕
              </button>
            )}
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa7109]"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm mx-auto max-w-3xl">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                Não encontramos itens com o nome <strong className="text-gray-800">"{searchTerm}"</strong>{selectedCategory && ` na categoria ${selectedCategory}`}.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  router.push('/');
                }}
                className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3.5 rounded-2xl font-bold hover:scale-105 transition-all shadow-md"
              >
                Ver todo o catálogo
              </button>
            </div>
          )}

          <div className="mt-12 sm:mt-16 text-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-white text-gray-900 border border-gray-200 px-10 py-4 rounded-2xl text-base font-bold hover:border-[#fa7109] hover:text-[#fa7109] transition-all shadow-sm w-full sm:w-auto"
            >
              Carregar mais produtos
            </Link>
          </div>
        </section>
      </div>

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500"><span className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa7109]"></span></div>}>
      <HomeContent />
    </Suspense>
  );
}