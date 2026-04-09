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
  Box,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingDown,
  X,
  Check
} from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

const CATEGORY_FILTER_OPTIONS = [
  { label: 'Todas as Categorias', value: 'all' },
  { label: 'Feminino', value: 'Feminino' },
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Infantil', value: 'Infantil' },
  { label: 'Acessórios', value: 'Acessórios' },
  { label: 'Calçados', value: 'Calçados' },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // --- ESTADOS PARA O MODAL DE EXCLUSÃO ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Abre o modal em vez de usar o confirm() do navegador
  const openDeleteModal = (product: any) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Função que realmente deleta o produto
  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productToDelete.id));
      toast.success('Produto removido com sucesso!');
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir o produto.');
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = products.filter(p => p.is_active).length;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">

      {/* ========================================================
          MODAL DE CONFIRMAÇÃO PERSONALIZADO (Z-INDEX ALTO)
          ======================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay com desfoque */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />

          {/* Card do Modal */}
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
                <Trash2 size={40} />
              </div>

              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Excluir Produto?</h2>
              <p className="text-gray-500 font-medium mb-8">
                Você está prestes a remover <span className="text-gray-900 font-bold">"{productToDelete?.title}"</span>. Esta ação não pode ser desfeita.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Sim, Excluir</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DINÂMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Meus Produtos</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              <Box size={14} /> **{products.length}** no total
            </p>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <p className="text-green-600 text-sm font-bold flex items-center gap-1.5">
              <Eye size={14} /> **{activeCount}** online
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#fa7109]/10 focus:border-[#fa7109] outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="w-full sm:w-56">
            <CustomDropdown
              options={CATEGORY_FILTER_OPTIONS}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Filtrar Categoria"
            />
          </div>

          <Link
            href="/dashboard/products/new"
            className="w-full sm:w-auto bg-gray-900 hover:bg-[#fa7109] text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Novo
          </Link>
        </div>
      </div>

      {/* GRID DE CARDS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#fa7109]"></span>
          <p className="text-gray-400 font-bold animate-pulse tracking-widest uppercase text-xs">Sincronizando Vitrine...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] py-24 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Package size={40} strokeWidth={1} />
          </div>
          <p className="text-gray-900 font-black text-xl">Nada por aqui ainda</p>
          <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">Tente ajustar seus filtros ou cadastre um novo produto.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const hasDiscount = product.sale_price && product.sale_price < product.base_price;
            const isLowStock = product.stock_quantity <= 5;
            const isOutOfStock = product.stock_quantity === 0;

            return (
              <div
                key={product.id}
                className={`group bg-white border border-gray-100 rounded-3xl p-5 flex flex-col lg:flex-row items-center gap-6 transition-all hover:shadow-2xl hover:border-orange-100 ${!product.is_active && 'bg-gray-50/50'}`}
              >
                {/* IMAGEM */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-inner">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={32} /></div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Pausado</div>
                  )}
                </div>

                {/* INFO PRINCIPAL */}
                <div className="flex-1 min-w-0 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-1">
                    <h3 className="font-black text-gray-900 truncate text-xl tracking-tight group-hover:text-[#fa7109] transition-colors">{product.title}</h3>
                    {product.category && (
                      <span className="inline-block px-3 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-full w-fit mx-auto lg:mx-0">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-gray-400'}`}>
                      {isOutOfStock ? <TrendingDown size={14} /> : isLowStock ? <AlertTriangle size={14} /> : <Box size={14} />}
                      Estoque: {product.stock_quantity || 0}
                      {isLowStock && !isOutOfStock && <span className="text-[10px] uppercase ml-1 opacity-70">(Baixo)</span>}
                    </div>
                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full hidden sm:block" />
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {product.is_active ? 'Ativo' : 'Oculto'}
                    </span>
                  </div>
                </div>

                {/* PRECIFICAÇÃO */}
                <div className="text-center lg:text-right shrink-0 px-8 border-y lg:border-y-0 lg:border-x border-gray-50 py-4 lg:py-0">
                  {hasDiscount ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(product.base_price)}</span>
                      <span className="text-[#fa7109] font-black text-2xl tracking-tighter">{formatPrice(product.sale_price)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-900 font-black text-2xl tracking-tighter">{formatPrice(product.base_price)}</span>
                  )}
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleStatus(product)}
                    className={`p-3.5 rounded-2xl transition-all active:scale-90 ${product.is_active ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    {product.is_active ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>

                  <Link
                    href={`/dashboard/products/${product.id}/edit`}
                    className="p-3.5 bg-orange-50 text-[#fa7109] hover:bg-[#fa7109] hover:text-white rounded-2xl transition-all active:scale-90"
                  >
                    <Edit3 size={22} />
                  </Link>

                  <button
                    onClick={() => openDeleteModal(product)} // AQUI CHAMA O MODAL NOVO
                    className="p-3.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-16 pt-8 border-t border-gray-100">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 text-sm font-black text-gray-400 hover:text-[#fa7109] transition-all group"
        >
          <div className="p-2.5 rounded-2xl bg-gray-50 group-hover:bg-orange-50 transition-colors"><ArrowLeft size={18} /></div>
          Voltar ao Painel Principal
        </Link>
      </div>
    </div>
  );
}