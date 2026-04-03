'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner'; // <-- Importando nossas notificações!

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [storeName, setStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);

  // 1. Verifica se o usuário JÁ TEM uma loja cadastrada
  useEffect(() => {
    if (!user) return;
    
    async function checkStore() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('seller_id', user!.id)
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
    
    if (!user) return;

    // Log para você ter CERTEZA de que o frontend está mandando o ID
    console.log("Enviando para o backend. Meu ID é:", user.id);

    setIsCreating(true);

    try {
      const response = await fetch(apiUrl('/stores'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: storeName,
          seller_id: user.id, // O NestJS precisa ler exatamente esse nome!
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao criar loja no servidor.');
      }

      const newStore = await response.json();
      setStore(newStore); 
      toast.success('Loja criada com sucesso! Bem-vindo ao painel.'); // <-- Toast de Sucesso!
      
    } catch (err: any) {
      console.error("Erro ao criar:", err);
      // <-- Toast de Erro com o visual padrão da sua marca!
      toast.error(err.message || 'Não foi possível conectar ao servidor.'); 
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
              className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 -mt-4 sm:-mt-8">
      <div className="bg-white p-8 max-w-md w-full rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-orange-100">
            🏪
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Abra sua Loja Virtual</h1>
          <p className="text-gray-500 text-sm mt-2">Dê um nome para o seu negócio no 44Go e comece a vender em minutos.</p>
        </div>
        
        <form onSubmit={handleCreateStore} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
            <input 
              type="text" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] focus:outline-none transition-shadow text-gray-900 font-medium"
              placeholder="Ex: Confecções Silva"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isCreating || !storeName.trim()}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Criando sua loja...
              </>
            ) : (
              'Criar minha Loja'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}