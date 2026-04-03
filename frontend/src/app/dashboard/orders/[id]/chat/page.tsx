'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Send, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Faz a tela rolar para a última mensagem automaticamente
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (authLoading || !user) return;

    // 1. Busca os detalhes básicos do pedido para o cabeçalho
    async function fetchOrderAndMessages() {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, status, short_id:id')
          .eq('id', params.id)
          .single();

        if (orderError) throw orderError;
        
        // Pega só o comecinho do ID pra ficar bonito
        const shortId = orderData.id.split('-')[0].toUpperCase();
        setOrderInfo({ ...orderData, shortId });

        // Busca o histórico de mensagens
        const { data: msgs, error: msgError } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', params.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);

      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar o chat.');
        router.push('/dashboard/orders');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderAndMessages();

    // 2. MAGIA: Inscreve o app para ouvir novas mensagens em TEMPO REAL!
    const channel = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `order_id=eq.${params.id}`,
        },
        (payload) => {
          // Quando alguém envia, adiciona a mensagem nova na tela na hora
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, params.id, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: params.id,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      
      // Limpa o campo após enviar (a mensagem vai aparecer via tempo real)
      setNewMessage('');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível enviar a mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#fa7109]" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col bg-gray-50/50 p-4 sm:p-6">
      
      {/* HEADER DO CHAT */}
      <div className="bg-white px-6 py-4 rounded-t-2xl border border-gray-200 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/orders/${params.id}`} className="text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Pedido #{orderInfo?.shortId}</h1>
            <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Chat Online
            </p>
          </div>
        </div>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white border-x border-gray-200 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
            <MessageCircle className="w-12 h-12 opacity-20" />
            <p>Nenhuma mensagem ainda. Envie um "Olá"!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMe 
                    ? 'bg-[#fa7109] text-white rounded-br-sm shadow-md shadow-orange-500/20' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Div invisível para o auto-scroll */}
      </div>

      {/* ÁREA DE DIGITAÇÃO */}
      <div className="bg-white p-4 rounded-b-2xl border border-gray-200 shadow-sm z-10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-100 border-transparent focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-3 outline-none transition-all"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-[#fa7109] hover:bg-[#e06300] text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px]"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

    </div>
  );
}