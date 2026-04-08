'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Package, Save, Info, Tag, Box, Zap } from 'lucide-react';

export default function EditProductPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const productId = params.id;

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');

    // Estados do Formulário
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [salePrice, setSalePrice] = useState(''); // <-- NOVO: Preço de Oferta
    const [stock, setStock] = useState('0');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (authLoading || !productId) return;

        async function fetchProduct() {
            try {
                const { data, error: pgError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (pgError || !data) throw new Error('Produto não encontrado.');

                setTitle(data.title);
                setDescription(data.description || '');
                setImageUrl(data.image_url || '');
                setPrice(data.base_price.toString());
                setSalePrice(data.sale_price ? data.sale_price.toString() : '');
                setStock(data.stock_quantity?.toString() || '0');
                setCategory(data.category || '');

            } catch (err: any) {
                toast.error("Erro ao carregar produto.");
                setError(err.message);
            } finally {
                setLoadingData(false);
            }
        }

        fetchProduct();
    }, [productId, authLoading]);

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
            toast.success('Imagem atualizada! ✨');
        } catch (err: any) {
            toast.error('Erro ao subir imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formattedBasePrice = parseFloat(price.toString().replace(',', '.'));
            const formattedSalePrice = salePrice && salePrice.toString().trim() !== ""
                ? parseFloat(salePrice.toString().replace(',', '.'))
                : null;

            // Criamos o objeto que será enviado
            const payload: any = {
                title,
                description,
                base_price: formattedBasePrice,
                stock_quantity: parseInt(stock.toString()),
                image_url: imageUrl,
                category,
            };

            // ATENÇÃO: Só enviamos o sale_price se ele for diferente de null
            // Isso evita o erro 400 enquanto você não atualiza o DTO no NestJS
            if (formattedSalePrice !== null) {
                payload.sale_price = formattedSalePrice;
            }

            const response = await fetch(apiUrl(`/products/${productId}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                // Se o erro for "property sale_price should not exist", damos um aviso melhor
                if (errData.message && errData.message.includes('sale_price')) {
                    throw new Error('O servidor ainda não aceita preços de oferta. Verifique o DTO no NestJS.');
                }
                throw new Error(errData.message || 'Erro ao atualizar produto.');
            }

            toast.success('Produto atualizado com sucesso! 🚀');
            router.push('/dashboard/products');

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || loadingData) {
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
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Produto</h1>
                        <p className="text-gray-500 text-sm">Atualize as informações e preços da sua vitrine.</p>
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
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">Alterar Foto</span>
                            </div>
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
                            <Info size={18} className="text-[#fa7109]" /> Dicas de mestre
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Produtos com fotos em **fundo branco** ou ambientadas em **boa luz** vendem até 3x mais. Certifique-se de que a foto mostre bem os detalhes.
                        </p>
                    </div>
                </div>

                {/* DADOS PRINCIPAIS */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Título do Produto</label>
                        <input
                            required type="text" value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all"
                            placeholder="Ex: Camiseta Oversized Algodão Egípcio"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Descrição Detalhada</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-medium transition-all"
                            placeholder="Descreva o material, caimento e por que o cliente deve comprar..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                <Tag size={14} /> Preço Base (R$)
                            </label>
                            <input
                                required type="text" value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-bold text-lg"
                                placeholder="0,00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-green-600 mb-2 flex items-center gap-1">
                                <Zap size={14} className="fill-green-600" /> Preço de Oferta (R$)
                            </label>
                            <input
                                type="text" value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                className="w-full border border-green-100 bg-green-50/30 p-4 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-lg text-green-700"
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                <Box size={14} /> Estoque
                            </label>
                            <input
                                required type="number" value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full border border-gray-200 bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-[#fa7109]/20 focus:border-[#fa7109] outline-none font-bold text-lg"
                                min="0"
                            />
                        </div>
                    </div>

                    {salePrice && parseFloat(salePrice.replace(',', '.')) < parseFloat(price.replace(',', '.')) && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                            <div className="bg-green-500 text-white p-1 rounded-full"><Save size={14} /></div>
                            <p className="text-sm text-green-700 font-medium">
                                **Promoção Ativa:** O cliente verá um desconto de {Math.round(((parseFloat(price.replace(',', '.')) - parseFloat(salePrice.replace(',', '.'))) / parseFloat(price.replace(',', '.'))) * 100)}% na loja!
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                        href="/dashboard/products"
                        className="flex-1 text-center bg-white border border-gray-200 text-gray-500 p-5 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving || isUploading || !title || !price}
                        className="flex-[2] bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-5 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span>
                                Salvando Alterações...
                            </>
                        ) : (
                            <>
                                <Save size={22} /> Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}