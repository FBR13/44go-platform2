'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, X, Send, ArrowLeft, Loader2, Package, Bike, Store, User } from 'lucide-react';
import { toast } from 'sonner';

export function FloatingChat() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>('customer_store'); // Canal padrão

  const [chatList, setChatList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Ouvinte Global: Recebe a ordem E o canal (aba) desejada
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      if (e.detail?.orderId) {
        setActiveOrderId(e.detail.orderId);
      }
      // Se vier um canal específico (ex: 'courier_store'), ele muda a aba na hora
      if (e.detail?.channel) {
        setActiveChannel(e.detail.channel);
      }
    };
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // 2. Gerencia as mensagens em tempo real filtrando pelo canal
  useEffect(() => {
    if (!activeOrderId || !user) return;

    async function fetchMessages() {
      const { data } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', activeOrderId)
        .eq('channel_type', activeChannel) // FILTRO DE PRIVACIDADE NÍVEL IFOOD
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    }
    fetchMessages();

    const channel = supabase
      .channel(`chat-${activeOrderId}-${activeChannel}`)
      .on('postgres_changes',
        {
          event: 'INSERT', schema: 'public', table: 'order_messages',
          filter: `order_id=eq.${activeOrderId}`
        },
        (payload) => {
          // Só adiciona se a mensagem for para este canal específico
          if (payload.new.channel_type === activeChannel) {
            setMessages((current) => [...current, payload.new]);
            setTimeout(scrollToBottom, 100);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeOrderId, activeChannel, user]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeOrderId) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: activeOrderId,
          sender_id: user.id,
          content: newMessage.trim(),
          channel_type: activeChannel // Salva no canal correto
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      toast.error('Erro ao enviar.');
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      <div className={`fixed bottom-6 right-6 z-50 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>

        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-4 flex flex-col gap-2 shadow-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeOrderId && (
                <button onClick={() => setActiveOrderId(null)} className="hover:bg-white/10 p-1 rounded-md transition-colors text-gray-400">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <h3 className="font-bold text-sm">
                {activeOrderId ? `Pedido #${activeOrderId.split('-')[0].toUpperCase()}` : 'Meus Chats'}
              </h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-md transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* ABAS ESTILO IFOOD (Apenas se houver um pedido aberto) */}
          {activeOrderId && (
            <div className="flex bg-white/10 p-1 rounded-lg">
              <button
                onClick={() => setActiveChannel('customer_store')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeChannel === 'customer_store' ? 'bg-[#fa7109] text-white' : 'text-gray-400'}`}
              >
                <Store className="w-3 h-3" /> LOJA/CLIENTE
              </button>
              <button
                onClick={() => setActiveChannel('courier_store')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeChannel === 'courier_store' ? 'bg-[#fa7109] text-white' : 'text-gray-400'}`}
              >
                <Bike className="w-3 h-3" /> LOJA/ENTREGADOR
              </button>
              <button
                onClick={() => setActiveChannel('courier_customer')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeChannel === 'courier_customer' ? 'bg-[#fa7109] text-white' : 'text-gray-400'}`}
              >
                <User className="w-3 h-3" /> CLIENTE/ENTR.
              </button>
            </div>
          )}
        </div>

        {/* CORPO DO CHAT (Igual antes, mas agora filtrado pela 'activeChannel') */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          {!activeOrderId ? (
            <div className="p-4 text-center text-gray-500 text-sm">Selecione um pedido para conversar.</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-[11px] text-gray-400 mt-10 uppercase tracking-widest font-bold">Início da conversa privada</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-[#fa7109] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <span className={`text-[9px] mt-1 block text-right ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white p-3 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Diga algo..."
                    className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-[#fa7109] rounded-full px-4 py-2 text-sm outline-none transition-all"
                    disabled={isSending}
                  />
                  <button type="submit" disabled={!newMessage.trim() || isSending} className="bg-[#fa7109] text-white p-2 rounded-full disabled:opacity-50">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}