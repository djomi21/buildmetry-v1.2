FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
EXPOSE 10000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null; node src/server.js"]
