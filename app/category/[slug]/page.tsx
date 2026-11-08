import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductsByCategory, getCategories } from '@/lib/api';
import { ProductCategory } from '@/types/product';
import ShopCatalog from '@/components/ShopCatalog';
import { siteConfig } from '@/config/site';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} | ${siteConfig.name}`,
    description: `${category.description} Cash on Delivery available across Pakistan on all ${category.name.toLowerCase()}.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(category.id as ProductCategory);

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#B8893B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs tracking-wider uppercase text-[#575757]">Loading {category.name}...</p>
        </div>
      }
    >
      <ShopCatalog
        initialProducts={products}
        defaultCategory={category.id as ProductCategory}
        showCategoryNav
        pageTitle={category.name}
        pageSubtitle={category.description}
      />
    </Suspense>
  );
}
