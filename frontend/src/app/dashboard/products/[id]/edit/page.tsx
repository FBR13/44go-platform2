'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditProductPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams(); 
    const productId = params.id;

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('');

    // Estados do Formulário
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('0'); 
    const [imageUrl, setImageUrl] = useState('');

    // 1. Carrega os dados atuais do produto ao abrir a página
    useEffect(() => {
        if (authLoading || !productId) return;

        async function fetchProduct() {
            try {
                // Busca direto no Supabase para leitura rápida
                const { data, error: pgError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single(); // Esperamos apenas um resultado

                if (pgError || !data) {
                    throw new Error('Produto não encontrado ou você não tem permissão.');
                }

                // Preenche os estados com os dados existentes
                setTitle(data.title);
                setDescription(data.description || ''); // Trata nulos
                setImageUrl(data.image_url || ''); // Trata nulos
                
                // Converte números do banco para string para o input
                setPrice(data.base_price.toString());
                setStock(data.stock_quantity?.toString() || '0');

            } catch (err: any) {
                toast.error("Erro ao carregar produto:", err);
                setError(err.message || 'Erro ao carregar dados do produto.');
            } finally {
                setLoadingData(false);
            }
        }

        fetchProduct();
    }, [productId, authLoading]);

    // 2. Função de Upload de Imagem (mesma lógica do cadastro)
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
            setError('Erro ao fazer upload da nova imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    // 3. Salva as alterações no Backend NestJS (usando PATCH)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            // Chame a rota PATCH /products/:id do seu NestJS
            const response = await fetch(apiUrl(`/products/${productId}`), {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    // Converte string "49,90" -> número 49.90
                    base_price: parseFloat(price.replace(',', '.')),
                    // Converte string "10" -> número inteiro 10
                    stock_quantity: parseInt(stock), 
                    image_url: imageUrl,
                    category: category,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Erro ao atualizar produto no backend.');
            }

            toast.success('Produto atualizado com sucesso! 🚀');
            router.push('/dashboard/products'); // Volta para a listagem

        } catch (err: any) {
            console.error("Erro ao salvar produto:", err);
            setError(err.message || 'Erro de conexão com o Backend.');
        } finally {
            setIsSaving(false);
        }
    };

    // Estados de carregamento da página
    if (authLoading || loadingData) {
        return <div className="p-8 text-center text-gray-500">Carregando dados do produto...</div>;
    }

    // Se houver erro crítico ao carregar
    if (error && !title) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl m-4 border border-red-100">
                {error}
                <div className="mt-4">
                    <Link href="/dashboard/products" className="text-sm text-[#fa7109] hover:underline">
                        Voltar para listagem
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">

            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard/products" className="text-gray-400 hover:text-[#fa7109] transition-colors">
                    ← Voltar
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Editar Produto</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {/* FOTO DO PRODUTO (Preview + Upload) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto principal do produto</label>
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="h-40 w-40 sm:h-48 sm:w-48 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden shrink-0 group">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <span className="text-4xl block mb-2">📷</span>
                                    <span className="text-xs text-gray-400">Clique para adicionar</span>
                                </div>
                            )}
                            {/* Overlay de hover para indicar que pode mudar a foto */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Alterar foto</span>
                            </div>
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
                            {isUploading && <p className="text-[#fa7109] font-medium mt-3 animate-pulse">Enviando nova imagem...</p>}
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

                    {/* PREÇO E ESTOQUE LADO A LADO (Igual ao cadastro) */}
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
                                min="0" // Impede números negativos no input
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    {/* Botão Cancelar */}
                    <Link 
                        href="/dashboard/products"
                        className="w-full sm:w-auto text-center bg-gray-100 text-gray-700 p-4 rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-sm text-lg"
                    >
                        Cancelar
                    </Link>

                    {/* Botão Salvar */}
                    <button
                        type="submit"
                        disabled={isSaving || isUploading || !imageUrl}
                        className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md text-lg flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                Salvando Alterações...
                            </>
                        ) : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}