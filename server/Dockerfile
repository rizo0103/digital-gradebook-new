FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Копируем исходный код и секретный ключ
COPY src ./src
COPY serviceAccountKey.json ./serviceAccountKey.json

ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]