# Talbeena — Food E-Commerce

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Firebase (Authentication + Realtime Database + Storage) + Razorpay.

## Stack

- **Frontend**: Next.js 16 (Turbopack, React 19), TypeScript, Tailwind v4, shadcn/ui
- **Firebase**: Authentication (email/password + Google), Realtime Database, Storage
- **Server**: Firebase Admin SDK (service account) for session cookies + data access
- **Payments**: Razorpay (test mode during development)
- **Validation/tests**: Zod, Vitest

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local Next.js development connects **directly to the configured Firebase Cloud project** — no emulators required.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- **Firebase Client** (public, from Firebase Console → Project Settings → Your apps): the seven `NEXT_PUBLIC_FIREBASE_*` variables. In the Console enable **Authentication** (Email/Password + Google providers) and create a **Realtime Database** + **Storage** bucket.
- **Firebase Admin — server only** (Firebase Console → Project Settings → Service accounts → Generate new private key): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Never expose these to the browser — the Admin SDK is imported only by server code (`src/lib/firebase/admin.ts`).
- **Razorpay** (Dashboard → Settings → API Keys, test mode): `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- **Site**: `NEXT_PUBLIC_SITE_URL`.

`.env.local` is git-ignored (see `.gitignore`). Never commit it.

## Realtime Database rules

Paste `firebase/database/rules.json` into Firebase Console → Realtime Database → Rules (and `firebase/storage.rules` into Storage → Rules), or deploy with:

```bash
npx firebase deploy --only database,storage
```

## Seeding the live catalog

```bash
npm run seed
```

Requires the Admin credentials above. **This modifies the live Realtime Database** — the script prints a warning before writing. It seeds 5 categories, 16 products, and the `WELCOME10` coupon. Re-running is safe (idempotent).

To grant an account admin access (sets the `admin` custom claim + `/users/{uid}/role`):

```bash
npm run set-admin -- you@example.com
```

## Authentication flow

Firebase Auth client SDK signs the user in → the client POSTs the ID token to `POST /api/auth/session` → the server mints an httpOnly `__session` cookie (14-day, Admin SDK `createSessionCookie`) → subsequent requests verify the cookie with `verifySessionCookie()`. Includes email/password, Google, password reset, logout, protected account routes, and admin access guarded server-side via the `admin` custom claim + `/users/{uid}/role`.

## Useful commands

```bash
npm run dev          # start development server (uses the live Firebase Cloud project)
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # TypeScript (tsc --noEmit)
npm run test         # Vitest unit tests
npm run seed         # seed live Realtime Database (catalog + coupon)
npm run set-admin    # promote a user to admin
```

## Deploy on Vercel

Add the environment variables from `.env.example` to your Vercel project (treat `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` as secret build/env vars). Then push to GitHub and import the repo on Vercel, or use `vercel deploy`.