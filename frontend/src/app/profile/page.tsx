'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Check, ZoomIn, User, MapPin, Camera } from 'lucide-react';
import Cropper from 'react-easy-crop';

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

  // --- ESTADOS DO CROPPER (IGUAL AO SETTINGS) ---
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, cpf, phone, cep, address, avatar_url')
          .eq('id', user!.id)
          .maybeSingle();
        
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

  // Captura o arquivo e abre o editor
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Recorta e sobe para o Supabase
  const handleConfirmCrop = async () => {
    if (!imageToCrop || !user) return;

    try {
      setIsUploading(true);
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      const fileName = `${user.id}/avatar-${Math.random()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('store_assets')
        .upload(fileName, croppedImage);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('store_assets').getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
      setImageToCrop(null);
      toast.success('Foto ajustada! Não esqueça de salvar o perfil. ✨');
    } catch (e) {
      toast.error('Erro ao processar imagem.');
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
      toast.success('Perfil atualizado com sucesso! 🚀');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || 'Verifique as permissões.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="animate-spin h-10 w-10 border-4 border-[#fa7109] border-t-transparent rounded-full"></span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-8 min-h-screen">
      
      {/* MODAL DE RECORTE (DESIGN IGUAL AO SETTINGS) */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-black text-xl text-gray-900">Ajustar sua Foto</h2>
              <button onClick={() => setImageToCrop(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="relative h-80 bg-gray-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round" // Perfil é sempre redondo!
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <ZoomIn size={20} className="text-gray-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e: any) => setZoom(e.target.value)}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#fa7109]"
                />
              </div>

              <div className="flex gap-4">
                <button onClick={() => setImageToCrop(null)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all">
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmCrop} 
                  disabled={isUploading}
                  className="flex-[2] py-4 rounded-2xl font-black text-white bg-gradient-to-r from-[#fa7109] to-[#ab0029] shadow-lg flex items-center justify-center gap-2"
                >
                  {isUploading ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span> : <Check size={20}/>}
                  Aplicar Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Meu Perfil</h1>
      <p className="text-gray-500 mb-8">Gerencie suas informações e foto de perfil na 44Go.</p>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
        
        {/* FOTO DE PERFIL COM HOVER MELHORADO */}
        <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-gray-100">
          <div className="relative group">
            <div className="h-32 w-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-gray-300" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-white">
                <Camera size={20} className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Mudar</span>
              </div>
              <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
            </div>
            {isUploading && (
               <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg">
                  <span className="animate-spin h-4 w-4 border-2 border-[#fa7109] border-t-transparent rounded-full block"></span>
               </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-black text-xl text-gray-900 tracking-tight">Sua Foto de Perfil</h3>
            <p className="text-sm text-gray-500 max-w-[240px]">Clique na imagem para ajustar o enquadramento ou trocar a foto.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[11px]">Nome Completo</label>
            <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all font-medium" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[11px]">CPF</label>
            <input type="text" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[11px]">Celular</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all font-medium" />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-lg tracking-tight"><MapPin size={20} className="text-[#fa7109]"/> Endereço de Entrega</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[11px]">CEP</label>
              <input type="text" value={formData.cep} onChange={(e) => setFormData({...formData, cep: maskCEP(e.target.value)})} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all font-medium" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[11px]">Endereço Completo</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none transition-all font-medium" placeholder="Rua, Número, Bairro, Complemento..." />
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isSaving || isUploading}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-5 rounded-2xl font-black text-lg hover:opacity-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {isSaving ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Atualizando...</> : 'Salvar Meu Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- FUNÇÃO AUXILIAR PARA O RECORTE (CANVAS API) ---
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Falha ao carregar contexto 2D');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob as Blob);
    }, 'image/jpeg', 0.9);
  });
}