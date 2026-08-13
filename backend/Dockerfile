FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci

COPY backend ./backend
COPY config ./config

EXPOSE 5002

CMD ["node", "backend/src/server.js"]