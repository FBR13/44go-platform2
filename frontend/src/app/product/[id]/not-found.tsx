import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="max-w-lg mx-auto text-center py-20 px-4">
      <h1 className="text-2xl font-bold text-gray-900">Produto não encontrado</h1>
      <p className="mt-2 text-gray-600">
        Esse item não existe ou foi removido.
      </p>
      <Link
        href="/products"
        className="inline-block mt-8 text-[#fa7109] hover:underline font-medium"
      >
        ← Ir para produtos
      </Link>
    </div>
  );
}
