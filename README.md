# Celebration & Event Planner

GenAI-powered planning assistant for weddings, birthdays, and community events.

It includes:
- Event creation and management
- Budget tracking
- Timeline milestones
- Vendor checklist
- AI plan generation, ideas, budget optimization, vendor recommendations, and event chat

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Prisma ORM
- PostgreSQL (deployment-ready)
- NextAuth credentials auth
- Gemini API (`@google/generative-ai`)

## Environment Variables

Create a `.env.local` file (or copy from `.env.example`) with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
NEXTAUTH_SECRET="YOUR_RANDOM_SECRET"
NEXTAUTH_URL="http://localhost:3000"
```

In production on Vercel, set `NEXTAUTH_URL` to your deployed domain, for example:

```env
NEXTAUTH_URL="https://your-project.vercel.app"
```

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

App runs on http://localhost:3000.

## Build and Start

```bash
npm run build
npm run start
```

## Vercel Deployment

This repo is configured with `vercel.json`:

- `installCommand`: `npm ci`
- `buildCommand`: `npx prisma generate && npx prisma db push && npm run build`

### Deploy Steps

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add environment variables in Vercel Project Settings:
	- `DATABASE_URL`
	- `GEMINI_API_KEY`
	- `NEXTAUTH_SECRET`
	- `NEXTAUTH_URL`
4. Ensure your Postgres database is reachable from Vercel.
5. Trigger deployment.

## API Overview

### Auth
- `POST /api/auth/register`
- `GET/POST /api/auth/[...nextauth]`

### Events
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/[id]`
- `PUT /api/events/[id]`
- `DELETE /api/events/[id]`

### Budget
- `GET /api/events/[id]/budget`
- `POST /api/events/[id]/budget`
- `PUT /api/events/[id]/budget`
- `DELETE /api/events/[id]/budget`

### Timeline
- `GET /api/events/[id]/timeline`
- `POST /api/events/[id]/timeline`
- `PUT /api/events/[id]/timeline`
- `DELETE /api/events/[id]/timeline`

### Vendors
- `GET /api/events/[id]/vendors`
- `POST /api/events/[id]/vendors`
- `PUT /api/events/[id]/vendors`
- `DELETE /api/events/[id]/vendors`

### AI
- `POST /api/ai/generate-plan`
- `POST /api/ai/suggest-ideas`
- `POST /api/ai/budget-optimize`
- `POST /api/ai/vendor-recommend`
- `POST /api/ai/chat`

## Useful Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Run production server
npm run lint     # Run linting
```

## Notes

- AI routes are server-side and protected by auth + rate limiting.
- Prisma schema is configured for PostgreSQL deployment.
- `.gitignore` excludes local env files, build artifacts, and local Prisma DB artifacts.
