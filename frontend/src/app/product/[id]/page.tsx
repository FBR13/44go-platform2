import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import type { ProductDetailPayload } from '@/components/product/ProductDetailClient';

async function getProduct(id: string): Promise<ProductDetailPayload | null> {
  try {
    const res = await fetch(apiUrl(`/products/${id}`), {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<ProductDetailPayload>;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: 'Produto | 44Go' };
  }
  return {
    title: `${product.name} | 44Go`,
    description: product.description ?? `Compre ${product.name} no 44Go.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ProductDetailClient product={product} />
    </div>
  );
}
