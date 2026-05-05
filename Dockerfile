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

CMD ["node", "dist/toxic-bet-fe/server/server.mjs"]
