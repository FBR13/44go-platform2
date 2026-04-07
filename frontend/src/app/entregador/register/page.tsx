'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bike, Car, ArrowRight, User, ShieldCheck } from 'lucide-react';

export default function CourierRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    vehicle_type: 'moto',
    vehicle_plate: '',
    vehicle_model: '',
    vehicle_color: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Cria a conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Erro ao criar conta.');

      // 2. Salva o perfil do entregador na tabela 'couriers'
      const { error: dbError } = await supabase
        .from('couriers')
        .insert({
          id: authData.user.id,
          full_name: formData.full_name,
          cpf: formData.cpf,
          rg: formData.rg,
          birth_date: formData.birth_date,
          vehicle_type: formData.vehicle_type,
          vehicle_plate: formData.vehicle_plate.toUpperCase(),
          vehicle_model: formData.vehicle_model,
          vehicle_color: formData.vehicle_color,
          is_approved: true, // Aqui você pode mudar para false se quiser aprovar manualmente depois
        });

      if (dbError) throw new Error('Erro ao salvar dados do perfil.');

      toast.success('Cadastro realizado com sucesso! Bem-vindo à 44Go.');
      router.push('/entregador/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Ocorreu um erro no cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 my-8">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="bg-gray-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <ShieldCheck className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-2">Seja um Entregador 44Go</h2>
            <p className="text-gray-400 text-sm">Faça seu cadastro e comece a faturar com suas entregas.</p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <form onSubmit={handleRegister} className="space-y-8">
            
            {/* SESSÃO 1: DADOS DE ACESSO */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#fa7109]" /> Dados de Acesso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">E-mail</label>
                  <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="seu@email.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Senha</label>
                  <input type="password" name="password" required minLength={6} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="Crie uma senha" />
                </div>
              </div>
            </div>

            {/* SESSÃO 2: DADOS PESSOAIS */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#fa7109]" /> Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                  <input type="text" name="full_name" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="Digite seu nome completo" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">CPF</label>
                  <input type="text" name="cpf" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="Apenas números" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">RG</label>
                  <input type="text" name="rg" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="Apenas números" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Data de Nascimento</label>
                  <input type="date" name="birth_date" required onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" />
                </div>
              </div>
            </div>

            {/* SESSÃO 3: VEÍCULO */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#fa7109]" /> Dados do Veículo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Tipo de Veículo</label>
                  <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none">
                    <option value="moto">Moto</option>
                    <option value="carro">Carro</option>
                    <option value="bike">Bicicleta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Placa</label>
                  <input type="text" name="vehicle_plate" onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none uppercase" placeholder="ABC-1234" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Modelo</label>
                  <input type="text" name="vehicle_model" onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="Ex: Honda CG 160" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Cor</label>
                  <input type="text" name="vehicle_color" onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none" placeholder="Ex: Vermelha" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#fa7109] hover:bg-[#e06300] disabled:bg-gray-400 text-white font-black py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span>
              ) : (
                <>Finalizar Cadastro <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Já possui conta?{' '}
              <Link href="/entregador/login" className="font-bold text-[#fa7109] hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}