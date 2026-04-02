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
    // Se a autenticação ainda está carregando, não faz nada
    if (authLoading) return;

    // Se não tiver usuário logado, manda pro login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Verifica se este usuário já tem uma loja cadastrada
    async function checkStore() {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('seller_id', user!.id)
        .single();

      if (data) {
        setStore(data); // É um lojista!
      }
      setIsChecking(false);
    }

    checkStore();
  }, [user, authLoading, router]);

  // Tela de carregamento enquanto o sistema decide quem é o usuário
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
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            🏪
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Você ainda não tem uma loja
          </h1>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
            Que tal começar a vender seus produtos para milhares de clientes na região da 44? A abertura da loja é rápida e gratuita.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Esse botão levará para a tela de criar a loja que configuramos antes */}
            <Link
              href="/dashboard/stores/new"
              className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              Criar minha Loja agora
            </Link>
            <Link
              href="/"
              className="bg-white text-gray-900 border border-gray-300 px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors"
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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho do Lojista */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Painel da Loja: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">{store.name}</span>
          </h1>
          <p className="text-gray-500 mt-1">Gerencie seus produtos, pedidos e configurações.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/products/new"
            className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
          >
            <span>+</span> Novo Produto
          </Link>
        </div>
      </div>

      {/* Grid de Ferramentas Administrativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card: Produtos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="w-12 h-12 bg-orange-50 text-[#fa7109] rounded-xl flex items-center justify-center text-2xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Meus Produtos</h3>
          <p className="text-gray-500 text-sm mb-6 flex-grow">Adicione, edite preços ou pause anúncios do seu catálogo.</p>
          <Link href="/dashboard/products" className="text-[#fa7109] font-medium hover:underline text-sm">
            Gerenciar estoque →
          </Link>
        </div>

        {/* Card: Pedidos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="w-12 h-12 bg-red-50 text-[#ab0029] rounded-xl flex items-center justify-center text-2xl mb-4">🛍️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pedidos</h3>
          <p className="text-gray-500 text-sm mb-6 flex-grow">Acompanhe as vendas, aprove pagamentos e despache produtos.</p>
          <Link href="/dashboard/orders" className="text-[#ab0029] font-medium hover:underline text-sm">
            Ver vendas →
          </Link>
        </div>

        {/* Card: Configurações */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="w-12 h-12 bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center text-2xl mb-4">⚙️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Perfil da Loja</h3>
          <p className="text-gray-500 text-sm mb-6 flex-grow">Altere sua logo, banner, descrição e informações de contato.</p>
          <Link href="/dashboard/settings" className="text-gray-700 font-medium hover:underline text-sm">
            Configurações →
          </Link>
        </div>

      </div>
    </div>
  );
}