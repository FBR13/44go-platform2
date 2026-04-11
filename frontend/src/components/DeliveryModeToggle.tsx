// src/components/DeliveryModeToggle.tsx
'use client';

import { useDeliveryMode } from '@/context/DeliveryModeContext';
import { Bike, Store } from 'lucide-react';

export function DeliveryModeToggle() {
  const { mode, toggleMode, isLocating } = useDeliveryMode();

  return (
    <div className="bg-gray-100 p-1 rounded-full flex items-center shadow-inner relative w-[320px] max-w-full mx-auto">
      {/* O fundo laranja que desliza */}
      <div 
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-md transition-all duration-300 ease-out flex items-center justify-center border border-gray-200 z-0 ${
          mode === 'FAST_DELIVERY' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
        }`}
      />

      <button
        onClick={() => toggleMode('MARKETPLACE')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold z-10 transition-colors ${
          mode === 'MARKETPLACE' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Store size={18} className={mode === 'MARKETPLACE' ? 'text-[#fa7109]' : ''} />
        Shopping 44
      </button>

      <button
        onClick={() => toggleMode('FAST_DELIVERY')}
        disabled={isLocating}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold z-10 transition-colors ${
          mode === 'FAST_DELIVERY' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
        } ${isLocating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLocating ? (
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fa7109]"></span>
        ) : (
          <Bike size={18} className={mode === 'FAST_DELIVERY' ? 'text-[#fa7109]' : ''} />
        )}
        Entrega Rápida
      </button>
    </div>
  );
}