import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.nautilusmoney.com';
  const now = new Date();

  return [
    { url: base,                                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/landingpage/features`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/landingpage/pricing`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/landingpage/about`,           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/landingpage/faq`,             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/landingpage/security`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/landingpage/signin`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/landingpage/signup`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/landingpage/privacy`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/landingpage/terms`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/landingpage/cookies`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
