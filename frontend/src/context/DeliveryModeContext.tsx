// src/context/DeliveryModeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export type DeliveryMode = 'MARKETPLACE' | 'FAST_DELIVERY';

type Location = {
  lat: number;
  lng: number;
} | null;

type DeliveryModeContextType = {
  mode: DeliveryMode;
  location: Location;
  isLocating: boolean;
  toggleMode: (targetMode: DeliveryMode) => void;
  setModeFallback: () => void; // Para forçar a volta caso não tenha lojas perto
};

const DeliveryModeContext = createContext<DeliveryModeContextType | undefined>(undefined);

export function DeliveryModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DeliveryMode>('MARKETPLACE');
  const [location, setLocation] = useState<Location>(null);
  const [isLocating, setIsLocating] = useState(false);

  const toggleMode = (targetMode: DeliveryMode) => {
    if (targetMode === 'MARKETPLACE') {
      setMode('MARKETPLACE');
      return;
    }

    // Se o cliente quer Entrega Rápida, precisamos do GPS
    if (targetMode === 'FAST_DELIVERY') {
      if (!navigator.geolocation) {
        toast.error('Seu navegador não suporta geolocalização.');
        return;
      }

      setIsLocating(true);
      toast.loading('Buscando lojas perto de você...', { id: 'gps-toast' });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMode('FAST_DELIVERY');
          setIsLocating(false);
          toast.success('Localização encontrada!', { id: 'gps-toast' });
        },
        (error) => {
          console.error(error);
          setIsLocating(false);
          toast.error('Permissão de localização negada. Usando modo Marketplace.', { id: 'gps-toast' });
          setMode('MARKETPLACE');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const setModeFallback = () => {
    setMode('MARKETPLACE');
  };

  return (
    <DeliveryModeContext.Provider value={{ mode, location, isLocating, toggleMode, setModeFallback }}>
      {children}
    </DeliveryModeContext.Provider>
  );
}

export function useDeliveryMode() {
  const context = useContext(DeliveryModeContext);
  if (!context) {
    throw new Error('useDeliveryMode deve ser usado dentro de um DeliveryModeProvider');
  }
  return context;
}