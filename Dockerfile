FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY client/ ./client/

EXPOSE 3000

CMD ["npm", "start"]
