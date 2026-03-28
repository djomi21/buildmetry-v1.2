FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
COPY . .
EXPOSE 10000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null; node src/server.js"]
