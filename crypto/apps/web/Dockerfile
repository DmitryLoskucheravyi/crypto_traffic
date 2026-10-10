# Лендинг статический: next build кладёт готовый сайт в out/, и дальше нужен
# только веб-сервер. Node в рантайме нет вообще.
FROM node:20-alpine AS build
WORKDIR /app
# Публичный адрес сайта подставляется на сборке: canonical, sitemap.xml,
# robots.txt и og:image обязаны быть абсолютными, а статика не узнает хост в
# рантайме. Значение приезжает из .env через build args в docker-compose.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Ссылки в футере тоже запекаются на сборке: поменяли имя — нужен
# docker compose build web, простого restart не хватит.
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ARG NEXT_PUBLIC_TELEGRAM_CHANNEL_USERNAME
ENV NEXT_PUBLIC_TELEGRAM_CHANNEL_USERNAME=$NEXT_PUBLIC_TELEGRAM_CHANNEL_USERNAME
ARG NEXT_PUBLIC_INSTAGRAM_USERNAME
ENV NEXT_PUBLIC_INSTAGRAM_USERNAME=$NEXT_PUBLIC_INSTAGRAM_USERNAME
# Зависимости — по корневому package-lock.json, как в CI (см. apps/api/Dockerfile).
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace apps/web --ignore-scripts --no-audit --no-fund
COPY apps/web/ apps/web/
RUN npm run build --workspace apps/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/out /usr/share/nginx/html
EXPOSE 80
