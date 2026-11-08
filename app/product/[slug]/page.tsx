import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug, getProducts, getRelatedProducts } from '@/lib/api';
import { getApprovedReviews } from '@/lib/reviews-api';
import { buildProductJsonLd, jsonLdScript } from '@/lib/seo';
import ProductDetailClient from '@/components/ProductDetailClient';
import { siteConfig } from '@/config/site';

const BASE_URL = 'https://zarinajewels.pk';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const description = product.metaDescription || product.shortDescription || product.description;
  const ogImage = product.ogImage || product.images[0];

  return {
    // A custom meta title is used as written; otherwise the layout template appends the site name.
    title: product.metaTitle ? { absolute: product.metaTitle } : product.name,
    description,
    keywords: product.metaKeywords.length > 0 ? product.metaKeywords : undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.metaTitle || `${product.name} | ${siteConfig.name}`,
      description,
      url: `${BASE_URL}/product/${product.slug}`,
      images: ogImage ? [{ url: ogImage, width: 800, height: 1000, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.category, 4),
    getApprovedReviews(product.id),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildProductJsonLd(product, reviews, BASE_URL)) }}
      />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews}
      />
    </>
  );
}
