# Лендинг статический: next build кладёт готовый сайт в out/, и дальше нужен
# только веб-сервер. Node в рантайме нет вообще.
FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web/package.json ./
RUN npm install
COPY apps/web/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
