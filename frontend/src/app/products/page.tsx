'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { apiUrl } from '@/lib/api';

// 1. Tipagem ajustada para refletir possíveis valores ausentes da API
type Product = {
  id: string;
  store_id: string;
  name?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  category?: string | null;
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 400);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
      if (category) params.set('category', category);
      const qs = params.toString();
      const url = `${apiUrl('/products')}${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Não foi possível carregar os produtos.');
      }
      
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao carregar os produtos.',
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, category]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(apiUrl('/products/categories'));
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch {
        /* categorias opcionais */
      }
    })();
  }, []);

  // 2. Função de formatação blindada contra NaN
  const formatPrice = (n?: number | string | null) => {
    if (n === null || n === undefined) return 'Preço indisponível';
    
    const num = Number(n);
    if (isNaN(num)) return 'Preço indisponível';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Produtos
        </h1>
        <p className="mt-2 text-gray-600">
          Explore o catálogo das lojas parceiras do 44Go.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label htmlFor="search-products" className="sr-only">
            Buscar
          </label>
          <input
            id="search-products"
            type="search"
            placeholder="Buscar por nome..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none transition"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="filter-category" className="sr-only">
            Categoria
          </label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none transition"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700 font-medium">Nenhum produto encontrado</p>
          <p className="text-sm text-gray-500 mt-1">
            Tente outro termo de busca ou categoria.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <li key={p.id}>
              <article className="group h-full flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name || 'Imagem do produto'}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Package className="w-16 h-16 opacity-40" strokeWidth={1.25} />
                    </div>
                  )}
                  {p.category && (
                    <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-white/90 text-gray-700 shadow-sm">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  {/* 3. Fallback aplicado ao nome do produto */}
                  <h2 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                    {p.name || 'Produto sem título'}
                  </h2>
                  <p className="mt-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">
                    {formatPrice(p.price)}
                  </p>
                  {p.store_id && (
                    <Link
                      href={`/store/${p.store_id}`}
                      className="mt-2 inline-block text-xs font-medium text-gray-500 hover:text-[#fa7109] transition-colors"
                    >
                      Ver loja →
                    </Link>
                  )}
                  <div className="mt-auto pt-4">
                    <Link
                      href={`/product/${p.id}`}
                      className="block w-full text-center py-2.5 rounded-lg bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-sm font-medium hover:opacity-95 transition-opacity"
                    >
                      Ver produto
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}