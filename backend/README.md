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

- `GET    /api/orders`         - List all orders
- `POST   /api/orders`         - Create new order
- `PATCH  /api/orders/:id`     - Update order

- `GET    /api/menu_items`     - List all menu items
- `POST   /api/menu_items`     - Create new menu item
- `PATCH  /api/menu_items/:id` - Update menu item
- `DELETE /api/menu_items/:id` - Delete menu item

- `GET    /api/users`          - List all users
- `POST   /api/users`          - Create new user
- `PATCH  /api/users/:id`      - Update user
- `DELETE /api/users/:id`      - Delete user

## Notes
- The backend runs on port 4000 by default.
- You can deploy this backend to Heroku, Render, Railway, or any Node.js host. 