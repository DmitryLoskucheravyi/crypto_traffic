import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/config';

export const dynamic = 'force-static';

// Лендинг — одна страница, поэтому карта сайта состоит из неё одной. Смысл
// файла не в объёме, а в том, что робот получает канонический адрес с нужным
// хостом и не тратит обход на варианты со слешем и без.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
