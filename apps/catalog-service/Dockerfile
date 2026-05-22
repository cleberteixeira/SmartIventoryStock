FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nx build catalog-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/catalog-service ./
RUN npm install --production
EXPOSE 3001
CMD ["node", "main.js"]