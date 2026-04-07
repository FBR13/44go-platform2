// src/components/GlobalNotificationManager.tsx
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function GlobalNotificationManager() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Coloque um arquivo de som chamado 'notify.mp3' dentro da sua pasta 'public'
        const audio = new Audio('/notify.mp3');

        const channel = supabase
            .channel('global_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `customer_id=eq.${user.id}`
                },
                (payload) => {
                    const status = payload.new.status;
                    const oldStatus = payload.old.status;

                    if (status !== oldStatus) {
                        // Toca o som (pode falhar se o usuário não tiver interagido com a tela ainda)
                        audio.play().catch(() => console.log("Áudio aguardando interação."));

                        const messages: Record<string, string> = {
                            paid: "Seu pagamento foi aprovado! 💳",
                            shipped: "O entregador saiu com seu pedido! 🚚",
                            delivered: "Pedido entregue! Avalie sua compra. ✅"
                        };

                        if (messages[status]) {
                            toast.info(messages[status], {
                                duration: 6000,
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    return null;
}