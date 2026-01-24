# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BasketBuddy is a full-stack grocery search and basket management app. Users search products via Kroger API, manage a persistent cart, and can redirect to retailer checkout. Deployed entirely on Vercel (Next.js API routes + frontend), database on Supabase.

## Development Commands

```bash
cd web && npm run dev      # Next.js dev server on http://localhost:3000
cd web && npm run build    # Production build
cd web && npm run lint     # ESLint
```

Only one server process needed — Next.js handles both frontend and API routes.

## Architecture

```
Browser → Next.js (port 3000)
              ├→ /api/* route handlers (server-side)
              │     ├→ Kroger API (product search/details)
              │     ├→ Supabase (saved_items persistence)
              │     └→ Nominatim/Overpass (store locator)
              └→ App Router pages (client-side)
```

**Stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Supabase Auth (anon key client-side, service role server-side), Kroger OAuth2 (client credentials).

### Key Server-Side Modules (`web/lib/`)
- `kroger.ts` — Kroger API OAuth token management and product/store queries
- `storeLocator.ts` — Geocoding (Nominatim) and supermarket search (Overpass API, 32km radius)
- `supabaseAdmin.ts` — Supabase client with service role key (server-only)
- `auth.ts` — `getUserFromRequest()` helper for Bearer token validation

### API Route Handlers (`web/app/api/`)
- `search/route.ts` — GET: Search products
- `products/route.ts` — GET: Fetch product details by IDs
- `saved-items/route.ts` — GET/POST: List or add cart items (auth required)
- `saved-items/[id]/route.ts` — DELETE: Decrement/remove cart item (auth required)
- `stores/route.ts` — GET: Nearby supermarkets
- `reverse-geocode/route.ts` — POST: Lat/lng to ZIP

### Key Frontend Structure (`web/`)
- `app/page.tsx` — Home: ZIP code entry with geolocation fallback
- `app/search/page.tsx` — Product search, cart management with optimistic updates
- `app/basket/page.tsx` — Cart view, total price, Kroger product links
- `app/auth/` — Login, signup, email verification callback
- `app/components/NavBar.tsx` — Navigation with session/ZIP/cart awareness
- `lib/supabaseClient.ts` — Supabase browser client
- `lib/api.ts` — API wrapper functions (client-side)
- `lib/types.ts` — Shared TypeScript types

### API Endpoints
- `GET /api/search?zip=&term=` — Search products
- `GET /api/products?ids=&zip=` — Fetch product details
- `GET /api/saved-items` — List user cart (auth required)
- `POST /api/saved-items` — Add/increment cart item (auth required)
- `DELETE /api/saved-items/:id` — Decrement/remove cart item (auth required)
- `GET /api/stores?zip=` — Nearby supermarkets
- `POST /api/reverse-geocode` — Lat/lng to ZIP

## Key Patterns

- **Hybrid auth**: Cart works for both authenticated (Supabase `saved_items` table) and anonymous users (cookies as JSON)
- **Optimistic updates**: Cart UI updates immediately, syncs to API after
- **Product normalization**: Kroger API responses normalized to internal schema (name, brand, price, image, external_id)
- **Auth tokens**: API routes validate `Authorization: Bearer <token>` headers via Supabase
- **ZIP persistence**: Stored in cookies with 30-day expiry

## Design Tokens (CSS Variables in globals.css)
- `--charcoal: #37392E` (text)
- `--slateblue: #19647E` (primary)
- `--teal: #28AFB0` (accent/hover)
- `--dust: #DDCECD` (borders)
- `--parchment: #EEE5E5` (background)

## Environment Variables

**`web/.env.local`** (all variables):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (client-side)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `SUPABASE_URL` — Supabase project URL (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side)
- `KROGER_CLIENT_ID` — Kroger API client ID (server-side)
- `KROGER_CLIENT_SECRET` — Kroger API client secret (server-side)
