'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionContainer } from '@/components/SectionContainer';
import { CategoryItem } from '@/components/CategoryItem';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES, DAILY_OFFERS } from '@/lib/mock-data';
import { StoreCarousel } from '@/components/StoreCarousel';
import { apiUrl } from '@/lib/api';

export default function Home() {
  const { user } = useAuth();

  const [realProducts, setRealProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(apiUrl('/products'));
        if (response.ok) {
          const data = await response.json();
          setRealProducts(data);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
    }

    async function fetchStores() {
      try {
        const response = await fetch(apiUrl('/stores'));
        if (response.ok) {
          const data = await response.json();
          setStores(data.filter((s: any) => s.banner_url));
        }
      } catch (error) {
        console.error("Erro ao carregar lojas:", error);
      }
    }

    fetchProducts();
    fetchStores();
  }, []);

  return (
    <div className="flex flex-col min-h-screen -mt-4 sm:-mt-8">

      {/* HERO SECTION - Ajustada para Mobile */}
      <section className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">

          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[#fa7109] text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-sm">
            <span className="animate-pulse">🚀</span>
            Compre direto dos lojistas da região da 44
          </div>

          {/* Fonte reduzida no mobile (text-4xl) e gigante no PC (md:text-6xl) */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight">
            O seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">marketplace</span> local.
          </h1>

          <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            Compre dos melhores comércios da sua região ou crie a sua própria loja virtual em poucos minutos. O 44Go conecta você a tudo.
          </p>

          {/* Botões empilhados no mobile (flex-col) e lado a lado no PC (sm:flex-row) */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
            {!user ? (
              <Link
                href="/auth/register"
                className="w-full sm:w-auto bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3.5 rounded-full text-base sm:text-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
              >
                Criar minha conta
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3.5 rounded-full text-base sm:text-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
              >
                Ir para meu Painel
              </Link>
            )}

            <Link
              href="/products"
              className="w-full sm:w-auto bg-white text-gray-900 border border-gray-300 px-8 py-3.5 rounded-full text-base sm:text-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Explorar Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* CARROSSEL DE LOJAS */}
      {stores.length > 0 && (
        <section className="px-2 sm:px-4 py-4 sm:py-8 max-w-7xl mx-auto w-full">
          <StoreCarousel stores={stores} />
        </section>
      )}

      {/* CATEGORIAS (Scroll Horizontal Mobile) */}
      <SectionContainer>
        <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-6 pb-4 pt-2 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((category) => (
            <CategoryItem key={category.id} name={category.name} icon={category.icon} />
          ))}
        </div>
      </SectionContainer>

      {/* OFERTAS DO DIA - Respiros ajustados (gap-3 no mobile, gap-6 no PC) */}
      <SectionContainer
        title="Ofertas do Dia 🔥"
        subtitle="Preços especiais com tempo limitado"
        className="bg-gray-50/80 rounded-2xl sm:rounded-3xl mx-2 sm:mx-6 lg:mx-8 my-6 sm:my-8 border border-gray-100 p-4 sm:p-0"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {DAILY_OFFERS.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </SectionContainer>

      {/* PRODUTOS EM DESTAQUE */}
      <SectionContainer
        title="Destaques da Região"
        subtitle="Os itens reais recém-postados pelos lojistas"
      >
        {loadingProducts ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#fa7109]"></div>
          </div>
        ) : realProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {realProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  // CORREÇÃO AQUI: Mudamos de product.name para product.title
                  title: product.title || product.name || 'Produto sem título',
                  // CORREÇÃO AQUI: Mudamos de product.price para product.base_price
                  base_price: product.base_price || product.price || 0,
                  image_url: product.image_url || product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
                  badge: 'Novo'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 mx-4 sm:mx-0">
            <p className="text-gray-500 text-sm sm:text-base font-medium px-4">Nenhum produto cadastrado ainda. Seja o primeiro a vender!</p>
          </div>
        )}

        <div className="mt-8 sm:mt-12 text-center px-4 sm:px-0">
          <Link
            href="/products"
            className="flex sm:inline-flex items-center justify-center bg-white text-[#fa7109] border-2 border-[#fa7109]/20 px-8 py-3 rounded-full text-base font-medium hover:bg-orange-50/50 hover:border-[#fa7109] transition-all w-full sm:w-auto"
          >
            Ver todos os produtos
          </Link>
        </div>
      </SectionContainer>

    </div>
  );
}