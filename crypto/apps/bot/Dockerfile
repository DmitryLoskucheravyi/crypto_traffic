FROM node:20-alpine AS build
WORKDIR /app
COPY apps/bot/package.json ./
COPY apps/bot/prisma ./prisma
RUN npm install
COPY apps/bot/tsconfig.json apps/bot/tsconfig.build.json apps/bot/nest-cli.json ./
COPY apps/bot/src ./src
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY apps/bot/package.json ./
COPY apps/bot/prisma ./prisma
RUN npm install --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 3033
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
