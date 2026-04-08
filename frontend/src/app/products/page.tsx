'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Package, Search, Store, ShoppingCart, Zap, ChevronLeft, ChevronRight, X, Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';

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
  const router = useRouter();
  const { addItem, lines, subtotal, removeItem, updateQuantity } = useCart();

  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 👇 NOVO: Avisa o resto do site (o Chat) se a gaveta está aberta ou não
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-cart-sidebar', { detail: isCartOpen }));

    // O TypeScript exige que essa função de retorno não devolva nada (void)
    return () => {
      window.dispatchEvent(new CustomEvent('toggle-cart-sidebar', { detail: false }));
    };
  }, [isCartOpen]);

  useEffect(() => {
    async function fetchStoresAndProducts() {
      setLoading(true);
      try {
        const from = (currentPage - 1) * STORES_PER_PAGE;
        const to = from + STORES_PER_PAGE - 1;

        let query = supabase.from('stores').select('*', { count: 'exact' });

        if (searchQuery.trim()) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data: storesData, count, error: storesError } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (storesError) throw storesError;

        if (count) setTotalPages(Math.ceil(count / STORES_PER_PAGE));

        if (!storesData || storesData.length === 0) {
          setStores([]);
          setLoading(false);
          return;
        }

        const storeIds = storesData.map(s => s.id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('store_id', storeIds)
          .eq('is_active', true);

        if (productsError) throw productsError;

        const formattedStores: StoreData[] = storesData.map(store => {
          const storeProducts = (productsData || [])
            .filter(p => p.store_id === store.id)
            .slice(0, 4);

          return { ...store, products: storeProducts };
        });

        setStores(formattedStores.filter(s => s.products.length > 0));

      } catch (error) {
        console.error('Erro ao buscar marketplace:', error);
        toast.error('Erro ao carregar as lojas.');
      } finally {
        setLoading(false);
      }
    }

    const timeoutId = setTimeout(() => fetchStoresAndProducts(), 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery]);

  const formatPrice = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  const handleAddToCart = (product: Product) => {
    const price = product.base_price || product.price || 0;
    const title = product.title || product.name || 'Produto';
    const image = product.image_url || product.image || null;

    addItem({
      productId: product.id,
      name: title,
      price: price,
      image_url: image,
      size: null,
      quantity: 1
    });

    toast.success(`${title} adicionado à sacola! 🛍️`);
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    router.push('/cart');
  };

  return (
    <div className="relative min-h-screen">

      {/* MINI CART (GAVETA LATERAL) */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-[60] w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#fa7109]" />
            Sua Sacola
            <span className="bg-orange-100 text-[#fa7109] text-xs py-0.5 px-2 rounded-full font-bold ml-1">
              {lines.length}
            </span>
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium">Sua sacola está vazia.<br />Que tal adicionar algo?</p>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.key} className="flex gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  {line.image_url ? (
                    <img src={line.image_url} alt={line.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-full h-full p-4 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{line.name}</h4>
                    <p className="text-[#fa7109] font-black text-sm mt-1">{formatPrice(line.price * line.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        className="p-1 hover:bg-gray-200 text-gray-600 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-900">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        className="p-1 hover:bg-gray-200 text-gray-600 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(line.key)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-2xl font-black text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <Link
              href="/cart"
              className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Finalizar Compra
            </Link>
          </div>
        )}
      </div>

      {/* RESTANTE DA PÁGINA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar lojas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-[#fa7109] hover:border-[#fa7109] transition-all shadow-sm shrink-0"
            >
              <ShoppingCart className="w-6 h-6" />
              {lines.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                  {lines.length}
                </span>
              )}
            </button>
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
                                  onClick={() => handleAddToCart(product)}
                                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 rounded-xl font-bold text-sm transition-colors"
                                >
                                  <ShoppingCart className="w-4 h-4" /> Adicionar
                                </button>
                                <button
                                  onClick={() => handleBuyNow(product)}
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
    </div>
  );
}