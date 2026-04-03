'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// --- FUNÇÕES DE MÁSCARA (FORMATADORES) ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o 3º e 4º dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o 6º e 7º dígitos
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca traço entre o 9º e 10º dígitos
    .replace(/(-\d{2})\d+?$/, '$1'); // Impede de digitar mais que 11 dígitos
};

const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 10) {
    // Formato Fixo: (62) 3333-3333
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  // Formato Celular: (62) 99999-9999
  return v
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};
// ------------------------------------------

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    avatar_url: ''
  });

  // Carrega os dados do usuário
  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (data) {
        setFormData({
          name: data.name || '',
          // Já aplica a máscara na hora de carregar do banco, caso tenha vindo sem formatação
          cpf: data.cpf ? maskCPF(data.cpf) : '',
          phone: data.phone ? maskPhone(data.phone) : '',
          cep: data.cep ? maskCEP(data.cep) : '',
          address: data.address || '',
          avatar_url: data.avatar_url || ''
        });
      }
    }
    fetchProfile();
  }, [user]);

  if (!loading && !user) {
    router.push('/auth/login');
    return null;
  }

  // Upload da Foto de Perfil
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store_assets') 
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('store_assets')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
      alert('Foto atualizada!');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          cpf: formData.cpf,
          phone: formData.phone,
          cep: formData.cep,
          address: formData.address,
          avatar_url: formData.avatar_url
        })
        .eq('id', user!.id);

      if (error) throw error;
      
      alert('Dados salvos com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-8 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Meu Perfil</h1>
      <p className="text-gray-500 mb-8">Gerencie suas informações pessoais e endereço de entrega.</p>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* FOTO DE PERFIL */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden shrink-0">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-2xl">👤</span>
            )}
            <input type="file" accept="image/*" onChange={handleUploadImage} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Foto de Perfil</h3>
            <p className="text-sm text-gray-500 mb-2">Clique na imagem para alterar. JPG ou PNG.</p>
            {isUploading && <span className="text-sm text-[#fa7109]">Enviando foto...</span>}
          </div>
        </div>

        {/* DADOS PESSOAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input 
              type="text" 
              value={formData.cpf}
              // AQUI A MÁGICA ACONTECE:
              onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / Celular</label>
            <input 
              type="text" 
              value={formData.phone}
              // AQUI A MÁGICA ACONTECE:
              onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
              placeholder="(62) 99999-9999"
            />
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Endereço de Entrega</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input 
                type="text" 
                value={formData.cep}
                // AQUI A MÁGICA ACONTECE:
                onChange={(e) => setFormData({...formData, cep: maskCEP(e.target.value)})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
                placeholder="74000-000"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo (Rua, Número, Bairro)</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
                placeholder="Rua 44, Setor Norte Ferroviário..."
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving || isUploading}
            className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Meu Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}