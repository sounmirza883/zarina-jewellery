import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/order-success', '/checkout'],
    },
    sitemap: 'https://zarinajewels.pk/sitemap.xml',
  };
}
