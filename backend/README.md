# POS Backend (Node.js/Express + MongoDB)

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and set your MongoDB Atlas connection string:
   ```sh
   cp .env.example .env
   # Edit .env and set MONGO_URI
   ```
3. Start the server:
   ```sh
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## API Endpoints

- `GET    /api/orders`         - List all orders (JWT)
- `POST   /api/orders`         - Create new order (JWT)
- `PATCH  /api/orders/:id`     - Update order (JWT)

- `GET    /api/menu_items`     - List all menu items
- `POST   /api/menu_items`     - Create new menu item
- `PATCH  /api/menu_items/:id` - Update menu item
- `DELETE /api/menu_items/:id` - Delete menu item

- `GET    /api/users`          - List all users
- `POST   /api/users`          - Create new user
- `PATCH  /api/users/:id`      - Update user
- `DELETE /api/users/:id`      - Delete user

### Third-party integration (`CLIENT_SECRET` + header `X-API-Key`)

- `GET    /api/integration/menu_items` - List menu items (same payload as public menu list)
- `POST   /api/integration/orders`     - Create order; requires unique `externalOrderId` (retries return existing order). Each line needs **menuItemId** and/or **name** (matched to menu when possible; otherwise stored as custom line with optional **unitPrice**).

Full interactive-style documentation: `docs/openapi.yaml` (import into Postman or Swagger UI). Partner guide for flexible line items: `docs/INTEGRATION_ORDERS_API.md`. Example requests: root `postman_collection.json`.

## Rate limiting

Per-IP limits (returns **429** JSON `{ error: "…" }` plus `RateLimit-*` headers):

| Area | Default | Notes |
|------|---------|--------|
| `POST /api/auth/login` | 30 failures / 15 min | Successful logins are not counted (`skipSuccessfulRequests`). |
| `POST /api/auth/register` | 15 / hour | Every attempt counts. |
| `/api/integration/*` | 120 / minute | Menu + order ingestion combined. |

Override with env: `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_MS`, `RATE_LIMIT_REGISTER_MAX`, `RATE_LIMIT_REGISTER_WINDOW_MS`, `RATE_LIMIT_INTEGRATION_MAX`, `RATE_LIMIT_INTEGRATION_WINDOW_MS` (window values in milliseconds).

Behind a reverse proxy (nginx, Render, Railway, etc.), set **`TRUST_PROXY=1`** in `.env` so the client IP is taken from `X-Forwarded-For` and limits apply correctly.

## Notes
- The backend runs on port 4000 by default.
- You can deploy this backend to Heroku, Render, Railway, or any Node.js host. 