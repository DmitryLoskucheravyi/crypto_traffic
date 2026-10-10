# Зависимости ставятся по корневому package-lock.json монорепо: образ получает
# ровно те версии, что прошли CI, а не свежие из диапазонов package.json.
# npm ci сверяет lockfile со всеми воркспейсами, поэтому package.json веба тоже
# нужен, но --workspace ставит только зависимости бота.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --ignore-scripts --no-audit --no-fund
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src
RUN npm run build --workspace apps/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --omit=dev --ignore-scripts --no-audit --no-fund \
  && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
# Рабочий каталог — /app: относительные пути COURSE_MATERIAL_* ("materials/…")
# считаются от него, туда же docker-compose монтирует ./materials.
EXPOSE 3031
CMD ["node", "apps/api/dist/main.js"]
