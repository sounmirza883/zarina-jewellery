import type { Metadata } from 'next';
import { getProducts } from '@/lib/api';
import WishlistGrid from '@/components/WishlistGrid';

// Personal page: keep it out of search results.
export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Your saved jewellery pieces.',
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const products = await getProducts();
  return <WishlistGrid products={products} />;
}
