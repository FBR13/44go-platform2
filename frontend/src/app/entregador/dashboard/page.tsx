'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type ActiveOffer = {
    id: string;
    order_id: string;
    score: number;
    offered_at: string;
};

export default function CourierDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    const [isOnline, setIsOnline] = useState(false);
    const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isResponding, setIsResponding] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 1. RASTREIO DE GPS (Só funciona se estiver Online)
    useEffect(() => {
        if (!user || !isOnline) return;

        const watchId = navigator.geolocation.watchPosition(
            async (pos) => {
                // Atualiza a localização no PostGIS para o backend achar ele
                await supabase.from('courier_profiles').upsert({
                    id: user.id,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    is_online: true,
                });
            },
            (err) => {
                toast.error('Precisamos do seu GPS para você receber corridas!');
                setIsOnline(false);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            // Fica offline ao fechar o app
            supabase.from('courier_profiles').update({ is_online: false }).eq('id', user.id);
        };
    }, [user, isOnline]);

    // 2. WEBSOCKETS (Escutando a tabela de ofertas em Tempo Real)
    useEffect(() => {
        if (!user || !isOnline) return;

        const channel = supabase
            .channel('ofertas_radar')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'dispatch_attempts',
                    filter: `courier_id=eq.${user.id}` // Escuta SÓ AS DELE
                },
                (payload) => {
                    if (payload.new.status === 'pending') {
                        setActiveOffer(payload.new as ActiveOffer);
                        setTimeLeft(30); // Reseta o timer

                        // Opcional: Tocar som (se o browser permitir)
                        if (audioRef.current) audioRef.current.play().catch(e => console.log('Autoplay bloqueado', e));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'dispatch_attempts',
                    filter: `id=eq.${activeOffer?.id}`
                },
                (payload) => {
                    // Se o backend deu timeout, remove a tela da frente dele
                    if (payload.new.status === 'timeout') {
                        setActiveOffer(null);
                        toast.error('O tempo esgotou! A corrida foi passada adiante.');
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, isOnline, activeOffer]);

    // 3. TIMER DA OFERTA (Contagem Regressiva Visual)
    useEffect(() => {
        if (!activeOffer) return;
        if (timeLeft <= 0) return;

        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [activeOffer, timeLeft]);


    // 4. RESPONDENDO AO BACKEND (NestJS)
    const handleResponse = async (action: 'accept' | 'reject') => {
        if (!activeOffer || !user) return;
        setIsResponding(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
            const res = await fetch(`${API_URL}/dispatch/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId: activeOffer.id,
                    courierId: user.id,
                    action: action
                })
            });

            const data = await res.json();

            setActiveOffer(null);
            if (audioRef.current) audioRef.current.pause();

            if (data.success && action === 'accept') {
                toast.success(data.message);
                router.push(`/entregador/corrida/${activeOffer.order_id}`); // Redireciona pra tela de mapa da corrida
            } else if (!data.success) {
                toast.error(data.message);
            }

        } catch (err) {
            toast.error('Erro de conexão ao responder.');
        } finally {
            setIsResponding(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-[80vh] flex flex-col pt-8 relative">
            {/* Audio oculto para o toque de nova corrida */}
            <audio ref={audioRef} src="/sounds/nova-corrida.mp3" loop />

            {/* OVERLAY DE OFERTA EXCLUSIVA (Só aparece quando toca) */}
            {activeOffer && (
                <div className="absolute inset-0 z-50 bg-gray-900 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in slide-in-from-bottom-10">
                    <div className="absolute top-10">
                        <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                            Nova Corrida Exclusiva!
                        </span>
                    </div>

                    {/* O Circulo com o Timer */}
                    <div className="relative w-48 h-48 rounded-full border-8 border-gray-800 flex items-center justify-center mb-8 bg-gray-800/50">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="88" cy="88" r="80"
                                fill="none"
                                stroke={timeLeft > 10 ? "#fa7109" : "#ef4444"}
                                strokeWidth="8"
                                strokeDasharray="502" // 2 * PI * R
                                strokeDashoffset={502 - (502 * timeLeft) / 30}
                                className="transition-all duration-1000 linear"
                            />
                        </svg>
                        <div className="text-center">
                            <p className="text-6xl font-black text-white">{timeLeft}</p>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Segundos</p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2">Shopping 44</h2>
                    <p className="text-gray-400 font-medium mb-12 flex items-center gap-2">
                        <Navigation className="w-4 h-4" /> Pagamento na conta: R$ 8,00
                    </p>

                    <div className="w-full flex gap-4">
                        <button
                            onClick={() => handleResponse('reject')}
                            disabled={isResponding}
                            className="flex-1 bg-gray-800 text-white font-black py-5 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 border border-gray-700 hover:bg-red-500 hover:border-red-500"
                        >
                            <XCircle className="w-6 h-6" /> RECUSAR
                        </button>
                        <button
                            onClick={() => handleResponse('accept')}
                            disabled={isResponding}
                            className="flex-1 bg-[#fa7109] text-white font-black py-5 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(250,113,9,0.3)]"
                        >
                            <CheckCircle className="w-6 h-6" /> ACEITAR
                        </button>
                    </div>
                </div>
            )}

            {/* TELA PADRÃO DO RADAR */}
            {!activeOffer && (
                <>
                    <div className="flex justify-between items-center mb-8 px-2">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Seu Radar</h1>
                            <p className="text-gray-500 font-medium text-sm">Atualizando sua localização em tempo real.</p>
                        </div>

                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`w-16 h-8 rounded-full relative transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${isOnline ? 'left-[36px]' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex-1 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                        {/* Animação do Radar de Fundo */}
                        {isOnline && (
                            <>
                                <div className="absolute w-[400px] h-[400px] bg-green-500/5 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                <div className="absolute w-[250px] h-[250px] bg-green-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] delay-75"></div>
                            </>
                        )}

                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-xl transition-colors duration-500 ${isOnline ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-100'}`}>
                            <Zap className={`w-12 h-12 ${isOnline ? 'text-white' : 'text-gray-400'}`} />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 mb-2">{isOnline ? 'Você está Online!' : 'Você está Offline'}</h2>
                        <p className="text-gray-500 font-medium">
                            {isOnline ? 'Procurando as melhores corridas perto de você...' : 'Fique online para começar a receber corridas.'}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}