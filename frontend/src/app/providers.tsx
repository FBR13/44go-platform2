'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { DeliveryModeProvider } from '@/context/DeliveryModeContext'; // 👈 Importamos o Contexto
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="linear-gradient(to right, #fa7109, #ab0029)"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #fa7109,0 0 5px #fa7109"
      />

      <AuthProvider>
        <DeliveryModeProvider> {/* 👈 Envelopamos a aplicação aqui */}
          <CartProvider>
            {children}
          </CartProvider>
        </DeliveryModeProvider>
      </AuthProvider>
    </>
  );
}