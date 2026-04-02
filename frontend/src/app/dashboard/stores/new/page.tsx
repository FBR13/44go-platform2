'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { apiUrl } from '@/lib/api'; // <-- IMPORTAÇÃO DA SUA FUNÇÃO AQUI

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [storeName, setStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);
  const [error, setError] = useState('');

  // 1. Verifica se o usuário JÁ TEM uma loja cadastrada
  useEffect(() => {
    if (!user) return;
    
    async function checkStore() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('seller_id', user!.id) // Correção de segurança: user.id
          .maybeSingle(); 
          
        if (data) {
          setStore(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingStore(false);
      }
    }
    
    checkStore();
  }, [user]);

  // Se não estiver logado, manda pro login
  if (!loading && !user) {
    router.push('/auth/login');
    return null;
  }

  if (loading || checkingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></div>
      </div>
    );
  }

  // 2. Função blindada para Criar a Loja no Backend
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // A BARREIRA QUE ACALMA O TYPESCRIPT:
    if (!user) return;

    setIsCreating(true);
    setError('');

    try {
      // Sai o localhost, entra a apiUrl!
      const response = await fetch(apiUrl('/stores'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: storeName,
          seller_id: user.id, // <-- Sem o ponto de interrogação agora!
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao criar loja no backend.');
      }

      const newStore = await response.json();
      setStore(newStore); // Loja criada com sucesso, o painel vai aparecer!
      
    } catch (err: any) {
      console.error("Erro ao criar:", err);
      setError(err.message || 'Erro de conexão com o Backend.');
    } finally {
      setIsCreating(false);
    }
  };

  // 3. TELA A: Se ele JÁ TEM loja, mostra o painel real
  if (store) {
    return (
       <div className="p-6 max-w-6xl mx-auto min-h-screen">
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Loja: {store.name}</h1>
              <p className="text-gray-500 mt-1">Gerencie seus produtos e vendas por aqui.</p>
            </div>
            <Link 
              href="/dashboard/products/new" 
              className="bg-[#fa7109] text-white px-6 py-3 rounded-md font-medium hover:bg-[#e06507] transition-colors"
            >
              + Novo Produto
            </Link>
         </div>
         {/* Futuramente aqui vai a lista de produtos da loja */}
       </div>
    )
  }

  // 4. TELA B: Se ele NÃO TEM loja, mostra o formulário de criar
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 max-w-md w-full rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Abra sua Loja Virtual</h1>
          <p className="text-gray-500 text-sm mt-2">Dê um nome para o seu negócio na 44Go e comece a vender em minutos.</p>
        </div>
        
        <form onSubmit={handleCreateStore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
            <input 
              type="text" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
              placeholder="Ex: Confecções Silva"
              required
            />
          </div>
          
          {/* O espião de erros visual */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCreating ? 'Criando sua loja...' : 'Criar minha Loja'}
          </button>
        </form>
      </div>
    </div>
  );
}