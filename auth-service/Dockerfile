FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 8081

CMD ["sh", "-c", "node scripts/wait-for-db.js && node src/server.js"]