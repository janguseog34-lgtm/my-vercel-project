# my-vercel-project

Next.js full-stack app using pnpm, Prisma, and PostgreSQL.

## Local Development

The local development environment runs fully in Docker:

```bash
make up
```

This starts:

- Next.js app on http://localhost:3000
- PostgreSQL on localhost:5432

Stop the containers:

```bash
make down
```

Remove containers and local database volume:

```bash
make clean
```

## Database

Local Docker uses `.env.docker`:

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/my_vercel_project?schema=public"
DIRECT_URL="postgresql://postgres:postgres@postgres:5432/my_vercel_project?schema=public"
```

Run Prisma commands inside the app container:

```bash
make generate
make migrate
make seed
make studio
```

Seed login accounts:

```text
customer@example.com / password1234
owner@example.com / password1234
```

## Data Model

The MVP schema has 14 tables:

- `users`: app accounts for customers, restaurant owners, and admins.
- `password_credentials`: password hashes separated from profile data.
- `sessions`: login sessions used for logout and expiry.
- `addresses`: saved delivery addresses per user.
- `restaurants`: restaurant storefronts.
- `restaurant_members`: owner/staff access to restaurants.
- `menu_categories`: restaurant menu sections.
- `menu_items`: sellable menu items.
- `carts`: active or completed cart headers.
- `cart_items`: menu lines inside carts.
- `orders`: order header, delivery snapshot, current status, and totals.
- `order_items`: immutable menu snapshots for each order.
- `payments`: payment attempts and status.
- `order_status_events`: order status history.

When a user orders, data moves from `carts` and `cart_items` into `orders`
and `order_items`. A `payments` row tracks payment status, and every status
change is appended to `order_status_events`.

## Deployment

Vercel deploys the Next.js project directly from GitHub. Docker is only for local development.

For Vercel, configure Supabase PostgreSQL environment variables:

```env
DATABASE_URL="your Supabase pooled connection string"
DIRECT_URL="your Supabase direct connection string"
```

The production build runs:

```bash
pnpm build
```
