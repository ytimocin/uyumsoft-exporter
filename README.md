# Uyumsoft Exporter

Simple Next.js app that uploads Uyumsoft CSV exports, lets you pick the columns to keep, and syncs them into a Google Sheet through each user’s own account.

## Quick start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `SESSION_SECRET` (8+ random chars)
3. Run the dev server: `npm run dev` (or `make dev`) and open `http://localhost:3000`
4. Sign in with Google, pick/Create a Sheet, upload the CSV, confirm the preselected columns, then sync. Tokens live in memory only, so re-authenticate after restarts.

## Deploying

- Create a separate OAuth client for the production domain (e.g., your Vercel URL) and update the env vars there.
- Use `npm run build` to verify before deploying; change tests/linting via `make` targets.
