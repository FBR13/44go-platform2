'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Building2, Store } from 'lucide-react';

// --- MÁSCARAS ---
const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 10) return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
};

const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const maskCEP = (value: string) => {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cnpj: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    city: 'Goiânia',
    state: 'GO',
    phone: '',
    whatsapp: '',
  });

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

  // 2. Função para Criar a Loja no Backend
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);

    try {
      // Monta o endereço completo para o GPS não quebrar!
      const fullAddressGPS = `${formData.street}, ${formData.number}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;

      const response = await fetch(apiUrl('/stores'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          seller_id: user.id,
          address: fullAddressGPS,
          cnpj: formData.cnpj.replace(/\D/g, ''),
          cep: formData.cep.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          whatsapp: formData.whatsapp.replace(/\D/g, ''),
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          complement: formData.complement,
          city: formData.city,
          state: formData.state
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao criar loja no servidor.');
      }

      const newStore = await response.json();
      setStore(newStore); 
      toast.success('Loja criada com sucesso! Bem-vindo ao painel.');
      
    } catch (err: any) {
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
       </div>
    )
  }

  // 4. TELA B: Se ele NÃO TEM loja, mostra o formulário COMPLETO de criar
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-tr from-[#fa7109] to-[#ab0029] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-orange-500/20">
          <Store className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Abra sua Loja Virtual</h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">Preencha os dados do seu negócio para começarmos a vender e calcular os fretes de entrega.</p>
      </div>

      <div className="bg-white p-8 max-w-4xl w-full rounded-3xl shadow-xl border border-gray-100">
        <form onSubmit={handleCreateStore} className="space-y-8">
          
          {/* INFORMAÇÕES BÁSICAS */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Building2 className="w-5 h-5 text-[#fa7109]"/> Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Loja *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="Ex: Confecções Silva" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">CNPJ (Opcional)</label>
                <input type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="00.000.000/0000-00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Descrição / Slogan da Loja</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="Ex: A melhor moda feminina..." />
            </div>
          </div>

          {/* ENDEREÇO DE COLETA */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><MapPin className="w-5 h-5 text-[#fa7109]"/> Endereço de Coleta (Para os Motoboys)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">CEP *</label>
                <input required type="text" value={formData.cep} onChange={(e) => setFormData({...formData, cep: maskCEP(e.target.value)})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="00000-000" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Rua / Avenida *</label>
                <input required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="Ex: Rua 44" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Número *</label>
                <input required type="text" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="Ex: 123 ou S/N" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Bairro *</label>
                <input required type="text" value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="Ex: Setor Norte Ferroviário" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Galeria / Complemento</label>
                <input type="text" value={formData.complement} onChange={(e) => setFormData({...formData, complement: e.target.value})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="Ex: Galeria X, Loja 15" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cidade</label>
                  <input type="text" disabled value={formData.city} className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                  <input type="text" disabled value={formData.state} className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>

          {/* CONTATOS */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Store className="w-5 h-5 text-[#fa7109]"/> Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp de Vendas *</label>
                <input required type="text" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: maskPhone(e.target.value)})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="(62) 9 9999-9999" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Telefone Fixo (Opcional)</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium" placeholder="(62) 3333-3333" />
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isCreating || !formData.name.trim() || !formData.street.trim()}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-5 rounded-2xl font-black text-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 mt-8"
          >
            {isCreating ? (
              <><span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span> Criando sua loja...</>
            ) : 'Abrir Minha Loja 🚀'}
          </button>

        </form>
      </div>
    </div>
  );
}