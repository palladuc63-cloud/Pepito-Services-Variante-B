# Frontend Pépito Services — Astro SSR (adapter Node)
# Astro 7 requiert Node >= 22.12
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV API_INTERNAL_URL=http://backend:3002
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
