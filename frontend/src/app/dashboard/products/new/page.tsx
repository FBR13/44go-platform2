'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, PackagePlus, Info } from 'lucide-react';

export default function NewProductPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [storeId, setStoreId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // Estados do Formulário
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('1'); 
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');

    // 1. Descobre a loja do lojista
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

    // 2. Função de Upload de Imagem no Supabase Storage
    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setIsUploading(true);
            setError('');

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
            toast.success('Imagem carregada com sucesso! 📸');
        } catch (err: any) {
            console.error(err);
            setError('Erro ao fazer upload da imagem.');
            toast.error('Erro ao subir imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    // 3. Salva os dados DIRETAMENTE no Supabase (Adeus Backend fantasma!)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;

        setIsSaving(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('products')
                .insert({
                    title: title.trim(),
                    description: description.trim(),
                    base_price: parseFloat(price.replace(',', '.')),
                    stock_quantity: parseInt(stock, 10),
                    image_url: imageUrl,
                    store_id: storeId,
                    category: category
                });

            if (insertError) throw insertError;

            toast.success('Produto salvo com sucesso! 🚀');
            router.push('/dashboard/products');

        } catch (err: any) {
            console.error("Erro ao salvar produto no banco:", err);
            setError(err.message || 'Erro ao cadastrar produto.');
            toast.error('Ocorreu um erro ao salvar o produto.');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !storeId) {
        return <div className="min-h-[60vh] flex items-center justify-center"><span className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#fa7109]"></span></div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <PackagePlus className="w-8 h-8 text-[#fa7109]" />
                        Novo Produto
                    </h1>
                    <p className="text-gray-500 mt-1">Cadastre um novo item no catálogo da sua loja.</p>
                </div>
                <Link 
                    href="/dashboard/products" 
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#fa7109] bg-white border border-gray-200 px-4 py-2 rounded-xl transition-colors shadow-sm w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2 font-medium">
                        <Info className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* FOTO DO PRODUTO */}
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Foto principal do produto</label>
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                        
                        <div className="h-40 w-40 sm:h-48 sm:w-48 bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#fa7109] transition-colors relative overflow-hidden shrink-0 shadow-sm group">
                            {imageUrl ? (
                                <>
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Trocar foto</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2 group-hover:text-[#fa7109] transition-colors" strokeWidth={1.5} />
                                    <span className="text-xs font-medium text-gray-400 group-hover:text-[#fa7109] transition-colors">Clique para adicionar</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUploadImage}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={isUploading}
                            />
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            <p className="font-bold text-gray-900 text-base">Dicas para uma foto vendedora:</p>
                            <ul className="list-disc pl-5 space-y-1.5 marker:text-[#fa7109]">
                                <li>Use um fundo limpo e bem iluminado.</li>
                                <li>Mostre o produto inteiro e focado.</li>
                                <li>Evite textos ou marcas d'água por cima da imagem.</li>
                            </ul>
                            {isUploading && (
                                <p className="text-[#fa7109] font-bold mt-4 flex items-center gap-2 bg-orange-50 w-fit px-3 py-1.5 rounded-lg border border-orange-100">
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-[#fa7109]"></span>
                                    Enviando imagem...
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* INFORMAÇÕES BÁSICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Nome do Produto</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-medium text-gray-900 placeholder:font-normal"
                            placeholder="Ex: Vestido Canelado Mid Preto"
                            required
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Categoria</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-medium text-gray-900 cursor-pointer"
                            required
                        >
                            <option value="" disabled>Selecione uma categoria...</option>
                            <option value="Moda Feminina">👗 Moda Feminina</option>
                            <option value="Moda Masculina">👕 Moda Masculina</option>
                            <option value="Calçados">👟 Calçados</option>
                            <option value="Acessórios">⌚ Acessórios</option>
                            <option value="Beleza">💄 Beleza</option>
                            <option value="Eletrônicos">📱 Eletrônicos</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-y text-gray-900"
                            rows={4}
                            placeholder="Fale sobre o tecido, tamanhos disponíveis, cores e diferenciais..."
                        />
                    </div>

                    {/* PREÇO E ESTOQUE LADO A LADO */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Preço (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-xl font-black text-[#fa7109] placeholder:font-normal placeholder:text-gray-400"
                            placeholder="49.90"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Estoque Disponível</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:bg-white focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-xl font-bold text-gray-900 placeholder:font-normal"
                            placeholder="1"
                            min="0"
                            required
                        />
                    </div>
                </div>

                <div className="pt-6 mt-2 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={isSaving || isUploading || !imageUrl}
                        className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white py-4 rounded-xl font-bold hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md text-lg flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <><span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span> Salvando...</>
                        ) : (
                            'Cadastrar Produto'
                        )}
                    </button>
                    {!imageUrl && (
                        <p className="text-center text-sm font-medium text-red-500 mt-4 flex items-center justify-center gap-1.5">
                            <Info className="w-4 h-4" />
                            É obrigatório adicionar a foto do produto para continuar.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}