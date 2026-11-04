# Triple Baka Anime Merchandise API

ITEC 116 backend prototype for browsing anime merchandise, managing inventory,
maintaining a personal cart, and placing and tracking orders.

**Stack:** JavaScript, Node.js 24, NestJS, TypeORM, MySQL-compatible XAMPP
MariaDB, bcrypt, JWT, Jest, Supertest, and Postman.

## Start locally

1. Start MySQL in XAMPP and run `npm ci` in the repository.
2. For a fresh setup, import [database/triple_baka_db.sql](database/triple_baka_db.sql) with
   phpMyAdmin or the MySQL client. It creates the six tables in
   `triple_baka_db` and contains schema only. Skip the import if that database already exists.
3. Copy `.env.example` to `.env`. Fill in the MySQL connection values and
   generate a local JWT secret with
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
   Leave `DB_SYNCHRONIZE=false` when using the SQL file or an existing database.
4. Run `npm run start:dev` and open `http://127.0.0.1:3000/`. Use
   `npm run start` to run without automatic restarts. In Windows PowerShell,
   use `npm.cmd` if the npm PowerShell wrapper is blocked.

### Create an administrator

Register a demo account with `POST /auth/register` using `FullName`, `Email`
and `Password` (8 characters minimum, 72 UTF-8 bytes maximum). To grant catalog administration, run
`npm run admin:promote -- your-demo-email@example.test` locally. Sign in
with `POST /auth/login` using that account's `Email` and `Password`. Pass the
returned `access_token` as `Authorization: Bearer <token>`. Ordinary public
registrations always create customer accounts.

## API

| Access | Endpoints |
| --- | --- |
| Public | `GET /`; `POST /auth/register`; `POST /auth/login` |
| Public | `GET /categories`; `GET /categories/:id`; `GET /categories/:id/products`; `GET /products`; `GET /products/:id` |
| Administrator | `POST /categories`; `PATCH /categories/:id`; `DELETE /categories/:id`; `POST /products`; `PATCH /products/:id`; `DELETE /products/:id` |
| Signed in | `GET /auth/profile`; `GET /cart`; `POST /cart`; `GET /cart/:id`; `PATCH /cart/:id`; `DELETE /cart/:id` |
| Signed in | `GET /orders`; `POST /orders`; `GET /orders/:id`; `POST /orders/:id/cancel` |
| Administrator | `GET /orders/all`; `PATCH /orders/:id/status` |

- Category fields: `CategoryName`, optional `Description`.
- Product fields: `ProductName`, optional `Description`, `Price` (decimal),
  `StockQuantity` (nonnegative integer), `CategoryID` (existing category).
- Cart: POST adds `Quantity` units of `ProductID`; PATCH sets the cart line's
  `Quantity`. Checkout takes `ShippingAddress` and uses stored prices.
- Order progression: `pending → processing → shipped → delivered`. A
  customer can cancel their pending order. An administrator can cancel a
  pending or processing order. Cancellation restores stock once.
- Success responses use 200, 201 or 204. Validation, authentication,
  authorization, missing resources and conflicts return 400, 401, 403, 404
  and 409 respectively. Login throttling returns 429.

## Verify and demonstrate

- `npm test -- --runInBand` runs unit tests.
- `npm run test:e2e -- --runInBand` uses the MySQL credentials in `.env` to
  create and remove a uniquely named test database. The test account needs
  permission to create and drop that database.
- Import [the Postman collection](postman/Triple%20Baka.postman_collection.json)
  and set `baseUrl`, `adminEmail`, and `adminPassword` locally. For a full
  collection run, use a demo database. The runner creates a unique customer,
  catalog records, and orders. The first request initializes the run variables.
- For the narrated recording, start the backend, run **API root** to initialize
  variables and log in as administrator. Then run **Create disposable
  category**, **Read disposable category**, **Update disposable category** and
  **Delete disposable category**. Show its row in phpMyAdmin before deletion and its
  absence afterward. Trace **Create category** through
  `src/catalog/catalog.controllers.js`, `src/catalog/catalog.service.js`,
  and `src/entities/category.entity.js`. Run **Reject missing bearer token**
  and show the 401 response. Keep passwords and the full JWT out of the recording.
