'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState('1');

  useEffect(() => {
    async function loadProducts() {
      if (!user) return;

      try {
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
          if (productsData) setProducts(productsData);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [user]);

  // Função para excluir produto
  const handleDelete = async (productId: string) => {
    // Pede confirmação antes de apagar
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita.');

    if (!confirmDelete) return;

    try {
      // Deleta direto pelo Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Remove o produto da tela sem precisar recarregar a página
      setProducts(products.filter((product) => product.id !== productId));
      alert('Produto excluído com sucesso!');

    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir o produto. Tente novamente.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">

      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Meus Produtos</h1>
        <Link
          href="/dashboard/products/new"
          className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Novo Produto
        </Link>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Preço Base</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    <div className="flex justify-center items-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#fa7109]"></span>
                      Carregando produtos...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-gray-500 font-medium mb-1">Nenhum produto cadastrado.</p>
                    <p className="text-sm text-gray-400">Clique no botão acima para adicionar o seu primeiro produto.</p>
                  </td>
                </tr>
              )}

              {!loading && products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">

                  {/* Imagem + Nome */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {product.title}
                      </div>
                    </div>
                  </td>

                  {/* Preço */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(product.base_price)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {product.is_active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">

                      {/* O link de editar vai redirecionar para a página de edição passando o ID */}
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="text-[#fa7109] hover:text-[#ab0029] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Editar
                      </Link>

                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#fa7109] transition-colors flex items-center gap-1 w-fit">
          &larr; Voltar ao painel principal
        </Link>
      </div>
    </div>
  );
}