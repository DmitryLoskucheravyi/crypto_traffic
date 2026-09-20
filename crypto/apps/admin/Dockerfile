FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3031
ARG NEXT_PUBLIC_BOT_API_URL=http://localhost:3033
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BOT_API_URL=${NEXT_PUBLIC_BOT_API_URL}
COPY apps/admin/package.json ./
RUN npm install
COPY apps/admin/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3032
ENV PORT=3032
CMD ["node", "server.js"]
