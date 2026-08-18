# trust me

A mobile-first social recommendation app where women 18–35 get trusted recommendations from friends — for hairdressers, doctors, cleaners, nail salons, dermatologists, and anything else worth sharing.

**Mental model:** Beli, but for recommendations of anything, not just restaurants.

## This is a prototype

Clickable prototype with mock data — no backend, no auth, no real accounts. Built to share with 10–20 friends to test the concept.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- lucide-react
- Mock data in `src/lib/mock-data.ts`
- localStorage for persisting likes, vouches, and saves

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — works best in a mobile viewport (430px).

## Key interaction model

- **❤️ Like** — social support. "I love this rec."
- **🤝 Vouch** — trust signal. "I've personally used them and second this."

Likes and vouches are persisted to localStorage so they survive page refreshes.

## Customizing mock data

All seed data lives in `src/lib/mock-data.ts`. Edit `recommendations` to add/remove/change recs, and `users` to change the friend network.
