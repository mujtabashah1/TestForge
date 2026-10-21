# TestForge — Enterprise Test Automation Framework

TestForge is a production-style SDET portfolio: a persistent commerce application and an independently maintainable automation framework that validates its UI, REST API, PostgreSQL state, business transactions, and cross-layer workflows.

Current verification status is recorded in [docs/implementation-status.md](docs/implementation-status.md), with independent findings in [docs/M10-independent-audit.md](docs/M10-independent-audit.md). Docker configuration is implemented but has not been executed on this machine because Docker is unavailable.

## Skills demonstrated

- Strict TypeScript across Next.js, Express, Prisma, and Playwright
- Authentication, role-based authorization, Zod validation, and bcrypt password hashing
- Transactional checkout, atomic inventory deduction, payment simulation, and idempotency
- Page objects, component objects, custom fixtures, typed API clients, and Faker factories
- Database assertions with destructive-operation guards
- Cross-browser UI, API, integration, concurrency, and end-to-end coverage
- PostgreSQL, Docker Compose, GitHub Actions, Playwright HTML, and Allure reporting

## Architecture

```mermaid
flowchart LR
  UI[Next.js frontend :3000] -->|REST / Bearer token| API[Express API :4000]
  API -->|Prisma transactions| DB[(PostgreSQL :5432)]
  API --> Payment[Deterministic payment simulator]
  PW[Playwright framework] --> UI
  PW --> API
  PW -->|read/controlled cleanup| DB
```

The API is the source of truth. Checkout executes in a serializable transaction and uses conditional inventory updates, so competing buyers cannot drive stock below zero. Checkout and payment retry requests have unique idempotency keys.

![TestForge home page](docs/screenshots/home.png)

![Database-backed product catalog](docs/screenshots/products.png)

## Repository

```text
app/frontend             Next.js customer and admin UI
app/backend              Express API, Prisma schema, migration, seed
automation/api           Reusable Playwright API clients
automation/db            Guarded PostgreSQL helpers
automation/pages         Page Object Model
automation/components    Reusable UI components
automation/fixtures      Custom Playwright fixtures
automation/factories     Unique Faker test data
automation/schemas       Zod response contracts
automation/tests         API, UI, integration, and E2E suites
docs                     Architecture, strategy, coverage, setup, status
scripts                  PowerShell readiness and reset tools
.github/workflows        PR validation and scheduled browser regression
```

## Prerequisites

- Node.js 20 or 22 LTS (authored with Node 24.11.1)
- npm 10+
- Docker Desktop with Compose (recommended), or PostgreSQL 15+
- Git

## Quick start with Docker

```powershell
Copy-Item .env.example .env
docker compose up --build -d
.\scripts\wait-for-services.ps1
```

Open http://localhost:3000. The API health endpoint is http://localhost:4000/health.

| Role     | Email                    | Password      |
| -------- | ------------------------ | ------------- |
| Admin    | admin@testforge.local    | TestForge123! |
| Customer | customer@testforge.local | TestForge123! |

These credentials are local deterministic fixtures only.

## Native development

Start PostgreSQL with testforge_dev and testforge_test databases, then:

```powershell
npm ci
Copy-Item .env.example .env
$env:DATABASE_URL='postgresql://testforge:testforge@localhost:5432/testforge_dev?schema=public'
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The root development command starts the API and frontend together. Never configure test cleanup against a shared or production database: the helper rejects any database whose name does not end in _test.

If Docker and PostgreSQL are unavailable, start the workspace-local embedded PostgreSQL distribution:

```powershell
npm run db:local
```

Keep that terminal open, then run migrations and seeds from another terminal. Its data remains in the ignored .local-postgres directory.

## Automation

With the AUT running and the test database migrated and seeded:

```powershell
npm run test:api
npm run test:integration
npm run test:ui
npm run test:e2e
npm test
npm run test:regression -w @testforge/automation
```

Install browser binaries once with npx playwright install. API and integration projects do not launch browsers.

The showcase is Complete Order Lifecycle — UI, API, and Database Validation. It creates a customer and product through APIs, checks initial PostgreSQL state, purchases through the browser, validates the order API contract, reconciles inventory/payment/order rows, captures a confirmation screenshot, and cleans its unique data.

## Reports and debugging

```powershell
npx playwright show-report automation/playwright-report
npm run report
npx allure open automation/allure-report
```

Playwright retains screenshots, video, and traces on failure. High-value tests attach relevant API responses and concurrency results. Generated evidence is ignored by Git. Genuine screenshots belong under docs/screenshots only after a verified application run.

## CI/CD

- pr-validation.yml performs type checking, linting, format checks, API/database integration tests, Chromium UI smoke tests, and the critical lifecycle test.
- browser-regression.yml runs Chromium, Firefox, WebKit, mobile Chromium, and the lifecycle test on pushes to main, on demand, and weekly.
- Workflows provision PostgreSQL, apply migrations, seed data, wait for readiness, and upload evidence.
- CI uses one conservative retry. Critical test failures fail the job.

## Known limitations

- Payments are local and deterministic (tok_success / tok_fail); no real card data is accepted.
- Token logout clears browser state; stateless JWTs are not server-revoked before expiry.
- Docker and browser execution results are not claimed until recorded in the implementation status.
- The final npm audit reports three linked high findings in the Prisma CLI configuration dependency. The available automated fix is a Prisma 7.10.1 major upgrade; applicability and the migration decision are documented in the M10 audit.
- Playwright traces may capture bearer headers. Reports are ignored locally and CI artifacts should retain repository-scoped access with limited retention.
- Tax providers, carriers, email delivery, and refresh-token rotation are outside portfolio scope.
