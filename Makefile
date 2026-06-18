.PHONY: up down clean logs db-logs sh psql generate migrate seed studio lint build

up:
	docker compose up --build

down:
	docker compose down

clean:
	docker compose down -v

logs:
	docker compose logs -f app

db-logs:
	docker compose logs -f postgres

sh:
	docker compose exec app sh

psql:
	docker compose exec postgres psql -U postgres -d my_vercel_project

generate:
	docker compose exec app pnpm prisma:generate

migrate:
	docker compose exec app pnpm prisma:migrate

seed:
	docker compose exec app pnpm prisma:seed

studio:
	docker compose exec app pnpm prisma:studio

lint:
	docker compose exec app pnpm lint

build:
	docker compose exec -e NODE_ENV=production app pnpm build
