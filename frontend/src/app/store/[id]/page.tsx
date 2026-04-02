import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle, Package, Store as StoreIcon } from 'lucide-react';
import { apiUrl } from '@/lib/api';

type StoreProduct = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
};

type StoreDetail = {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  image_url: string | null;
  products: StoreProduct[];
};

async function getStore(id: string): Promise<StoreDetail | null> {
  try {
    const res = await fetch(apiUrl(`/stores/${id}`), {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<StoreDetail>;
  } catch {
    return null;
  }
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(n));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = await getStore(id);
  if (!store) {
    return { title: 'Loja não encontrada | 44Go' };
  }
  return {
    title: `${store.name} | 44Go`,
    description: store.description ?? `Produtos da loja ${store.name} no 44Go.`,
  };
}

export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = await getStore(id);

  if (!store) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <section className="relative -mx-4 sm:mx-0 rounded-none sm:rounded-xl overflow-hidden border border-gray-200 bg-gray-100 min-h-[160px] sm:min-h-[200px]">
        {store.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.banner_url}
            alt=""
            className="w-full h-full min-h-[160px] sm:min-h-[200px] object-cover"
          />
        ) : (
          <div className="min-h-[160px] sm:min-h-[200px] bg-gradient-to-r from-[#fa7109]/20 to-[#ab0029]/25 flex items-center justify-center">
            <StoreIcon className="w-16 h-16 text-gray-400/80" strokeWidth={1.25} />
          </div>
        )}
      </section>

      <div className="relative -mt-12 sm:-mt-14 px-0 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          <div className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden mx-auto sm:mx-0">
            {store.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <StoreIcon className="w-14 h-14" strokeWidth={1.25} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left pb-2 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {store.name}
            </h1>
            {store.description && (
              <p className="mt-2 text-gray-600 max-w-3xl mx-auto sm:mx-0 whitespace-pre-wrap">
                {store.description}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3 justify-center sm:justify-start">
              <Link
                href={`/chat/${store.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-sm font-medium hover:opacity-95 transition-opacity shadow-sm"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
                Conversar com lojista
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Ver todos os produtos
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Produtos desta loja
        </h2>

        {store.products.length === 0 ? (
          <div className="text-center py-14 rounded-xl border border-dashed border-gray-300 bg-gray-50/60">
            <Package className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Esta loja ainda não publicou produtos.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {store.products.map((p) => (
              <li key={p.id}>
                <article className="group h-full flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Package
                          className="w-14 h-14 opacity-40"
                          strokeWidth={1.25}
                        />
                      </div>
                    )}
                    {p.category && (
                      <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-white/90 text-gray-700 shadow-sm">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-10">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#fa7109] to-[#ab0029]">
                      {formatPrice(p.price)}
                    </p>
                    <div className="mt-auto pt-4">
                      <Link
                        href={`/product/${p.id}`}
                        className="block w-full text-center py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Ver produto
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
