'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Wallet, DollarSign, ArrowDownToLine, History, MapPin, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CourierWalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [wallet, setWallet] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/entregador/login');
      return;
    }

    async function fetchData() {
      try {
        // 1. Busca a carteira
        const { data: walletData } = await supabase
          .from('courier_wallets')
          .select('*')
          .eq('courier_id', user!.id)
          .single();
        
        setWallet(walletData || { available_balance: 0, total_earned: 0 });

        // 2. Busca o histórico de entregas finalizadas
        const { data: historyData } = await supabase
          .from('deliveries')
          .select('*, orders(stores(name))')
          .eq('courier_id', user!.id)
          .eq('status', 'delivered')
          .order('delivered_at', { ascending: false });

        if (historyData) setHistory(historyData);

      } catch (error) {
        console.error('Erro ao buscar dados financeiros', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, router]);

  const handleWithdraw = async () => {
    if (!wallet || wallet.available_balance <= 0) {
      toast.error('Você não tem saldo disponível para saque.');
      return;
    }

    setIsRequestingWithdraw(true);
    // Como é um MVP, vamos apenas simular o saque e zerar a carteira localmente
    setTimeout(async () => {
      try {
        // Zera o saldo disponível no banco
        await supabase
          .from('courier_wallets')
          .update({ available_balance: 0 })
          .eq('courier_id', user!.id);
        
        setWallet({ ...wallet, available_balance: 0 });
        toast.success('Saque solicitado com sucesso! O dinheiro cairá na sua conta em breve. 💸');
      } catch (error) {
        toast.error('Erro ao solicitar saque.');
      } finally {
        setIsRequestingWithdraw(false);
      }
    }, 1500);
  };

  if (isLoading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* NAVEGAÇÃO */}
        <Link href="/entregador/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#fa7109] font-bold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar ao Painel
        </Link>

        {/* CARDS FINANCEIROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Saldo Disponível */}
          <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <Wallet className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Saldo Disponível</p>
              <h2 className="text-4xl sm:text-5xl font-black mb-6">{formatPrice(wallet?.available_balance)}</h2>
              
              <button
                onClick={handleWithdraw}
                disabled={isRequestingWithdraw || !wallet || wallet.available_balance <= 0}
                className="w-full bg-[#fa7109] hover:bg-[#e66607] disabled:bg-gray-700 disabled:text-gray-400 text-white font-black py-4 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {isRequestingWithdraw ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span>
                ) : (
                  <>
                    <ArrowDownToLine className="w-5 h-5" /> Solicitar Saque
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ganhos Totais */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="w-8 h-8 text-green-700" />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Faturado</p>
                <h3 className="text-2xl font-black text-gray-900">{formatPrice(wallet?.total_earned)}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Esse é o total de grana que você já fez rodando com a 44Go desde o seu primeiro dia.
            </p>
          </div>
        </div>

        {/* HISTÓRICO DE CORRIDAS */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <History className="w-5 h-5 text-[#fa7109]" />
            <h2 className="font-bold text-gray-900 text-lg">Histórico de Corridas</h2>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhuma corrida ainda</h3>
              <p className="text-gray-500">Volte para o radar e faça sua primeira entrega!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((delivery) => (
                <li key={delivery.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-50 p-3 rounded-full shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-lg">{delivery.orders?.stores?.name || 'Loja Parceira'}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(delivery.delivered_at).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Goiânia, GO</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Ganho</p>
                    <p className="text-xl font-black text-gray-900">+{formatPrice(delivery.delivery_fee)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}