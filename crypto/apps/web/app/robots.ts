import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/config';

// Next кладёт готовый /robots.txt в out/ прямо на сборке — серверная ручка для
// этого не нужна, статике достаточно файла.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Чанки Next закрывать нельзя: без JS и CSS Google рендерит страницу
      // сломанной и занижает её. Закрываем только служебный RSC-дамп, который
      // дублирует текст страницы и в выдаче не нужен.
      disallow: ['/index.txt'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
