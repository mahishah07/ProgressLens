FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci

COPY gateway ./gateway
COPY config ./config

EXPOSE 5050

CMD ["node", "gateway/server.js"]