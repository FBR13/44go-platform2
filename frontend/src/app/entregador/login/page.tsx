'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bike, Mail, Lock, ArrowRight } from 'lucide-react';

export default function CourierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Faz o login no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error('E-mail ou senha incorretos.');
      if (!authData.user) throw new Error('Erro ao autenticar usuário.');

      // 2. Verifica se o usuário realmente é um entregador cadastrado na tabela 'couriers'
      const { data: courierData, error: courierError } = await supabase
        .from('couriers')
        .select('is_approved')
        .eq('id', authData.user.id)
        .single();

      if (courierError || !courierData) {
        await supabase.auth.signOut(); // Desloga imediatamente
        throw new Error('Conta de entregador não encontrada. Faça seu cadastro!');
      }

      // Se quiser bloquear quem ainda não foi aprovado pela plataforma:
      // if (!courierData.is_approved) throw new Error('Sua conta ainda está em análise.');

      toast.success('Login realizado com sucesso! Acelerando...');
      router.push('/entregador/dashboard');

    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao tentar entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#fa7109] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-1/4 -translate-y-1/4">
            <Bike className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3 rounded-full mb-4 shadow-lg">
              <Bike className="w-8 h-8 text-[#fa7109]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Portal do Entregador</h2>
            <p className="text-orange-100 text-sm">Acesse para começar a receber corridas.</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-black py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span>
              ) : (
                <>Entrar na Conta <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Ainda não é parceiro da 44Go?{' '}
              <Link href="/entregador/register" className="font-bold text-[#fa7109] hover:underline">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}