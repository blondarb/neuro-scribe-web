# neuro-scribe-web — Stack

## Runtime Dependencies

| Package | Version | Role |
|---------|---------|------|
| express | ^4.21.0 | HTTP server |
| express-rate-limit | ^8.2.1 | Rate limiting middleware |
| helmet | ^8.0.0 | Security headers |
| cors | ^2.8.5 | CORS middleware |
| drizzle-orm | ^0.38.0 | PostgreSQL ORM |
| pg | ^8.13.0 | PostgreSQL client |
| react | ^19.2.4 | Client UI framework |
| react-dom | ^19.2.4 | Client DOM rendering |
| react-router-dom | ^7.13.0 | Client routing |
| @aws-sdk/client-bedrock-runtime | ^3.1003.0 | AWS Bedrock (Claude) |
| @aws-sdk/client-transcribe-streaming | ^3.1003.0 | AWS Transcribe streaming |
| jsonwebtoken | ^9.0.2 | JWT validation |
| jwks-rsa | ^3.2.2 | JWKS key fetching for auth |
| zod | ^3.24.0 | Request validation schemas |
| winston | ^3.17.0 | Structured logging |
| dotenv | ^16.4.7 | Environment config |
| uuid | ^11.0.0 | UUID generation |

## Dev Dependencies

| Package | Version | Role |
|---------|---------|------|
| vite | ^5.4.21 | Client bundler |
| @vitejs/plugin-react | ^4.7.0 | React fast refresh |
| vitest | ^2.0.0 | Unit and integration tests |
| @vitest/coverage-v8 | ^2.1.9 | Test coverage |
| drizzle-kit | ^0.30.0 | DB migrations CLI |
| tsx | ^4.19.0 | TypeScript execution (dev server) |
| typescript | ^5.4.0 | Type checking |
| prettier | ^3.3.0 | Code formatting |

## Key Infrastructure

| Resource | Status | Notes |
|----------|--------|-------|
| PostgreSQL | Required | Connection via `src/db/client.ts` |
| AWS Bedrock | Required | Claude Sonnet/Haiku for generation |
| STT provider | Undecided | Deepgram / Whisper / Transcribe |
| Auth provider | Undecided | Auth0 / Cognito / Clerk |
| Hosting | Undecided | Lightweight → AWS ECS |

## Dev Commands

```bash
npm run dev              # Start API dev server (tsx watch)
npm run dev:client       # Start Vite client dev server
npm run build            # Build server (tsc) + client (vite)
npm run build:server     # Build server only
npm run build:client     # Build client only
npm run start            # Run production server
npm run test             # Run all tests (vitest)
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # Playwright end-to-end tests
npm run test:coverage    # Test coverage report
npm run lint             # TypeScript type check
npm run format           # Prettier format

# Database
npm run db:migrate       # Run Drizzle migrations
npm run db:generate      # Generate migration from schema changes
npm run db:studio        # Open Drizzle Studio

# Knowledge base
npm run kb:sync          # Sync plans.json + medications.json from neuro-plans

# QA
npm run qa:smoke         # Smoke tests (runs unit tests)
npm run qa:security      # npm audit --audit-level=high
```
