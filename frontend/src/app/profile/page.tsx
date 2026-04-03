'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- FUNÇÕES DE MÁSCARA ---
const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, '');
  return v.length <= 10 
    ? v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14)
    : v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
};
const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    avatar_url: ''
  });

  // 1. Busca os dados usando maybeSingle (não quebra se o perfil for novo)
  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, cpf, phone, cep, address, avatar_url')
          .eq('id', user!.id)
          .maybeSingle(); // <-- .maybeSingle() resolve o erro de JSON object
        
        if (error) throw error;

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            cpf: data.cpf ? maskCPF(data.cpf) : '',
            phone: data.phone ? maskPhone(data.phone) : '',
            cep: data.cep ? maskCEP(data.cep) : '',
            address: data.address || '',
            avatar_url: data.avatar_url || ''
          });
        }
      } catch (err: any) {
        console.error('Erro ao buscar perfil:', err.message);
      }
    }
    fetchProfile();
  }, [user]);

  if (!loading && !user) {
    router.push('/auth/login');
    return null;
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store_assets') 
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('store_assets')
        .getPublicUrl(fileName);

      // Atualiza o estado da imagem NA HORA para o usuário ver
      setFormData(prev => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
      toast.success('Imagem enviada! Salve para confirmar.');
    } catch (error: any) {
      toast.error('Erro ao enviar foto: ' + error.message);
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
        .upsert({
          id: user!.id,
          email: user!.email,
          full_name: formData.full_name,
          cpf: formData.cpf.replace(/\D/g, ''), 
          phone: formData.phone.replace(/\D/g, ''), 
          cep: formData.cep.replace(/\D/g, ''),
          address: formData.address,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso! ✨');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar: ' + (error.message || 'Verifique as permissões de banco.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="animate-spin h-8 w-8 border-4 border-[#fa7109] border-t-transparent rounded-full"></span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-8 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Meu Perfil</h1>
      <p className="text-gray-500 mb-8">Gerencie suas informações e foto de perfil.</p>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* FOTO DE PERFIL */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="h-28 w-28 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden shrink-0 group shadow-inner">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-3xl">👤</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <span className="text-white text-[10px] font-bold text-center px-1">TROCAR FOTO</span>
            </div>
            <input type="file" accept="image/*" onChange={handleUploadImage} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-gray-900">Sua Foto</h3>
            <p className="text-sm text-gray-500">Clique no círculo para alterar sua imagem.</p>
            {isUploading && <span className="text-xs font-bold text-[#fa7109] animate-pulse italic mt-1 block">CARREGANDO...</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
            <input 
              type="text" 
              value={formData.cpf}
              onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone / Celular</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Endereço</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">CEP</label>
              <input 
                type="text" 
                value={formData.cep}
                onChange={(e) => setFormData({...formData, cep: maskCEP(e.target.value)})}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço Completo</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSaving || isUploading}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-4 rounded-xl font-bold hover:scale-[1.01] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Salvando...' : 'Salvar Meu Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}