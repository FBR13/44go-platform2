import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner'; // 1. Importar o Toaster da sonner

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
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          {/* 2. Adicionar o componente Toaster aqui */}
          {/* richColors: deixa as cores de erro/sucesso bem vivas */}
          {/* closeButton: adiciona o 'X' para fechar manualmente */}
          {/* position: onde ele vai aparecer (ex: topo-direita) */}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}