import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/landingpage/reset-password'],
      },
    ],
    sitemap: 'https://www.nautilusmoney.com/sitemap.xml',
  };
}
