'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, X, Send, ArrowLeft, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export function FloatingChat() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  
  // Estados da Lista de Chats
  const [chatList, setChatList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Estados do Chat Ativo
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Ouvinte Global: Permite abrir o chat de qualquer botão do site
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      if (e.detail?.orderId) {
        setActiveOrderId(e.detail.orderId);
      }
    };
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // 2. Busca a lista de todos os pedidos (compras e vendas)
  useEffect(() => {
    if (!isOpen || activeOrderId || !user) return;
    
    async function fetchChatList() {
      setIsLoadingList(true);
      try {
        // Pega todos os pedidos que o usuário tem acesso (RLS já filtra compras e vendas)
        const { data, error } = await supabase
          .from('orders')
          .select('id, status, created_at, customer_id')
          .neq('status', 'cart')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setChatList(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingList(false);
      }
    }
    fetchChatList();
  }, [isOpen, activeOrderId, user]);

  // 3. Gerencia o Chat Ativo (Mensagens em Tempo Real)
  useEffect(() => {
    if (!activeOrderId || !user) return;

    async function fetchMessages() {
      const { data } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', activeOrderId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      scrollToBottom();
    }
    fetchMessages();

    const channel = supabase
      .channel(`floating-chat-${activeOrderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${activeOrderId}` },
        (payload) => {
          setMessages((current) => {
            if (current.find(m => m.id === payload.new.id)) return current;
            return [...current, payload.new];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeOrderId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeOrderId) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({ order_id: activeOrderId, sender_id: user.id, content: newMessage.trim() });
      
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  // Se não estiver logado, não mostra a bolinha
  if (authLoading || !user) return null;

  return (
    <>
      {/* BOLINHA FLUTUANTE (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* JANELA DO CHAT */}
      <div className={`fixed bottom-6 right-6 z-50 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* HEADER DA JANELA */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            {activeOrderId && (
              <button onClick={() => setActiveOrderId(null)} className="hover:bg-gray-800 p-1 rounded-md transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="font-bold text-sm">
                {activeOrderId ? `Pedido #${activeOrderId.split('-')[0].toUpperCase()}` : 'Meus Chats'}
              </h3>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-gray-800 p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DA JANELA: LISTA OU CHAT */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          
          {/* TELA 1: LISTA DE PEDIDOS */}
          {!activeOrderId && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {isLoadingList ? (
                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-[#fa7109]" /></div>
              ) : chatList.length === 0 ? (
                <div className="text-center p-10 text-gray-500 text-sm">Nenhum chat disponível ainda.</div>
              ) : (
                chatList.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveOrderId(chat.id)}
                    className="w-full bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#fa7109] shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">Pedido #{chat.id.split('-')[0].toUpperCase()}</p>
                      <p className="text-xs text-gray-500 truncate">{chat.customer_id === user.id ? 'Minha Compra' : 'Minha Venda'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* TELA 2: CHAT ATIVO */}
          {activeOrderId && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 mt-10">Envie a primeira mensagem!</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-[#fa7109] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
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

              {/* INPUT DE MENSAGEM */}
              <div className="bg-white p-3 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mensagem..."
                    className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 rounded-full px-4 py-2 text-sm outline-none transition-all"
                    disabled={isSending}
                  />
                  <button type="submit" disabled={!newMessage.trim() || isSending} className="bg-[#fa7109] text-white p-2 rounded-full disabled:opacity-50 transition-colors">
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