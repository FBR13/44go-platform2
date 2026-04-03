'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardGatekeeper() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isChecking, setIsChecking] = useState(true);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function checkStore() {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('seller_id', user!.id)
        .single();

      if (data) {
        setStore(data); 
      }
      setIsChecking(false);
    }

    checkStore();
  }, [user, authLoading, router]);

  if (authLoading || isChecking) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa7109]"></div>
      </div>
    );
  }

  // ============================================================================
  // TELA 1: VISÃO DO CLIENTE COMUM (Ainda não é lojista)
  // ============================================================================
  if (!store) {
    return (
      // Menos padding no mobile (py-8 px-4) e mais no PC (sm:py-16)
      <div className="max-w-4xl mx-auto py-8 sm:py-16 px-4 text-center">
        {/* Bordas menores no mobile e padding ajustado */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-4 sm:mb-6">
            🏪
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Você ainda não tem uma loja
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto">
            Que tal começar a vender seus produtos para milhares de clientes na região da 44? A abertura da loja é rápida e gratuita.
          </p>
          {/* Botões empilhados e w-full no mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/dashboard/stores/new"
              className="w-full sm:w-auto bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-6 sm:px-8 py-3.5 rounded-full text-base sm:text-lg font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              Criar minha Loja agora
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto bg-white text-gray-900 border border-gray-300 px-6 sm:px-8 py-3.5 rounded-full text-base sm:text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Voltar para as compras
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TELA 2: VISÃO EXCLUSIVA DO LOJISTA (Já tem loja)
  // ============================================================================
  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho do Lojista */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Painel da Loja: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029] block sm:inline">{store.name}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Gerencie seus produtos, pedidos e configurações.</p>
        </div>
        {/* Botão Novo Produto w-full no mobile */}
        <Link
          href="/dashboard/products/new"
          className="w-full sm:w-auto justify-center bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-6 py-3 sm:py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Novo Produto
        </Link>
      </div>

      {/* Grid de Ferramentas Administrativas - 1 coluna no mobile, 3 no PC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Card: Produtos */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-[#fa7109]/30 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 text-[#fa7109] rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">📦</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Meus Produtos</h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 flex-grow">Adicione, edite preços ou pause anúncios do seu catálogo.</p>
          <Link href="/dashboard/products" className="text-[#fa7109] font-medium hover:underline text-sm inline-flex items-center gap-1">
            Gerenciar estoque <span>→</span>
          </Link>
        </div>

        {/* Card: Pedidos */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-[#ab0029]/30 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-[#ab0029] rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">🛍️</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Pedidos</h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 flex-grow">Acompanhe as vendas, aprove pagamentos e despache produtos.</p>
          <Link href="/dashboard/orders" className="text-[#ab0029] font-medium hover:underline text-sm inline-flex items-center gap-1">
            Ver vendas <span>→</span>
          </Link>
        </div>

        {/* Card: Configurações */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-gray-300 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">⚙️</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Perfil da Loja</h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 flex-grow">Altere sua logo, banner, descrição e informações de contato.</p>
          <Link href="/dashboard/settings" className="text-gray-700 font-medium hover:underline text-sm inline-flex items-center gap-1">
            Configurações <span>→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}