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
