// D:\.Documentos\.Projeto\44go-platform\frontend\src\app\layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { MainHeader } from './entregador/components/MainHeader';
import { Toaster } from 'sonner';
import { FloatingChat } from '@/components/FloatingChat';
import { GlobalNotificationManager } from '@/components/GlobalNotificationManager';
import { CartDrawer } from '@/components/cart/CartDrawer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '44Go - Marketplace Local',
  description: 'A sua plataforma de delivery local.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {/* Gerenciador de notificações em tempo real */}
          <GlobalNotificationManager />

          {/* 👇 A MÁGICA ACONTECE AQUI:
              O CartDrawer fica fora do <main>, garantindo que ele cubra 
              a tela toda (z-index) quando for aberto de qualquer lugar! 
          */}
          <CartDrawer />

          {/* Header que alterna entre Loja/Entregador */}
          <MainHeader />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <Toaster
            position="bottom-right"
            offset="32px"
            closeButton
            toastOptions={{
              classNames: {
                toast: 'bg-white border border-gray-100 shadow-xl rounded-2xl p-4 flex items-start gap-3',
                title: 'text-gray-900 font-bold text-sm',
                description: 'text-gray-500 text-sm',
                success: 'bg-green-50 border border-green-100 text-green-800',
                error: 'bg-red-50 border border-red-100 text-red-700',
                info: 'bg-orange-50 border border-orange-100 text-[#fa7109]',
                closeButton: 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                actionButton: 'bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-medium rounded-lg px-3 py-1.5',
              }
            }}
          />

          <FloatingChat />
        </Providers>
      </body>
    </html>
  );
}