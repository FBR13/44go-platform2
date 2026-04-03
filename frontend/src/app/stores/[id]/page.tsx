'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

export default function StorePage() {
  const params = useParams();
  const storeId = params.id;

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    async function fetchStoreData() {
      try {
        // 1. Busca os dados reais da loja
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        // 2. Busca os produtos EXATOS desta loja
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true) // Garante que só mostra os que estão ativos
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);

      } catch (error) {
        console.error('Erro ao carregar a loja:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, [storeId]);

  // TELA DE CARREGAMENTO
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#fa7109]"></span>
        <p className="text-gray-500 font-medium">Montando a vitrine...</p>
      </div>
    );
  }

  // SE A LOJA NÃO EXISTIR NO BANCO
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
      <div className="relative h-56 sm:h-72 md:h-80 w-full bg-gray-900 overflow-hidden">
        {/* Imagem de Fundo real (se não tiver, fica só o fundo escuro) */}
        {store.banner_url ? (
          <>
            <img src={store.banner_url} alt={`Banner da loja ${store.name}`} className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
        )}
        
        {/* Logo e Nome da Loja */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 mt-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full p-1 shadow-2xl mb-4">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
              {store.logo_url ? (
                <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🏪</span>
              )}
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-center drop-shadow-lg tracking-tight">
            {store.name}
          </h1>
          {store.description && (
            <p className="mt-3 text-sm sm:text-base text-gray-200 max-w-xl text-center drop-shadow-md line-clamp-2">
              {store.description}
            </p>
          )}
        </div>
      </div>

      {/* VITRINE DE PRODUTOS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vitrine de Produtos</h2>
          <span className="text-sm font-medium text-gray-600 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
            {products.length} {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
          </span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={{
                  id: product.id,
                  // Puxa estritamente os dados reais do banco
                  title: product.title || product.name,
                  base_price: product.base_price || product.price,
                  // Removido o mock do Unsplash. Passa null/vazio se não tiver foto
                  image_url: product.image_url || product.image || '', 
                }} 
              />
            ))}
          </div>
        ) : (
          // Interface de loja vazia, sem inventar produto falso
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 sm:p-16 text-center shadow-sm">
            <span className="text-6xl mb-4 block">📦</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-500 max-w-md mx-auto">Esta loja ainda não adicionou produtos ou eles estão esgotados no momento.</p>
          </div>
        )}

      </div>
    </div>
  );
}