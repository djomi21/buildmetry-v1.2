#!/bin/bash
# ╔══════════════════════════════════════════════════════════╗
# ║   BuildMetry v1.0 — Docker Setup Script                  ║
# ║   Run this ONCE inside your project root folder           ║
# ║   (the folder that contains frontend/ and backend/)       ║
# ╚══════════════════════════════════════════════════════════╝
#
# WHAT THIS SCRIPT DOES:
#   1. Checks your project structure is correct
#   2. Creates Dockerfile inside frontend/ folder
#   3. Creates nginx.conf inside frontend/ folder
#   4. Creates Dockerfile inside backend/ folder
#   5. Creates docker-compose.yml in root folder
#   6. Creates .env with random secure passwords
#   7. Creates .dockerignore files
#   8. Creates manage.sh helper commands
#
# HOW TO RUN:
#   chmod +x setup-docker.sh
#   ./setup-docker.sh

set -e

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   BuildMetry v1.0 — Docker Setup         ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Verify project structure
if [ ! -d "frontend" ] || [ ! -f "frontend/package.json" ]; then
  echo "  ❌ ERROR: frontend/ folder or package.json not found"
  echo "     Run this from your project root (where frontend/ and backend/ are)"
  exit 1
fi
if [ ! -d "backend" ] || [ ! -f "backend/package.json" ]; then
  echo "  ❌ ERROR: backend/ folder or package.json not found"
  exit 1
fi
echo "  ✓ Project structure verified"

# frontend/Dockerfile
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
echo "  ✓ frontend/Dockerfile"

# frontend/nginx.conf
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ {
        proxy_pass http://backend:10000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
echo "  ✓ frontend/nginx.conf"

cat > frontend/.dockerignore << 'EOF'
node_modules
dist
.env*
*.log
.git
EOF
echo "  ✓ frontend/.dockerignore"

# backend/Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
EXPOSE 10000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null; node src/server.js"]
EOF
echo "  ✓ backend/Dockerfile"

cat > backend/.dockerignore << 'EOF'
node_modules
.env*
*.log
.git
EOF
echo "  ✓ backend/.dockerignore"

# docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=/api
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    depends_on:
      - backend
    networks:
      - buildmetry
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    expose:
      - "10000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-buildmetry}:${DB_PASSWORD}@db:5432/${DB_NAME:-buildmetry}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
      - NODE_ENV=production
      - PORT=10000
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - buildmetry
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME:-buildmetry}
      - POSTGRES_USER=${DB_USER:-buildmetry}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-buildmetry}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - buildmetry
    restart: always

volumes:
  pgdata:

networks:
  buildmetry:
    driver: bridge
EOF
echo "  ✓ docker-compose.yml"

# .env
if [ ! -f .env ]; then
  DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
  JWT=$(openssl rand -hex 32)
  IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
  cat > .env << ENVFILE
DB_NAME=buildmetry
DB_USER=buildmetry
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT}
JWT_EXPIRES_IN=7d
FRONTEND_PORT=3000
FRONTEND_URL=http://${IP}:3000
ENVFILE
  echo "  ✓ .env (generated with random secrets)"
else
  echo "  ⏭ .env exists, skipped"
fi

# manage.sh
cat > manage.sh << 'MGEOF'
#!/bin/bash
set -e
cd "$(dirname "$0")"
source .env 2>/dev/null || true
case "${1}" in
  start)   docker compose up -d --build; echo "✅ Running at http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT:-3000}" ;;
  stop)    docker compose down; echo "✅ Stopped" ;;
  restart) docker compose restart ${2:-}; echo "✅ Restarted" ;;
  rebuild) docker compose down; docker compose up -d --build; echo "✅ Rebuilt" ;;
  logs)    docker compose logs -f --tail=100 ${2:-} ;;
  status)  docker compose ps ;;
  backup)  F="backup_$(date +%Y%m%d_%H%M%S).sql"; docker compose exec -T db pg_dump -U ${DB_USER:-buildmetry} ${DB_NAME:-buildmetry} > "$F"; echo "✅ Saved: $F" ;;
  restore) read -p "Replace all data? (yes/no): " c; [ "$c" = "yes" ] && docker compose exec -T db psql -U ${DB_USER:-buildmetry} ${DB_NAME:-buildmetry} < "$2" && echo "✅ Restored" || echo "Cancelled" ;;
  migrate) docker compose exec -T backend npx prisma db push --accept-data-loss; echo "✅ Done" ;;
  seed)    docker compose exec -T backend node prisma/seed.js; echo "✅ Seeded" ;;
  update)  git pull origin main; docker compose up -d --build; echo "✅ Updated" ;;
  *)
    echo "BuildMetry — ./manage.sh <command>"
    echo "  start | stop | restart | rebuild | logs | status"
    echo "  backup | restore <file> | migrate | seed | update" ;;
esac
MGEOF
chmod +x manage.sh
echo "  ✓ manage.sh"

touch .gitignore
for p in ".env" "pgdata" "*.log" "node_modules"; do
  grep -qF "$p" .gitignore 2>/dev/null || echo "$p" >> .gitignore
done
echo "  ✓ .gitignore"

echo ""
echo "  ✅ Setup complete! Next: git add -A && git commit -m 'Docker deploy' && git push"
echo ""
