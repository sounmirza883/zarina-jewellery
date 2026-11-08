import { siteConfig } from '@/config/site';
import { activeVariants, isPurchasable, variantPrice } from '@/lib/pricing';
import type { Product, Review } from '@/types/product';

/** JSON for a <script type="application/ld+json"> tag. `<` is escaped so text from the admin or from reviews cannot close the tag. */
export function jsonLdScript(obj: object): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export function buildProductJsonLd(product: Product, reviews: Review[], baseUrl: string): object {
  const url = `${baseUrl}/product/${product.slug}`;
  const variants = activeVariants(product);
  const prices = variants.map(variantPrice);
  const low = prices.length > 0 ? Math.min(...prices) : product.price;
  const high = prices.length > 0 ? Math.max(...prices) : product.price;
  const availability = isPurchasable(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const offers =
    low !== high
      ? { '@type': 'AggregateOffer', url, priceCurrency: 'PKR', lowPrice: low, highPrice: high, offerCount: prices.length, availability }
      : { '@type': 'Offer', url, priceCurrency: 'PKR', price: low, availability, itemCondition: 'https://schema.org/NewCondition' };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.shortDescription || product.description,
    sku: variants[0]?.sku ?? product.id,
    brand: { '@type': 'Brand', name: siteConfig.name },
    keywords: product.metaKeywords.length > 0 ? product.metaKeywords.join(', ') : undefined,
    additionalProperty:
      product.attributes.length > 0
        ? product.attributes.map((a) => ({ '@type': 'PropertyValue', name: a.name, value: a.value }))
        : undefined,
    offers,
    aggregateRating:
      product.ratingCount > 0
        ? { '@type': 'AggregateRating', ratingValue: product.ratingAvg, reviewCount: product.ratingCount, bestRating: 5 }
        : undefined,
    review:
      reviews.length > 0
        ? reviews.slice(0, 10).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            author: { '@type': 'Person', name: r.authorName },
            name: r.title || undefined,
            reviewBody: r.body,
            datePublished: r.createdAt,
          }))
        : undefined,
  };
}
