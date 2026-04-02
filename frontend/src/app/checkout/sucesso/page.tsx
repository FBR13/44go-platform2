import Link from 'next/link';

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = sp.ids ?? '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-700 text-3xl mb-6">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Pedido registrado!</h1>
      <p className="mt-3 text-gray-600">
        Seu pedido foi enviado para o lojista. Você pode acompanhar o status no
        painel quando essa área estiver disponível.
      </p>
      {ids.length > 0 && (
        <p className="mt-6 text-xs text-gray-500 font-mono break-all">
          {ids.length === 1
            ? `Pedido: ${ids[0]}`
            : `Pedidos: ${ids.join(', ')}`}
        </p>
      )}
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/products"
          className="inline-flex justify-center py-3 px-6 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-medium hover:opacity-95"
        >
          Continuar comprando
        </Link>
        <Link
          href="/"
          className="inline-flex justify-center py-3 px-6 rounded-xl border border-gray-300 font-medium text-gray-800 hover:bg-gray-50"
        >
          Ir para início
        </Link>
      </div>
    </div>
  );
}
