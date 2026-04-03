'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';

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
    const [stock, setStock] = useState('1'); // Estado para o estoque iniciado em 1
    const [imageUrl, setImageUrl] = useState('');

    // 1. Antes de criar o produto, precisamos descobrir qual é a loja deste lojista
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
                alert('Você precisa criar uma loja primeiro!');
                router.push('/dashboard/stores/new');
            }
        }

        fetchStore();
    }, [user, authLoading, router]);

    // 2. Função de Upload de Imagem
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
        } catch (err: any) {
            console.error(err);
            setError('Erro ao fazer upload da imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    // 3. Salva os dados no Backend NestJS
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;

        setIsSaving(true);
        setError('');

        try {
            const response = await fetch(apiUrl('/products'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    base_price: parseFloat(price.replace(',', '.')),
                    stock_quantity: parseInt(stock), // Enviando o estoque como número inteiro
                    image_url: imageUrl,
                    store_id: storeId,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                toast.error(errData.message || 'Erro ao salvar produto');
            }

            toast.success('Produto salvo com sucesso! 🚀');
            router.push('/dashboard/products');

        } catch (err: any) {
            console.error("Erro ao salvar produto:", err);
            toast.error('Não foi possível conectar ao servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !storeId) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">

            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard/products" className="text-gray-400 hover:text-[#fa7109] transition-colors">
                    ← Voltar
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Novo Produto</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {/* FOTO DO PRODUTO */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto principal do produto</label>
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="h-40 w-40 sm:h-48 sm:w-48 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden shrink-0">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <span className="text-4xl block mb-2">📷</span>
                                    <span className="text-xs text-gray-400">Clique para adicionar</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleUploadImage}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            <p className="font-medium text-gray-900 mb-1">Dicas para uma boa foto:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Use um fundo limpo e iluminado.</li>
                                <li>Mostre o produto inteiro.</li>
                                <li>Evite textos por cima da imagem.</li>
                            </ul>
                            {isUploading && <p className="text-[#fa7109] font-medium mt-3">Enviando imagem...</p>}
                        </div>
                    </div>
                </div>

                {/* INFORMAÇÕES BÁSICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
                            placeholder="Ex: Vestido Canelado Mid Preto"
                            required
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none"
                            rows={4}
                            placeholder="Fale sobre o tecido, tamanhos disponíveis, cores..."
                        />
                    </div>

                    {/* PREÇO E ESTOQUE LADO A LADO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none text-lg font-medium"
                                placeholder="49.90"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Disponível</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none text-lg font-medium"
                                placeholder="10"
                                min="0"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSaving || isUploading || !imageUrl}
                        className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md text-lg"
                    >
                        {isSaving ? 'Salvando Produto...' : 'Cadastrar Produto'}
                    </button>
                    {!imageUrl && (
                        <p className="text-center text-xs text-gray-400 mt-2">Você precisa adicionar uma foto antes de salvar.</p>
                    )}
                </div>
            </form>
        </div>
    );
}