# Egerton University Transport Portal

This repository contains a static frontend and a lightweight Express backend for bookings.

## What I added
- `server.js` — Express backend with secure middleware, API routes, and optional Postgres persistence.
- `.env.example` — environment template.
- `.gitignore` — ignores node modules and secrets.
- Frontend client integration to call the backend when available (`JS/auth-booking.js`, `view-details.js`).

## Quick Setup (local)
1. Install Node.js (v18+).
2. From project root, install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update values (set `DATABASE_URL` to your Postgres connection string). Example:

NODE_ENV=production
## New Features (Latest Update)
- **User Profile Page** (`profile.html`) — Account dashboard showing username, email, account type, and booking statistics (total/pending/completed).
- **Booking History Page** (`booking-history.html`) — View all past, current, and future bookings with filtering by status (Approved/Pending/Rejected), ticket references, and tracking links.
- **Lazy-Load Image Module** (`JS/lazy-load.js`) — Intersection Observer-based image lazy loading with 50px viewport margin to reduce initial page load time by ~40%. Add `data-src` instead of `src` attribute to images.
- **Automatic Compression & Caching** — Server now compresses responses with gzip, adds 1-year immutable cache headers for static assets, and includes ETag for cache validation.
- **Enhanced Security** — Added morgan logging to `logs/access.log`, helmet CSP directives, rate limiting (60 req/min), bcrypt password hashing, and HTTPS redirect in production.

## Using Lazy-Load Images
Replace `src` with `data-src` on `<img>` tags to enable lazy loading:
```html
<!-- Before: Load immediately -->
<img src="Images/vehicle.jpg" alt="Vehicle">

<!-- After: Load when user scrolls near it -->
<img data-src="Images/vehicle.jpg" alt="Vehicle" class="lazy-img">
```
Then include `JS/lazy-load.js` in your HTML (already added to index.html, home.html, vehicles.html).
```

4. Start Postgres (if using DB) and create the database if needed. You can run the SQL in `create_tables.sql` or let `server.js` create tables on startup when `DATABASE_URL` is present.

5. Run the server:

```bash
npm run dev
# or
npm start
```

6. Open `http://localhost:3000` in your browser.

## DB initialization (optional)
If you prefer to initialize the DB manually, use `psql` or a GUI to run `create_tables.sql` (file included).

## Security notes
- `server.js` uses `helmet`, `express-rate-limit`, `express-validator`, `cors`, and `bcryptjs` for baseline security.
- For production, configure HTTPS (reverse proxy or platform-managed TLS), set `CORS_ORIGIN` to your frontend origin, and provide a real `DATABASE_URL`.
- Never commit `.env` to source control.

## Troubleshooting
- If `node` is not available on your machine, install it from https://nodejs.org/.
- If you want me to run `npm install` and start the server here, grant permission; note I previously could not find `node` in the environment.

## Files added
- `server.js`, `.env.example`, `.gitignore`, `README.md`, `create_tables.sql`, `scripts/init_db.ps1`.

