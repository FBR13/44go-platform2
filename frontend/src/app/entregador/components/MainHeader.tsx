'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header'; // <-- Ajustado! Puxa lá da pasta global de componentes
import { CourierHeader } from './CourierHeader'; // <-- Como os dois estão na mesma pasta do entregador, o ./ funciona!

export function MainHeader() {
  const pathname = usePathname();

  // Se a rota começar com /entregador, exibe a barra da Moto e Ganhos
  if (pathname?.startsWith('/entregador')) {
    return <CourierHeader />;
  }

  // Se for cliente/loja normal, exibe a barra original com carrinho e busca
  return <Header />;
}