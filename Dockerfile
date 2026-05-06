# build
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:aws

# runtime
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/toxic-bet-fe ./dist/toxic-bet-fe

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD node -e "require('node:http').get('http://127.0.0.1:' + (process.env.PORT || 4000) + '/healthz', r => process.exit(r.statusCode === 204 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/toxic-bet-fe/server/server.mjs"]
