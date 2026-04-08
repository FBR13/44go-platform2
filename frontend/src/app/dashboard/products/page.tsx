'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Package,
  Edit3,
  Trash2,
  Plus,
  Search,
  Tag,
  Box,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', user.id)
        .single();

      if (store) {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Não foi possível carregar seus produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleDelete = async (productId: string) => {
    const confirmDelete = window.confirm('Deseja excluir este produto permanentemente?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      toast.success('Produto removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir o produto.');
    }
  };

  const toggleStatus = async (product: any) => {
    try {
      const newStatus = !product.is_active;
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
      toast.success(newStatus ? 'Produto ativado!' : 'Produto pausado.');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">

      {/* HEADER DINÂMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meus Produtos</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Box size={16} /> {products.length} produtos cadastrados no total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all text-sm"
            />
          </div>
          <Link
            href="/dashboard/products/new"
            className="bg-gray-900 hover:bg-[#fa7109] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-gray-200 flex items-center gap-2 shrink-0"
          >
            <Plus size={20} strokeWidth={3} /> <span className="hidden sm:inline">Novo</span>
          </Link>
        </div>
      </div>

      {/* GRID DE CARDS (Substituindo a tabela por algo mais moderno) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span>
          <p className="text-gray-400 font-medium">Sincronizando estoque...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Package size={32} />
          </div>
          <p className="text-gray-500 font-bold text-lg">Nenhum produto encontrado</p>
          <p className="text-gray-400 text-sm">Adicione um novo produto ou mude sua busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => {
            const hasDiscount = product.sale_price && product.sale_price < product.base_price;

            return (
              <div
                key={product.id}
                className={`bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 transition-all hover:shadow-md ${!product.is_active && 'opacity-60'}`}
              >
                {/* IMAGEM */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} /></div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-black uppercase">Pausado</div>
                  )}
                </div>

                {/* INFO PRINCIPAL */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="font-bold text-gray-900 truncate text-lg mb-1">{product.title}</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Box size={12} /> Estoque: {product.stock_quantity || 0}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? 'Visível na Loja' : 'Oculto'}
                    </span>
                  </div>
                </div>

                {/* PRECIFICAÇÃO DINÂMICA */}
                <div className="text-center sm:text-right shrink-0 px-4 border-l border-r border-gray-50">
                  {hasDiscount ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.base_price)}</span>
                      <span className="text-[#fa7109] font-black text-xl">{formatPrice(product.sale_price)}</span>
                      <span className="text-green-600 text-[10px] font-bold">Oferta Ativa</span>
                    </div>
                  ) : (
                    <span className="text-gray-900 font-black text-xl">{formatPrice(product.base_price)}</span>
                  )}
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(product)}
                    className={`p-2.5 rounded-xl transition-colors ${product.is_active ? 'text-gray-400 hover:bg-gray-100' : 'text-blue-500 bg-blue-50 hover:bg-blue-100'}`}
                    title={product.is_active ? "Pausar Produto" : "Ativar Produto"}
                  >
                    {product.is_active ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>

                  <Link
                    href={`/dashboard/products/${product.id}/edit`}
                    className="p-2.5 bg-orange-50 text-[#fa7109] hover:bg-[#fa7109] hover:text-white rounded-xl transition-all"
                    title="Editar Informações"
                  >
                    <Edit3 size={20} />
                  </Link>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-12 pt-6 border-t border-gray-100">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#fa7109] transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-orange-50"><ArrowLeft size={16} /></div>
          Voltar ao Painel Principal
        </Link>
      </div>
    </div>
  );
}