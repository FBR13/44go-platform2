'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LogOut, ChevronDown, Bike, Wallet, LayoutDashboard } from 'lucide-react';

export function CourierHeader() {
    const { user, loading, displayName, signOut } = useAuth();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [totalEarned, setTotalEarned] = useState(0);

    // Fecha o dropdown se clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Busca o Avatar e a GRANA do Entregador (Em Tempo Real)
    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        // Busca Avatar
        supabase
            .from('users')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (cancelled) return;
                setUserAvatar(
                    data?.avatar_url ||
                        (user.user_metadata?.picture as string | undefined) ||
                        null,
                );
            });

        // Busca Ganhos Iniciais
        supabase
            .from('courier_wallets')
            .select('total_earned')
            .eq('courier_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (cancelled) return;
                if (data) setTotalEarned(data.total_earned);
            });

        // Ouve Atualizações ao Vivo na Carteira (O Gatilho joga o dinheiro aqui)
        const channel = supabase
            .channel('header_wallet_sync')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'courier_wallets',
                    filter: `courier_id=eq.${user.id}`,
                },
                (payload) => {
                    setTotalEarned(payload.new.total_earned);
                },
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
        setUserAvatar(null);
        router.push('/entregador/login');
    };

    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'E';
    const formatPrice = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
    const effectiveAvatar = user ? userAvatar : null;

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50 bg-white">
                <div className="flex justify-between items-center h-16">

                    {/* LADO ESQUERDO: Animação Perfeita da Motinha */}
                    <div className="flex items-center py-2">
                        <Link
                            href="/entregador/dashboard"
                            className="relative flex items-center pr-10 group" /* O pr-10 dá o espaço exato para a moto estacionar */
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {/* 1. Texto Base: Sempre visível, cinza escuro elegante */}
                            <span className="text-xl sm:text-2xl font-black text-gray-800 whitespace-nowrap">
                                44Go - Delivery
                            </span>

                            {/* 2. Texto Colorido: Oculto por padrão, revelado da esquerda pra direita sincronizado com a moto */}
                            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#fa7109] to-[#ab0029] bg-clip-text text-transparent absolute left-0 whitespace-nowrap transition-all duration-[1000ms] ease-in-out [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0_0_0)] z-10">
                                44Go - Delivery
                            </span>

                            {/* 3. A Moto: Começa escondida na esquerda, viaja junto com o texto colorido e estaciona no espaço vazio */}
                            <Bike className="absolute text-[#fa7109] w-7 h-7 -left-10 group-hover:left-[calc(100%-2.2rem)] transition-all duration-[1000ms] ease-in-out opacity-0 group-hover:opacity-100 z-20" />
                        </Link>
                    </div>

                    {/* LADO DIREITO: Ganhos e Avatar */}
                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* BOTÃO HAMBÚRGUER MOBILE */}
                        <button
                            type="button"
                            className="sm:hidden p-2 text-gray-600 hover:text-[#fa7109] hover:bg-gray-50 rounded-full"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* ÁREA DO USUÁRIO PC */}
                        <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-200 ml-2">
                            {loading ? (
                                <span className="text-sm text-gray-400 animate-pulse">Carregando...</span>
                            ) : user ? (
                                <div className="flex items-center gap-4">

                                    {/* Visor de Ganhos em Tempo Real */}
                                    <div className="flex flex-col text-right mr-2">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Faturamento</span>
                                        <span className="text-sm font-black text-green-600 animate-in zoom-in duration-300">
                                            {formatPrice(totalEarned)}
                                        </span>
                                    </div>

                                    {/* Dropdown do Avatar */}
                                    <div className="relative" ref={profileMenuRef}>
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus:outline-none"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white flex items-center justify-center font-bold shadow-sm overflow-hidden border border-orange-100/50 shrink-0">
                                                {effectiveAvatar ? <img src={effectiveAvatar} alt="" className="w-full h-full object-cover" /> : initial}
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-[#fa7109]' : ''}`} />
                                        </button>

                                        {isProfileMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                                <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{displayName || 'Entregador Parceiro'}</p>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                                </div>
                                                <div className="p-2 flex flex-col gap-1">
                                                    <Link href="/entregador/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl transition-colors flex items-center gap-3">
                                                        <LayoutDashboard className="w-4 h-4" /> Radar de Corridas
                                                    </Link>
                                                    <Link href="/entregador/carteira" onClick={() => setIsProfileMenuOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl transition-colors flex items-center gap-3">
                                                        <Wallet className="w-4 h-4" /> Minha Carteira
                                                    </Link>
                                                </div>
                                                <div className="p-2 border-t border-gray-100 bg-gray-50/30">
                                                    <button onClick={handleSignOut} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors flex items-center gap-3">
                                                        <LogOut className="w-4 h-4" /> Sair da conta
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link href="/entregador/login" className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity font-bold shadow-sm text-sm">
                                    Acessar Painel
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MENU MOBILE */}
            {isMobileMenuOpen && (
                <div className="sm:hidden bg-white border-t border-gray-100 absolute w-full shadow-2xl z-40 animate-in slide-in-from-top-2">
                    <div className="pt-2 pb-6 space-y-1 flex flex-col">
                        <div className="px-4 space-y-2 flex flex-col">
                            {!loading && user ? (
                                <>
                                    <div className="px-3 py-4 mb-2 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white flex items-center justify-center font-bold shadow-sm overflow-hidden shrink-0">
                                                {effectiveAvatar ? <img src={effectiveAvatar} alt="" className="w-full h-full object-cover" /> : initial}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-gray-900 truncate">{displayName || 'Entregador'}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Faturamento</p>
                                            <p className="text-sm font-black text-green-600">{formatPrice(totalEarned)}</p>
                                        </div>
                                    </div>
                                    <Link href="/entregador/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl">
                                        <LayoutDashboard className="w-5 h-5" /> Radar de Corridas
                                    </Link>
                                    <Link href="/entregador/carteira" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl">
                                        <Wallet className="w-5 h-5" /> Minha Carteira
                                    </Link>
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 text-left px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl mt-2 border-t border-gray-100">
                                        <LogOut className="w-5 h-5" /> Sair da conta
                                    </button>
                                </>
                            ) : (
                                <div className="pt-4 flex flex-col gap-3">
                                    <Link href="/entregador/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center px-4 py-3 text-base font-bold bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white rounded-xl shadow-md">
                                        Fazer Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}