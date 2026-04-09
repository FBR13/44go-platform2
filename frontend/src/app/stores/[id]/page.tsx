'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { CustomDropdown } from '@/components/ui/CustomDropdown'; // Importando seu novo Dropdown
import Link from 'next/link';
import { Search, Star, LayoutGrid, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function StorePage() {
  const params = useParams();
  const storeId = params.id;

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!storeId) return;

    async function fetchStoreData() {
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .maybeSingle();

        if (storeError || !storeData) return;

        const { data: ratingData } = await supabase
          .from('store_ratings')
          .select('*')
          .eq('store_id', storeId)
          .maybeSingle();

        storeData.rating = ratingData?.average_rating || 0;
        storeData.reviews_count = ratingData?.total_reviews || 0;
        setStore(storeData);

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setProducts(productsData || []);
      } catch (error) {
        console.error('Falha ao carregar loja:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, [storeId]);

  // Formata as categorias para o seu CustomDropdown
  const categoryOptions = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    const uniqueCats = Array.from(new Set(cats));

    return [
      { label: 'Todas as Categorias', value: 'all' },
      ...uniqueCats.map(cat => ({ label: cat, value: cat }))
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const title = p.title || p.name || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span>
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Abrindo as portas...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
        <Link href="/" className="text-[#fa7109] font-bold hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 -mt-4 sm:-mt-8">

      {/* BANNER E INFO DA LOJA */}
      <div className="relative h-72 sm:h-96 w-full bg-gray-900 overflow-hidden">
        {store.banner_url ? (
          <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2rem] p-1 shadow-2xl mb-6 transform -rotate-3">
            <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-100">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="text-gray-400 w-12 h-12" />
              )}
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-center tracking-tighter drop-shadow-xl text-white">
            {store.name}
          </h1>

          <div className="flex items-center gap-2 mt-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-orange-100">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-black text-gray-900 text-sm">
              {store.rating > 0 ? Number(store.rating).toFixed(1) : 'Estreante'}
            </span>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              • {store.reviews_count || 0} Avaliações
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-20px] relative z-10">

        {/* TOOLBAR: BUSCA + DROPDOWN CUSTOM */}
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] shadow-xl shadow-orange-500/5 border border-white mb-10 flex flex-col lg:flex-row gap-4 items-center">

          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`O que você procura na ${store.name}?`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#fa7109]/10 focus:border-[#fa7109] outline-none transition-all font-medium"
            />
          </div>

          <div className="w-full lg:w-72">
            <CustomDropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Filtrar Categoria"
              icon={<LayoutGrid size={16} className="text-gray-400" />}
            />
          </div>
        </div>

        {/* VITRINE DE PRODUTOS */}
        {products.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 py-32 text-center shadow-sm">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum produto disponível no momento</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium">Nenhum resultado para "{searchQuery}"</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="mt-4 text-[#fa7109] font-black uppercase text-xs tracking-widest hover:underline">Limpar filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  title: product.title || product.name,
                  base_price: product.base_price,
                  sale_price: product.sale_price, // Agora o selo de % OFF vai funcionar!
                  image_url: product.image_url
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-20 flex justify-center">
          <Link href="/products" className="flex items-center gap-2 text-gray-400 font-bold hover:text-[#fa7109] transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Ver outras lojas parceiras
          </Link>
        </div>
      </div>
    </div>
  );
}