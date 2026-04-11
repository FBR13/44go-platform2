import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useTracking(orderId: string, isOnline: boolean) {
  useEffect(() => {
    if (!orderId || !isOnline) return;

    const channel = supabase.channel(`tracking:${orderId}`);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading, 
          speed: pos.coords.speed
        };

        channel.send({
          type: 'broadcast',
          event: 'location',
          payload: coords,
        });
      },
      (err) => console.error('Erro GPS:', err),
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 5000 
      } 
    );

    channel.subscribe();

    return () => {
      navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
    };
  }, [orderId, isOnline]);
}