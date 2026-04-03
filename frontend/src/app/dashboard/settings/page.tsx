'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner'; // <-- Mudamos para o Sonner

// --- FUNÇÃO DE MÁSCARA DE TELEFONE ---
const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, ''); // Remove tudo que não é número
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
          // Já aplica a máscara na hora de carregar do banco
          phone: data.phone ? maskPhone(data.phone) : '',
          whatsapp: data.whatsapp ? maskPhone(data.whatsapp) : '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || ''
        });
      }
    }
    fetchStore();
  }, [user]);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store_assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('store_assets')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrlData.publicUrl
      }));

      toast.success('Imagem enviada! Não esqueça de salvar as alterações.');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // DICA: Limpamos as máscaras (deixamos só números) antes de mandar pro backend
      const dataToSave = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
      };

      const response = await fetch(apiUrl(`/stores/${store.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) throw new Error('Erro ao salvar no backend');
      
      toast.success('Configurações da loja salvas com sucesso! ✨');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !store) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Perfil da Loja</h1>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        
        {/* SESSÃO DE IMAGENS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Banner da Loja (Destaque)</label>
            <div className="h-40 w-full bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group">
              {formData.banner_url ? (
                <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
              ) : (
                <div className="text-center">
                  <span className="text-3xl block mb-1">🖼️</span>
                  <span className="text-gray-400 text-xs">Clique para subir banner</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Logo da Loja</label>
            <div className="h-40 w-40 bg-gray-50 rounded-full mx-auto md:mx-0 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group shadow-inner">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
              ) : (
                <span className="text-gray-400 text-3xl">🏪</span>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* SESSÃO DE TEXTOS */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Descrição / Slogan da Loja</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-[#fa7109] focus:outline-none transition-shadow"
            rows={3}
            placeholder="Ex: A melhor moda feminina do Setor Norte Ferroviário"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp de Vendas</label>
            <input 
              type="text" 
              value={formData.whatsapp}
              // APLICA MÁSCARA NO ONCHANGE
              onChange={(e) => setFormData({...formData, whatsapp: maskPhone(e.target.value)})}
              className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium"
              placeholder="(62) 9 9999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Telefone Fixo (Opcional)</label>
            <input 
              type="text" 
              value={formData.phone}
              // APLICA MÁSCARA NO ONCHANGE
              onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
              className="w-full border border-gray-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#fa7109] outline-none font-medium"
              placeholder="(62) 3333-3333"
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSaving || isUploading}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? 'Enviando imagem...' : isSaving ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Salvando...
              </>
            ) : 'Salvar Configurações'}
          </button>
        </div>

      </form>
    </div>
  );
}