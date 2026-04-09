'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Building2, X, Check, ZoomIn, Store } from 'lucide-react';
import Cropper from 'react-easy-crop';

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

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ESTADO DO FORMULÁRIO COM TODOS OS CAMPOS
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
    logo_url: '',
    banner_url: ''
  });

  // --- ESTADOS DO CROPPER ---
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchStore() {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('seller_id', user!.id)
        .maybeSingle();

      if (data) {
        setStore(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          cnpj: data.cnpj ? maskCNPJ(data.cnpj) : '',
          cep: data.cep ? maskCEP(data.cep) : '',
          street: data.street || '',
          number: data.number || '',
          neighborhood: data.neighborhood || '',
          complement: data.complement || '',
          city: data.city || 'Goiânia',
          state: data.state || 'GO',
          phone: data.phone ? maskPhone(data.phone) : '',
          whatsapp: data.whatsapp ? maskPhone(data.whatsapp) : '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || ''
        });
      }
    }
    fetchStore();
  }, [user]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
        setCropType(type);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirmCrop = async () => {
    if (!imageToCrop || !user) return;

    try {
      setIsUploading(true);
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const fileName = `${user.id}-${cropType}-${Math.random()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('store_assets')
        .upload(fileName, croppedImage);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('store_assets').getPublicUrl(fileName);

      // Importante: Usar o prev para não perder o que já foi digitado no formulário
      setFormData(prev => ({
        ...prev,
        [cropType === 'logo' ? 'logo_url' : 'banner_url']: publicUrlData.publicUrl
      }));

      setImageToCrop(null);
      toast.success('Imagem ajustada! Não esqueça de salvar no final.');
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
      // Monta o endereço para o GPS, mas salva os campos individuais também!
      const fullAddressGPS = `${formData.street}, ${formData.number}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        cnpj: formData.cnpj.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
        street: formData.street.trim(),
        number: formData.number.trim(),
        neighborhood: formData.neighborhood.trim(),
        complement: formData.complement.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        address: fullAddressGPS // Mantém compatibilidade com o GPS
      };

      const response = await fetch(apiUrl(`/stores/${store.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao salvar');
      }

      toast.success('Configurações salvas com sucesso! ✨');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !store) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></div></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">

      {/* MODAL DE RECORTE */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-black text-xl text-gray-900">Ajustar {cropType === 'logo' ? 'Logo' : 'Banner'}</h2>
              <button onClick={() => setImageToCrop(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="relative h-80 sm:h-96 bg-gray-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'logo' ? 1 : 16 / 6}
                cropShape={cropType === 'logo' ? 'round' : 'rect'}
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <ZoomIn size={20} className="text-gray-400" />
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e: any) => setZoom(e.target.value)} className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#fa7109]" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setImageToCrop(null)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all">Cancelar</button>
                <button onClick={handleConfirmCrop} disabled={isUploading} className="flex-[2] py-4 rounded-2xl font-black text-white bg-gradient-to-r from-[#fa7109] to-[#ab0029] shadow-lg flex items-center justify-center gap-2">
                  {isUploading ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span> : <Check size={20} />} Aplicar Recorte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Perfil da Loja</h1>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">

        {/* IMAGENS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">Banner da Vitrine</label>
            <div className="h-44 w-full bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group shadow-inner">
              {formData.banner_url ? <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" /> : <div className="text-center"><span className="text-3xl block mb-1">🖼️</span><span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Subir Banner</span></div>}
              <input type="file" accept="image/*" onChange={(e) => onFileChange(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">Logo da Loja</label>
            <div className="h-44 w-44 bg-gray-50 rounded-full mx-auto md:mx-0 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group shadow-inner">
              {formData.logo_url ? <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" /> : <span className="text-gray-400 text-3xl">🏪</span>}
              <input type="file" accept="image/*" onChange={(e) => onFileChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* DETALHES DO NEGÓCIO */}
        <div>
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-xl tracking-tight"><Building2 className="w-6 h-6 text-[#fa7109]" /> Identidade da Loja</h3>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Loja *</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-bold text-lg transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">CNPJ</label>
              <input type="text" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" placeholder="Opcional" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Descrição / Slogan</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" />
            </div>
          </div>
        </div>

        {/* ENDEREÇO DE COLETA (MANTIDO E PERSISTENTE) */}
        <div className="border-t border-gray-100 pt-8">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-xl tracking-tight"><MapPin className="w-6 h-6 text-[#fa7109]" /> Endereço de Coleta</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">CEP *</label>
              <input required type="text" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: maskCEP(e.target.value) })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Rua / Avenida *</label>
              <input required type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Número *</label>
              <input required type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Bairro *</label>
              <input required type="text" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Galeria / Complemento</label>
            <input type="text" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all" />
          </div>
        </div>

        {/* CONTATOS */}
        <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">WhatsApp de Vendas</label>
            <input required type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-bold text-[#fa7109]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-[10px]">Telefone Fixo</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium" />
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={isSaving || isUploading} className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-5 rounded-[1.5rem] text-xl font-black hover:opacity-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95">
            {isSaving ? <><span className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></span> Gravando...</> : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

// FUNÇÃO AUXILIAR PARA O RECORTE
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
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob as Blob);
    }, 'image/jpeg', 0.9);
  });
}