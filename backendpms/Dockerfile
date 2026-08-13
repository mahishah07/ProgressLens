FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci

COPY backendpms ./backendpms
COPY config ./config

EXPOSE 5001

CMD ["node", "backendpms/server.js"]