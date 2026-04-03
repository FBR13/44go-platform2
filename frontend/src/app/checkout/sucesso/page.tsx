import Link from 'next/link';

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = sp.ids ?? '';
  
  // Transforma o ID gigante em um código curto (Ex: #A3B9C2)
  const ids = raw.split(',')
                 .map((s) => s.trim().split('-')[0].toUpperCase())
                 .filter(Boolean);

  return (
    <div className="max-w-lg mx-auto text-center py-20 px-4 min-h-[70vh] flex flex-col items-center justify-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 text-4xl mb-6 shadow-sm ring-8 ring-green-50">
        ✓
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Pedido Confirmado! 🎉</h1>
      <p className="mt-2 text-gray-600 text-lg leading-relaxed">
        Seu pedido foi enviado para o lojista com sucesso. Em breve ele entrará em contato com você pelo WhatsApp para combinar a entrega.
      </p>
      
      {ids.length > 0 && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 w-full">
          <p className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wide">
            {ids.length === 1 ? 'Número do Pedido' : 'Números dos Pedidos'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {ids.map(id => (
              <span key={id} className="bg-white border border-gray-300 px-4 py-2 rounded-lg font-mono font-bold text-gray-800 shadow-sm text-lg">
                #{id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex justify-center py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-orange-500/20"
        >
          Acompanhar Pedido
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex justify-center py-3.5 px-8 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Continuar Comprando
        </Link>
      </div>
    </div>
  );
}