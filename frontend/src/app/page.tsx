'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionContainer } from '@/components/SectionContainer';
import { CategoryItem } from '@/components/CategoryItem';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES, DAILY_OFFERS } from '@/lib/mock-data';
import { StoreCarousel } from '@/components/StoreCarousel';

export default function Home() {
  const { user } = useAuth();
  
  // Estados para gerenciar os dados do Backend
  const [realProducts, setRealProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stores, setStores] = useState([]); // Estado para as lojas do carrossel

  useEffect(() => {
    // Busca os produtos
    async function fetchProducts() {
      try {
        const response = await fetch('http://localhost:3333/api/products');
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

    // Busca as lojas para o carrossel
    async function fetchStores() {
      try {
        const response = await fetch('http://localhost:3333/api/stores');
        if (response.ok) {
          const data = await response.json();
          // Filtra apenas as lojas que têm banner para exibir no carrossel
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
    <div className="flex flex-col min-h-screen -mt-8"> 
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[#fa7109] text-sm font-medium mb-8 shadow-sm">
            <span className="animate-pulse">🚀</span>
            Compre direto dos lojistas da região da 44
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            O seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">marketplace</span> local.
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Compre dos melhores comércios da sua região ou crie a sua própria loja virtual em poucos minutos. O 44Go conecta você a tudo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            {!user ? (
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
              >
                Criar minha conta
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
              >
                Ir para meu Painel
              </Link>
            )}
            
            <Link
              href="/products"
              className="bg-white text-gray-900 border border-gray-300 px-8 py-3.5 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Explorar Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* CARROSSEL DE LOJAS (Aparece se houver lojas com banner) */}
      {stores.length > 0 && (
        <section className="px-4 py-8 max-w-7xl mx-auto w-full">
          <StoreCarousel stores={stores} />
        </section>
      )}

      {/* CATEGORIAS (Scroll Horizontal Mobile) */}
      <SectionContainer>
        <div className="flex overflow-x-auto hide-scrollbar gap-4 sm:gap-6 pb-4 pt-2 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((category) => (
            <CategoryItem key={category.id} name={category.name} icon={category.icon} />
          ))}
        </div>
      </SectionContainer>

      {/* OFERTAS DO DIA */}
      <SectionContainer 
        title="Ofertas do Dia 🔥" 
        subtitle="Preços especiais com tempo limitado"
        className="bg-gray-50/80 rounded-3xl sm:mx-6 lg:mx-8 my-8 border border-gray-100"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {realProducts.map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
                  badge: 'Novo'
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Nenhum produto cadastrado ainda. Seja o primeiro a vender!</p>
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-white text-[#fa7109] border-2 border-[#fa7109]/20 px-8 py-3 rounded-full text-base font-medium hover:bg-orange-50/50 hover:border-[#fa7109] transition-all"
          >
            Ver todos os produtos
          </Link>
        </div>
      </SectionContainer>

    </div>
  );
}