'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Package, Search, Store, ShoppingCart, ArrowRight, MapPin, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useDeliveryMode } from '@/context/DeliveryModeContext';
import { DeliveryModeToggle } from '@/components/DeliveryModeToggle';

const STORES_PER_PAGE = 5;

type Product = {
  id: string;
  title: string;
  name?: string;
  base_price: number;
  sale_price?: number;
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
  rating?: number;
  distance_km?: number; // Novo: Recebido do Backend
  eta_range?: string;   // Novo: Recebido do Backend
};

export default function MarketplacePage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { mode, location, setModeFallback } = useDeliveryMode();

  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchStoresAndProducts() {
      setLoading(true);
      try {
        let formattedStores: StoreData[] = [];

        // ====================================================================
        // FLUXO 1: MODO ENTREGA RÁPIDA (Chama o NestJS com GPS)
        // ====================================================================
        if (mode === 'FAST_DELIVERY' && location) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
          
          const response = await fetch(`${API_URL}/stores/fast-delivery?lat=${location.lat}&lng=${location.lng}`);
          
          if (!response.ok) throw new Error('Erro na API de Entrega Rápida');
          
          const result = await response.json();

          // Graceful Fallback: NestJS avisou que não tem loja perto
          if (!result.eligible) {
            toast.info(result.message || 'Nenhuma loja perto. Voltando ao modo Shopping.');
            setModeFallback();
            return; // Sai do useEffect, a mudança de modo vai trigar ele de novo
          }

          // Se tem loja perto, pegamos os IDs e buscamos os produtos no Supabase
          // (Isso será totalmente centralizado no Backend na etapa de Unificação Arquitetural)
          const storeIds = result.stores.map((s: any) => s.id);
          
          if (storeIds.length > 0) {
            let productsQuery = supabase.from('products').select('*').in('store_id', storeIds).eq('is_active', true);
            if (searchQuery.trim()) productsQuery = productsQuery.ilike('title', `%${searchQuery}%`);
            
            const { data: productsData } = await productsQuery;

            formattedStores = result.stores.map((store: any) => {
              const storeProducts = (productsData || []).filter(p => p.store_id === store.id).slice(0, 4);
              return { ...store, products: storeProducts, rating: 4.8 };
            });
          }
        } 
        
        // ====================================================================
        // FLUXO 2: MODO MARKETPLACE NORMAL (Lê o Brasil/Mundo inteiro)
        // ====================================================================
        else {
          const from = (currentPage - 1) * STORES_PER_PAGE;
          const to = from + STORES_PER_PAGE - 1;

          let query = supabase.from('stores').select('*', { count: 'exact' });
          if (searchQuery.trim()) query = query.ilike('name', `%${searchQuery}%`);

          const { data: storesData, count, error: storesError } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

          if (storesError) throw storesError;
          if (count) setTotalPages(Math.ceil(count / STORES_PER_PAGE));

          if (storesData && storesData.length > 0) {
            const storeIds = storesData.map(s => s.id);
            const { data: productsData } = await supabase
              .from('products').select('*').in('store_id', storeIds).eq('is_active', true);

            formattedStores = storesData.map(store => {
              const storeProducts = (productsData || []).filter(p => p.store_id === store.id).slice(0, 4);
              return { ...store, products: storeProducts, rating: 4.8 };
            });
          }
        }

        // Filtra lojas que não tem produtos
        setStores(formattedStores.filter(s => s.products.length > 0));

      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar vitrines.');
      } finally {
        setLoading(false);
      }
    }

    const timeoutId = setTimeout(() => fetchStoresAndProducts(), 400);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery, mode, location]);

  const formatPrice = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

  const handleAddToCart = (product: Product) => {
    const finalPrice = product.sale_price || product.base_price || product.price || 0;
    addItem({
      productId: product.id,
      name: product.title || product.name || 'Produto',
      price: finalPrice,
      image_url: product.image_url || product.image || null,
      size: null,
      quantity: 1
    });
    toast.success(`Adicionado! 🛍️`);
    window.dispatchEvent(new CustomEvent('toggle-cart-sidebar', { detail: true }));
  };

  return (
    <div className="relative min-h-screen bg-gray-50/50 -mt-8 pb-20 overflow-x-hidden">
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        
        {/* HEADER LIMPO COM TOGGLE */}
        <div className="mb-12 sm:mb-20 flex flex-col items-center text-center gap-8">
          <div>
            <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-4">
              Vitrines <span className="text-[#fa7109]">Locais</span>
            </h1>
            <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
              As melhores lojas da região em um só lugar.
            </p>
          </div>

          {/* 👇 O NOSSO NOVO SWITCH DE MODO 👇 */}
          <DeliveryModeToggle />

          <div className="relative w-full lg:w-[500px] group mt-4">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#fa7109] transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Qual loja você procura?"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-4 focus:ring-[#fa7109]/10 focus:border-[#fa7109] outline-none transition-all shadow-sm font-bold"
            />
          </div>
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <span className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#fa7109] border-b-4 border-transparent"></span>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium">Nenhuma loja encontrada.</div>
        ) : (
          <div className="space-y-32">
            {stores.map((store) => (
              <div key={store.id} className="flex flex-col group">
                
                {/* 1. BANNER DA LOJA */}
                <div className="relative h-64 sm:h-[350px] w-full bg-gray-900 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl mb-12">
                  {store.banner_url ? (
                    <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-60 transition-transform duration-[3s] group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"></div>

                  {/* 👇 SELO DE ENTREGA RÁPIDA (Exclusivo do Modo Fast Delivery) 👇 */}
                  {mode === 'FAST_DELIVERY' && store.eta_range && (
                    <div className="absolute top-6 right-6 bg-white text-gray-900 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 shadow-xl animate-in zoom-in">
                      <Clock className="w-4 h-4 text-[#fa7109]" />
                      {store.eta_range} • {store.distance_km}km
                    </div>
                  )}

                  <div className="absolute inset-0 p-6 sm:p-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="flex items-center gap-6 sm:gap-10">
                      <div className="w-24 h-24 sm:w-40 sm:h-40 aspect-square bg-white p-2 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl shrink-0 -rotate-2 group-hover:rotate-0 transition-all duration-500">
                        <div className="w-full h-full rounded-[1rem] sm:rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                          {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300" />}
                        </div>
                      </div>
                      
                      <div className="text-white">
                        <div className="flex items-center gap-4 mb-2">
                          <h2 className="text-3xl sm:text-6xl font-black tracking-tighter leading-none drop-shadow-2xl">{store.name}</h2>
                          <div className="bg-white/20 backdrop-blur-xl px-3 py-1 rounded-xl text-white text-sm font-black border border-white/20 flex items-center gap-1.5">
                             <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {store.rating?.toFixed(1)}
                          </div>
                        </div>
                        {store.description && <p className="text-gray-200 text-sm sm:text-xl font-medium line-clamp-1 opacity-90 max-w-2xl">{store.description}</p>}
                      </div>
                    </div>

                    <Link href={`/stores/${store.id}`} className="shrink-0 bg-white text-gray-900 hover:bg-[#fa7109] hover:text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 uppercase tracking-tighter text-sm shadow-xl active:scale-95">
                      Ver Catálogo <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* 2. VITRINE DE PRODUTOS */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10">
                  {store.products.map((product) => {
                    const hasDiscount = product.sale_price && product.sale_price < product.base_price;
                    return (
                      <div key={product.id} className="bg-white border border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col group/card transition-all duration-500 shadow-sm hover:-translate-y-3 hover:shadow-xl">
                        <Link href={`/product/${product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
                          {product.image_url || product.image ? (
                            <img src={product.image_url || product.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <Package className="w-10 h-10 sm:w-16 sm:h-16" />
                            </div>
                          )}
                          {hasDiscount && (
                             <div className="absolute top-3 left-3 sm:top-5 sm:left-5 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-[9px] sm:text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                                Promoção
                             </div>
                          )}
                        </Link>

                        <div className="p-5 sm:p-8 flex flex-col flex-1">
                          <Link href={`/product/${product.id}`} className="font-black text-gray-900 text-sm sm:text-xl line-clamp-2 group-hover/card:text-[#fa7109] transition-colors mb-3 tracking-tight leading-tight min-h-[2.5rem] sm:min-h-[3.5rem]">
                            {product.title || product.name}
                          </Link>
                          
                          <div className="mt-auto">
                            {hasDiscount ? (
                              <div className="flex flex-col mb-4">
                                <span className="text-[10px] sm:text-sm text-gray-400 line-through font-bold opacity-60 leading-none mb-1">{formatPrice(product.base_price)}</span>
                                <p className="text-xl sm:text-3xl font-black text-[#fa7109] tracking-tighter leading-none">{formatPrice(product.sale_price!)}</p>
                              </div>
                            ) : (
                              <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter leading-none mb-4">{formatPrice(product.base_price || product.price || 0)}</p>
                            )}
                            
                            <button onClick={() => handleAddToCart(product)} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 sm:py-5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-[#fa7109] transition-all active:scale-95 group/btn">
                               <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:rotate-12" /> Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}