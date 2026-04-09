'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Camera,
    PackagePlus,
    Info,
    Tag,
    Box,
    Zap,
    LayoutGrid,
    AlignLeft // Ícone para a descrição
} from 'lucide-react';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

const CATEGORY_OPTIONS = [
    { label: 'Feminino', value: 'Feminino' },
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Infantil', value: 'Infantil' },
    { label: 'Acessórios', value: 'Acessórios' },
    { label: 'Calçados', value: 'Calçados' },
];

export default function NewProductPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [storeId, setStoreId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Estados do Formulário
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(''); // Estado da descrição
    const [price, setPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [stock, setStock] = useState('1');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/auth/login');
            return;
        }

        async function fetchStore() {
            const { data } = await supabase
                .from('stores')
                .select('id')
                .eq('seller_id', user!.id)
                .single();

            if (data) {
                setStoreId(data.id);
            } else {
                toast.error('Você precisa criar uma loja primeiro!');
                router.push('/dashboard/stores/new');
            }
        }

        fetchStore();
    }, [user, authLoading, router]);

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `product-${user.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('store_assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('store_assets')
                .getPublicUrl(fileName);

            setImageUrl(publicUrlData.publicUrl);
            toast.success('Imagem carregada! ✨');
        } catch (err: any) {
            toast.error('Erro ao subir imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;

        if (!category) {
            toast.error("Selecione uma categoria.");
            return;
        }

        setIsSaving(true);

        try {
            const formattedPrice = parseFloat(price.replace(',', '.'));
            const formattedSalePrice = salePrice && salePrice.trim() !== ""
                ? parseFloat(salePrice.replace(',', '.'))
                : null;

            const { error: insertError } = await supabase
                .from('products')
                .insert({
                    title: title.trim(),
                    description: description.trim(), // Salvando a descrição
                    base_price: formattedPrice,
                    sale_price: formattedSalePrice,
                    stock_quantity: parseInt(stock, 10),
                    image_url: imageUrl,
                    store_id: storeId,
                    category: category,
                    is_active: true
                });

            if (insertError) throw insertError;

            toast.success('Produto cadastrado com sucesso! 🚀');
            router.push('/dashboard/products');

        } catch (err: any) {
            toast.error('Erro ao cadastrar produto.');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !storeId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/products" className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#fa7109] transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            Novo Produto
                        </h1>
                        <p className="text-gray-500 text-sm">Adicione um novo item ao seu catálogo.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* CARD DE IMAGEM */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative group shrink-0">
                        <div className="h-48 w-48 bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative transition-all group-hover:border-[#fa7109]/50">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera size={40} className="text-gray-300" />
                            )}
                            <input type="file" accept="image/*" onChange={handleUploadImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                                <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#fa7109]"></span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Info size={18} className="text-[#fa7109]" /> Foto do Produto
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Use fotos com boa iluminação. O formato ideal é 1:1 (quadrada).
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    {/* TÍTULO */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider text-[11px]">Título</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all"
                            placeholder="Ex: Camiseta Oversized Algodão"
                        />
                    </div>

                    {/* DESCRIÇÃO (O QUE FALTOU!) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider text-[11px] flex items-center gap-2">
                            <AlignLeft size={14} /> Descrição Detalhada
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all resize-none"
                            placeholder="Descreva o material, caimento, tamanhos e o que torna esse produto especial..."
                        />
                    </div>

                    <CustomDropdown
                        label="Categoria *"
                        icon={<LayoutGrid size={14} />}
                        options={CATEGORY_OPTIONS}
                        value={category}
                        onChange={(val) => setCategory(val)}
                        placeholder="Selecione o nicho"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1 uppercase tracking-wider text-[11px]"><Tag size={14} /> Preço Base</label>
                            <input required type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-bold text-lg" placeholder="0,00" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-green-600 mb-2 flex items-center gap-1 uppercase tracking-wider text-[11px]"><Zap size={14} fill="currentColor" /> Preço de Oferta</label>
                            <input type="text" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full border border-green-100 bg-green-50/30 p-4 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-lg text-green-700" placeholder="Opcional" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1 uppercase tracking-wider text-[11px]"><Box size={14} /> Estoque</label>
                            <input required type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-bold text-lg" min="0" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={isSaving || isUploading || !imageUrl} className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-5 rounded-2xl font-black text-xl hover:opacity-90 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Cadastrar Produto'}
                    </button>
                </div>
            </form>
        </div>
    );
}