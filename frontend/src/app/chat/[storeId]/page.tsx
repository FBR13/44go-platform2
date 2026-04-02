import Link from 'next/link';

type Props = { params: Promise<{ storeId: string }> };

export default async function ChatPlaceholderPage({ params }: Props) {
  const { storeId } = await params;
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <h1 className="text-lg font-semibold text-gray-900">Chat com a loja</h1>
      <p className="text-sm text-gray-500 mt-2">
        Loja: <span className="font-mono text-xs">{storeId}</span>
      </p>
      <p className="mt-6 text-gray-600 text-sm">
        O chat em tempo real será habilitado em uma etapa futura do projeto.
      </p>
      <Link
        href={`/store/${storeId}`}
        className="inline-block mt-8 text-[#fa7109] hover:underline font-medium text-sm"
      >
        ← Voltar à loja
      </Link>
    </div>
  );
}
