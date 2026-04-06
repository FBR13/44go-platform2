'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Package, ShoppingBag, Settings, Plus, ArrowRight } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto py-8 sm:py-16 px-4 text-center">
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
  // TELA 2: VISÃO EXCLUSIVA DO LOJISTA (Já tem loja) - COM O DESIGN PREMIUM! ✨
  // ============================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      
      {/* CABEÇALHO DO PAINEL (Hero Section) */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 sm:p-10 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        {/* Efeito de luz sutil de fundo */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-orange-50 to-red-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Painel da Loja:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">
              {store.name}
            </span>
          </h1>
          <p className="text-gray-500 text-lg">Gerencie seus produtos, pedidos e configurações.</p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-4 rounded-2xl font-bold hover:scale-[1.03] hover:shadow-xl hover:shadow-orange-500/20 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-6 h-6" />
          Novo Produto
        </Link>
      </div>

      {/* GRID DE CARDS NAVEGÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">

        {/* Card 1: Produtos */}
        <Link 
          href="/dashboard/products" 
          className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 p-8 flex flex-col relative overflow-hidden"
        >
          <div className="w-16 h-16 bg-orange-50 text-[#fa7109] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Meus Produtos</h2>
          <p className="text-gray-500 mb-8 flex-1 leading-relaxed">
            Adicione, edite preços ou pause anúncios do seu catálogo.
          </p>
          <div className="flex items-center text-[#fa7109] font-bold gap-2 group-hover:translate-x-2 transition-transform duration-300">
            Gerenciar estoque <ArrowRight className="w-5 h-5" />
          </div>
        </Link>

        {/* Card 2: Pedidos */}
        <Link 
          href="/dashboard/orders" 
          className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 p-8 flex flex-col relative overflow-hidden"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Pedidos</h2>
          <p className="text-gray-500 mb-8 flex-1 leading-relaxed">
            Acompanhe as vendas, aprove pagamentos e despache produtos.
          </p>
          <div className="flex items-center text-blue-600 font-bold gap-2 group-hover:translate-x-2 transition-transform duration-300">
            Ver vendas <ArrowRight className="w-5 h-5" />
          </div>
        </Link>

        {/* Card 3: Configurações */}
        <Link 
          href="/dashboard/settings" 
          className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 p-8 flex flex-col relative overflow-hidden"
        >
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Perfil da Loja</h2>
          <p className="text-gray-500 mb-8 flex-1 leading-relaxed">
            Altere sua logo, banner, descrição e informações de contato.
          </p>
          <div className="flex items-center text-purple-600 font-bold gap-2 group-hover:translate-x-2 transition-transform duration-300">
            Configurações <ArrowRight className="w-5 h-5" />
          </div>
        </Link>

      </div>
    </div>
  );
}