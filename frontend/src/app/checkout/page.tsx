'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { apiUrl } from '@/lib/api';

function parseApiError(json: Record<string, unknown>, fallback: string): string {
  const m = json.message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m)) return m.map(String).join(', ');
  if (typeof json.error === 'string') return json.error;
  return fallback;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (lines.length === 0) {
      router.replace('/cart');
    }
  }, [authLoading, user, lines.length, router]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(n));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sessão expirada. Entre novamente.');
        setSubmitting(false);
        return;
      }

      const body = {
        items: lines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          size: l.size,
        })),
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: stateUf.trim(),
        zip_code: zipCode.trim(),
      };

      const res = await fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!res.ok) {
        throw new Error(
          parseApiError(json, 'Não foi possível criar o pedido.'),
        );
      }

      const orders = json.orders as Array<{ id: string }> | undefined;
      const ids = orders?.map((o) => o.id).join(',') ?? '';
      clear();
      router.push(
        `/checkout/sucesso?ids=${encodeURIComponent(ids)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao finalizar o pedido.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 text-gray-500">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 text-gray-500">
        Redirecionando para o login…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 text-gray-500">
        Redirecionando ao carrinho…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
        Finalizar pedido
      </h1>
      <p className="text-gray-600 text-sm mb-8">
        Preencha o endereço e a forma de entrega. O pagamento é simulado nesta
        versão.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="lg:col-span-2 space-y-6"
        >
          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
              {error}
            </div>
          )}

          <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5 bg-white">
            <legend className="text-sm font-semibold text-gray-900 px-1">
              Endereço de entrega
            </legend>
            <div>
              <label
                htmlFor="addr1"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Logradouro e número
              </label>
              <input
                id="addr1"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none"
                placeholder="Rua, número, complemento"
              />
            </div>
            <div>
              <label
                htmlFor="addr2"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Complemento (opcional)
              </label>
              <input
                id="addr2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none"
                placeholder="Apto, bloco, referência"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cidade
                </label>
                <input
                  id="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="uf"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  UF
                </label>
                <input
                  id="uf"
                  required
                  maxLength={2}
                  value={stateUf}
                  onChange={(e) =>
                    setStateUf(e.target.value.toUpperCase().slice(0, 2))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none uppercase"
                  placeholder="SP"
                />
              </div>
              <div>
                <label
                  htmlFor="cep"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CEP
                </label>
                <input
                  id="cep"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5 bg-white">
            <legend className="text-sm font-semibold text-gray-900 px-1">
              Entrega
            </legend>
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none"
            >
              <option value="delivery">Entrega no endereço</option>
              <option value="pickup">Retirada na loja</option>
            </select>
          </fieldset>

          <fieldset className="space-y-4 border border-gray-200 rounded-xl p-5 bg-white">
            <legend className="text-sm font-semibold text-gray-900 px-1">
              Pagamento (simulado)
            </legend>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#fa7109]/30 focus:border-[#fa7109] outline-none"
            >
              <option value="pix">PIX</option>
              <option value="card">Cartão</option>
              <option value="cash">Dinheiro na entrega</option>
            </select>
          </fieldset>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/cart"
              className="text-center py-3 px-5 rounded-xl border border-gray-300 font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Voltar ao carrinho
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Processando…' : 'Confirmar pedido'}
            </button>
          </div>
        </form>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 border border-gray-200 rounded-xl p-5 bg-gray-50/80">
            <h2 className="font-semibold text-gray-900 mb-3">Resumo</h2>
            <ul className="text-sm text-gray-600 space-y-2 mb-4 max-h-48 overflow-y-auto">
              {lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-2">
                  <span className="truncate">
                    {l.quantity}× {l.name}
                    {l.size ? ` (${l.size})` : ''}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
              Total {formatPrice(subtotal)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
