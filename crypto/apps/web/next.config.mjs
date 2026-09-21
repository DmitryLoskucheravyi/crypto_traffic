/** @type {import('next').NextConfig} */
const nextConfig = {
  // Лендинг целиком статический: ни одного серверного запроса, весь контент
  // лежит в app/lib/site-data.ts и запекается в HTML на сборке. На выходе —
  // каталог out/, который раздаёт любой nginx без Node-процесса рядом.
  output: 'export',
  // Оптимизатор картинок — это серверная ручка, которой в статике нет.
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
