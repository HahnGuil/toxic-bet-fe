# build
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:aws

# runtime (server simples)
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist/toxic-bet-fe/browser ./dist

EXPOSE 4000

CMD ["serve", "-s", "dist", "-l", "4000"]
