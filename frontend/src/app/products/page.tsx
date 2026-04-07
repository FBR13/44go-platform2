'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Package, Search, Store, ShoppingCart, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const STORES_PER_PAGE = 5;

type Product = {
  id: string;
  title: string;
  name?: string;
  base_price: number;
  price?: number;
  image_url: string;
  image?: string;
};

type StoreData = {
  id: string;
  name: string;
  banner_url: string | null;
  logo_url: string | null;
  description: string | null;
  products: Product[];
};

export default function MarketplacePage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchStoresAndProducts() {
      setLoading(true);
      try {
        // 1. Calcula o intervalo da paginação
        const from = (currentPage - 1) * STORES_PER_PAGE;
        const to = from + STORES_PER_PAGE - 1;

        // 2. Busca as lojas (com paginação e filtro de busca se houver)
        let query = supabase
          .from('stores')
          .select('*', { count: 'exact' });

        if (searchQuery.trim()) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data: storesData, count, error: storesError } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (storesError) throw storesError;

        if (count) {
          setTotalPages(Math.ceil(count / STORES_PER_PAGE));
        }

        if (!storesData || storesData.length === 0) {
          setStores([]);
          setLoading(false);
          return;
        }

        // 3. Busca os produtos que pertencem APENAS às lojas desta página
        const storeIds = storesData.map(s => s.id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('store_id', storeIds)
          .eq('is_active', true);

        if (productsError) throw productsError;

        // 4. Agrupa os produtos dentro de suas respectivas lojas
        const formattedStores: StoreData[] = storesData.map(store => {
          const storeProducts = (productsData || [])
            .filter(p => p.store_id === store.id)
            .slice(0, 4); // Pega até 4 produtos para ficar bonito no grid

          return {
            ...store,
            products: storeProducts
          };
        });

        // Filtra para mostrar apenas lojas que têm pelo menos 1 produto cadastrado
        // (Opcional: remova o .filter abaixo se quiser mostrar lojas vazias também)
        setStores(formattedStores.filter(s => s.products.length > 0));

      } catch (error) {
        console.error('Erro ao buscar marketplace:', error);
        toast.error('Erro ao carregar as lojas.');
      } finally {
        setLoading(false);
      }
    }

    // Debounce manual simples para a busca
    const timeoutId = setTimeout(() => {
      fetchStoresAndProducts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  // Funções simuladas para os botões do produto
  const handleAddToCart = (productTitle: string) => {
    toast.success(`${productTitle} adicionado ao carrinho!`);
    // Aqui você vai integrar com o seu contexto de carrinho futuramente
  };

  const handleBuyNow = (productTitle: string) => {
    toast.info(`Iniciando compra de ${productTitle}...`);
    // Aqui você vai redirecionar para o checkout
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* CABEÇALHO E BUSCA */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-[#fa7109]" />
            Lojas Parceiras
          </h1>
          <p className="mt-2 text-gray-600">
            Explore as vitrines e descubra produtos incríveis perto de você.
          </p>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar lojas..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reseta a página ao buscar
            }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#fa7109]"></span>
          <p className="text-gray-500 font-medium">Buscando as melhores lojas...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-gray-300 bg-white shadow-sm">
          <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-900 font-bold mb-2">Nenhuma loja encontrada</p>
          <p className="text-gray-500">Tente buscar por outro nome ou termo.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden group">

              {/* BANNER DA LOJA */}
              <div className="relative h-48 sm:h-56 w-full bg-gray-900">
                {store.banner_url ? (
                  <img src={store.banner_url} alt="Banner" className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-700"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="pb-1 sm:pb-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{store.name}</h2>
                      {store.description && <p className="text-gray-200 text-sm line-clamp-1 max-w-md">{store.description}</p>}
                    </div>
                  </div>

                  <Link
                    href={`/stores/${store.id}`}
                    className="shrink-0 bg-white text-gray-900 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    Visitar Loja &rarr;
                  </Link>
                </div>
              </div>

              {/* LISTA DE PRODUTOS DA LOJA (MINI-GRID) */}
              <div className="p-6 sm:p-8 bg-gray-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {store.products.map((product) => {
                    const title = product.title || product.name || 'Produto sem nome';
                    const price = product.base_price || product.price || 0;
                    const image = product.image_url || product.image;

                    return (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <Link href={`/product/${product.id}`} className="block relative aspect-square bg-gray-100 overflow-hidden group/img">
                          {image ? (
                            <img src={image} alt={title} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-12 h-12" />
                            </div>
                          )}
                        </Link>

                        <div className="p-4 flex flex-col flex-1">
                          <Link href={`/product/${product.id}`} className="font-bold text-gray-900 line-clamp-2 hover:text-[#fa7109] transition-colors mb-2">
                            {title}
                          </Link>

                          <div className="mt-auto pt-2">
                            <p className="text-xl font-black text-[#fa7109] mb-4">{formatPrice(price)}</p>

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleAddToCart(title)}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 rounded-xl font-bold text-sm transition-colors"
                              >
                                <ShoppingCart className="w-4 h-4" /> Carrinho
                              </button>
                              <button
                                onClick={() => handleBuyNow(title)}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#fa7109] to-[#ab0029] hover:opacity-90 text-white py-2.5 rounded-xl font-bold text-sm transition-opacity shadow-sm"
                              >
                                <Zap className="w-4 h-4 fill-white" /> Comprar Agora
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* PAGINAÇÃO (< 1 2 3 ... n >) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${isActive
                          ? 'bg-[#fa7109] text-white border border-[#fa7109]'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}