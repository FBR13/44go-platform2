'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import { Search, Star, Filter } from 'lucide-react';

export default function StorePage() {
  const params = useParams();
  const storeId = params.id;

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Novos estados para filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (!storeId) return;

    async function fetchStoreData() {
      try {
        // 1. Busca os dados da loja
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .maybeSingle();

        if (storeError) {
          console.error('Erro ao buscar loja:', storeError);
          return;
        }

        if (!storeData) return;

        // 2. Busca as avaliações REAIS da view 'store_ratings'
        const { data: ratingData, error: ratingError } = await supabase
          .from('store_ratings')
          .select('*')
          .eq('store_id', storeId)
          .maybeSingle();

        if (ratingError) {
          console.error('Erro ao buscar nota da loja:', ratingError);
        }

        // Atribui os dados reais ou zera se não tiver avaliações
        if (ratingData) {
          storeData.rating = ratingData.average_rating;
          storeData.reviews_count = ratingData.total_reviews;
        } else {
          storeData.rating = 0;
          storeData.reviews_count = 0;
        }

        setStore(storeData);

        // 3. Busca os produtos
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('Erro ao buscar produtos:', productsError);
          return;
        }

        setProducts(productsData || []);
      } catch (error) {
        console.error('Falha inesperada:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, [storeId]);

  // Extrair categorias únicas dos produtos para o select
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [products]);

  // Filtrar produtos baseados na busca e na categoria
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const title = p.title || p.name || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#fa7109]"></span>
        <p className="text-gray-500 font-medium">Montando a vitrine...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <span className="text-6xl mb-4">🏪</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
        <p className="text-gray-500 mb-6">A loja que você está procurando não existe ou foi removida.</p>
        <Link href="/" className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-6 py-2.5 rounded-full font-medium shadow-md">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 -mt-4 sm:-mt-8">
      
      {/* BANNER SUPERIOR DA LOJA */}
      <div className="relative h-64 sm:h-80 w-full bg-gray-900 overflow-hidden">
        {store.banner_url ? (
          <>
            <img src={store.banner_url} alt={`Banner da loja ${store.name}`} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
        )}
        
        {/* Informações da Loja */}
        <div className="absolute inset-0 flex flex-col items-center justify-end text-white p-6 pb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full p-1 shadow-2xl mb-4">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
              {store.logo_url ? (
                <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-black">🏪</span>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-center drop-shadow-lg tracking-tight mb-2">
            {store.name}
          </h1>

          {/* Avaliação da Loja (DADOS REAIS) */}
          <div className="flex items-center gap-1.5 mb-3 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-sm">
              {store.rating > 0 ? Number(store.rating).toFixed(1) : 'Novo'}
            </span>
            <span className="text-gray-300 text-sm">
              ({store.reviews_count || 0} avaliações)
            </span>
          </div>

          {store.description && (
            <p className="text-sm sm:text-base text-gray-200 max-w-xl text-center drop-shadow-md line-clamp-2">
              {store.description}
            </p>
          )}
        </div>
      </div>

      {/* ÁREA DE PRODUTOS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Toolbar de Busca e Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {/* Barra de Pesquisa */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar em ${store.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none transition-all"
            />
          </div>

          {/* Filtros e Contagem */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {categories.length > 0 && (
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none appearance-none cursor-pointer transition-all text-gray-700"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat as string} value={cat as string}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="text-sm font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-4 py-2 rounded-xl">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </div>
          </div>
        </div>

        {/* Vitrine */}
        {products.length === 0 ? (
          // Loja sem NENHUM produto cadastrado
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 sm:p-16 text-center shadow-sm">
            <span className="text-6xl mb-4 block">📦</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-500 max-w-md mx-auto">Esta loja ainda não adicionou produtos ou eles estão esgotados no momento.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          // Produto não encontrado na BUSCA/FILTRO
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-500">Não encontramos produtos correspondentes à sua busca.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
              className="mt-4 text-[#fa7109] font-medium hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={{
                  id: product.id,
                  title: product.title || product.name,
                  base_price: product.base_price || product.price,
                  image_url: product.image_url || product.image || '', 
                }} 
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}