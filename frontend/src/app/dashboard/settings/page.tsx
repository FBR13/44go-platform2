'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    phone: '',
    whatsapp: '',
    logo_url: '',
    banner_url: ''
  });

  // Carrega os dados da loja
  useEffect(() => {
    if (!user) return;
    async function fetchStore() {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('seller_id', user!.id)
        .single();
      
      if (data) {
        setStore(data);
        setFormData({
          description: data.description || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || ''
        });
      }
    }
    fetchStore();
  }, [user]);

  // Função mágica de Upload direto pro Supabase
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      
      // Cria um nome único para a imagem (ex: 123-logo-8493.png)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random()}.${fileExt}`;

      // 1. Envia pro Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('store_assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Pega o link público da imagem
      const { data: publicUrlData } = supabase.storage
        .from('store_assets')
        .getPublicUrl(fileName);

      // 3. Salva o link na tela
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrlData.publicUrl
      }));

      alert('Imagem enviada com sucesso!');

    } catch (error) {
      console.error(error);
      alert('Erro ao enviar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Vamos enviar os dados atualizados para o nosso Backend!
      const response = await fetch(`http://localhost:3333/api/stores/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar no backend');
      
      alert('Configurações salvas com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !store) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Perfil da Loja</h1>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* SESSÃO DE IMAGENS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner da Loja (1200x400)</label>
            <div className="h-32 w-full bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
              {formData.banner_url ? (
                <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">Sem banner</span>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo da Loja (Quadrada)</label>
            <div className="h-32 w-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">Sem logo</span>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* SESSÃO DE TEXTOS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Slogan</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-[#fa7109]"
            rows={3}
            placeholder="Conte um pouco sobre o que você vende..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp de Vendas</label>
            <input 
              type="text" 
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-[#fa7109]"
              placeholder="(62) 99999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Fixo (Opcional)</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-[#fa7109]"
              placeholder="(62) 3333-3333"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving || isUploading}
          className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-8 py-3.5 rounded-lg text-lg font-medium hover:opacity-90 transition-opacity shadow-lg  disabled:opacity-50 w-full"
        >
          {isUploading ? 'Fazendo upload...' : isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>

      </form>
    </div>
  );
}