# M10 independent audit

Audit date: 2026-10-22 (Asia/Karachi)

## Environment and repository

- Canonical path: `D:\TestForge`
- Host: Windows 10.0.19045, PowerShell
- Node.js 24.11.1, npm 11.6.2, Git 2.54.0.windows.1
- Local PostgreSQL: embedded PostgreSQL 18.4 on port 5432
- Branch at audit start: `main`
- Audit-start HEAD: `152c9c97e2e5b6679c24c239f8e0026c40afba0e`
- Audit-start working tree: clean
- Audit-start remotes: none
- Docker / Compose: command not installed
- GitHub CLI: absent initially; GitHub CLI 2.103.0 was installed per-user during M10

The three reported baseline commits are present and in order:

- `b5c01db` - Initialize TestForge workspace and TypeScript tooling
- `767b9ea` - Build commerce AUT with transactional order workflows
- `152c9c9` - Add enterprise Playwright coverage CI and portfolio documentation

## Implemented modules verified by inspection

- Next.js App Router frontend with authentication, product catalog/detail, cart, order history, and admin screens
- Express API with Zod validation, JWT authentication, bcrypt hashing, role authorization, products, cart, orders, payments, and admin statistics
- Prisma/PostgreSQL schema, migration, deterministic seed, transactional checkout, inventory deduction, cancellation, and refund state
- Playwright page/component objects, fixtures, seven API clients, Faker factories, Zod response contracts, PostgreSQL helpers, and guarded cleanup
- API, integration, UI, responsive, and cross-layer lifecycle tests
- Dockerfiles, Compose definition, PowerShell readiness/reset scripts, Playwright HTML and Allure reporting
- GitHub Actions for static/API/integration validation, Chromium smoke/lifecycle testing, and cross-browser regression

No required module from the claimed baseline was found to be wholly missing. Runtime verification limits are listed below.

## Independent execution record

Commands were selected only after inspecting the package scripts.

| Command                                      | Result                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm ci`                                     | Passed; 348 packages added and 352 audited                                           |
| `npm run db:generate`                        | Passed; Prisma Client 6.19.3 generated                                               |
| `npm run typecheck`                          | Passed in backend, frontend, and automation                                          |
| `npm run lint`                               | Passed in backend, frontend, and automation                                          |
| `npm run format:check`                       | Passed                                                                               |
| `npm run build`                              | Passed at baseline; backend TypeScript and Next.js 16.4.2 production build completed |
| Development and test `npm run db:migrate`    | Passed; no pending migrations                                                        |
| Development and test `npm run db:seed`       | Passed                                                                               |
| `npm run test:api`                           | 10 passed in 15.0s at baseline                                                       |
| `npm run test:integration`                   | 2 passed in 7.4s at baseline                                                         |
| `npm run test:ui`                            | 7 passed in 19.8s under the original project mapping                                 |
| `npm run test:e2e`                           | 1 passed in 8.4s at baseline                                                         |
| `npm test` clean baseline rerun              | 32 passed, 0 failed/skipped/retried in 1.1m                                          |
| Focused M10 security/concurrency tests       | 4 passed in 9.6s                                                                     |
| Lifecycle stability run after navigation fix | 3 passed in 24.4s                                                                    |
| Final post-change `npm test`                 | 34 passed, 0 failed/skipped/retried in 1.1m                                          |

The first long regression attempt was interrupted when the tool-hosted service sessions disappeared. A later clean baseline rerun passed 32/32. After M10 changes, one full run produced 33 passed and one lifecycle timeout. Its retained trace showed `GET /cart` returned HTTP 200 quickly but Playwright remained in the default full-load wait until the test timeout. `CartPage.open()` now waits only for navigation commit and then relies on the existing web-first heading assertion. The lifecycle passed three consecutive focused executions after that change.

A subsequent full run reached 33 passing tests but the final mobile project did not start until the process was terminated; the mobile test then passed alone in 3.1s. One clean final full run completed all 34 tests in 1.1m with no failures, skips, or retries. This preserves both the transient orchestration evidence and the final verified result.

Generated local evidence (intentionally ignored by Git):

- `automation/playwright-report`
- `automation/allure-results`
- `automation/test-results`
- Failure trace/video under the lifecycle test-results directory during diagnosis

Committed genuine application screenshots:

- `docs/screenshots/home.png`
- `docs/screenshots/products.png`

## Confirmed defects corrected

1. The embedded PostgreSQL launcher always initialized its persistent data directory. A second start failed because the directory was non-empty. It now initializes only when `PG_VERSION` is absent.
2. A checkout idempotency-key collision returned the prior order without checking ownership. It now returns HTTP 409 for a different customer, preventing cross-user order disclosure.
3. Order status validation and cancellation restocking were not atomically claimed. Status transitions now execute in a serializable transaction with a conditional status update, preventing duplicate concurrent restocks.
4. The Chromium project mixed UI and E2E files, so `test:ui` was not a UI-only suite. A dedicated `e2e-chromium` project now makes suite reporting accurate.
5. Default `page.goto('/cart')` load waiting intermittently stalled despite a successful document response. Navigation now waits for commit and uses the page heading assertion as the readiness condition.
6. CI artifact paths used brace syntax and did not retain service logs. Workflows now use explicit multiline paths and upload backend/frontend logs.
7. Pull-request validation lacked browser smoke and the critical lifecycle. A Chromium smoke/lifecycle job was added; the cross-browser workflow also runs on pushes to `main`.

## Framework architecture findings

- Page objects remain small and use role/label locators with web-first assertions.
- Browser contexts are Playwright test-scoped and isolated.
- API clients are typed wrappers over `APIRequestContext`; API projects are separate from browser projects.
- Faker data carries unique run values; global teardown removes only recognized QA users/products.
- Database helpers refuse a target whose database name does not end in `_test`.
- The lifecycle test genuinely crosses API setup, direct PostgreSQL verification, browser checkout, API contract validation, final database reconciliation, and cleanup.
- Checkout uses serializable transactions and conditional inventory decrements. The oversell test validates one winner and zero remaining stock.
- Coverage remains risk-focused rather than count-driven. Missing/limited areas include clock-controlled JWT-expiry testing, full admin UI status transitions, automated accessibility scanning, and load/performance profiles.

## Security assessment

- Passwords use bcrypt cost 12.
- JWTs expire after two hours; protected API routes authenticate the bearer token and enforce admin roles server-side.
- Zod validates request bodies/queries, Helmet is enabled, JSON bodies are limited to 32 KB, CORS is restricted by environment, and Prisma parameterizes data access.
- Order reads and payment retries enforce owner-or-admin authorization. M10 added owner enforcement to duplicate checkout lookup.
- The deterministic payment simulator accepts only `tok_success` and `tok_fail`; it does not process card data.
- Secrets are environment-based. Only placeholder/local fixture credentials are tracked.
- High-confidence token/private-key signatures were not found in current tracked files or reachable Git history.
- Playwright traces can contain bearer tokens in captured request headers. They remain ignored locally; CI artifacts require repository access and should use limited retention.

Limitations:

- Logout clears client state but cannot revoke an already issued stateless JWT.
- Role claims remain valid until JWT expiry even if a role changes.
- Browser tokens are stored in `localStorage`, which increases impact if an XSS defect is introduced.
- The default development JWT secret and database credentials are deliberately local-only and must be replaced outside local development.

## Dependency assessment

The first audit data reported three linked high findings: direct development dependency `prisma@6.19.3`, transitive `@prisma/config@6.19.3`, and transitive `deepmerge-ts@7.1.5`. GitHub advisory `GHSA-ggr8-5vv4-36mx` describes stack exhaustion when recursive object graphs are passed to deepmerge-ts below 8.0.0. The dependency is reached through the Prisma CLI configuration path, not the generated production Prisma client or request handling code. TestForge does not pass attacker-controlled recursive objects into Prisma configuration.

The suggested npm remediation was Prisma 7.10.1, a major upgrade. It was not forced because Prisma 7 migration and generator/runtime changes require a dedicated compatibility change. A later `npm audit --json` and `npm audit --omit=dev --json` both returned zero findings while the installed vulnerable-version dependency path still exists. This discrepancy is documented; zero current npm findings is not represented as proof that the upstream advisory ceased to apply.

## Docker and CI blockers

- `docker --version` and `docker compose version` fail because the Docker command is absent.
- `docker-compose.yml` parses successfully and declares PostgreSQL, backend, frontend, health checks, dependency ordering, ports, and a named data volume.
- Image builds, container health, restart behavior, and container-targeted tests remain not verified.
- GitHub Actions YAML parses locally. Both workflows were executed remotely after publication.

## GitHub publication and CI evidence

- Public repository: https://github.com/mujtabashah1/TestForge
- Authenticated owner verified: `mujtabashah1`
- Original commit history preserved; no force push was used.
- Initial M10 publication commit: `7de9f7d23d137703269b6607e8acfdeeae94542f`
- CI runtime update commit: `092b2aa5a0d3aea78ca91db6dcc465e713fee7b1`
- Pull request validation run 39683683521 passed. Static, API/integration, and Chromium smoke/lifecycle jobs all completed and uploaded artifacts.
- Browser regression run 39683683553 passed. Build, readiness, cross-browser regression, cleanup, and artifact upload all completed.
- Run URLs:
  - https://github.com/mujtabashah1/TestForge/actions/runs/39683683521
  - https://github.com/mujtabashah1/TestForge/actions/runs/39683683553

The first successful remote runs emitted Node 20 action-runtime deprecation warnings. Official action release endpoints reported v7 as current for checkout, setup-node, and upload-artifact. M10 updated all three actions to v7 and verified the replacement runs above. The only remaining annotation is GitHub's informational migration notice for `ubuntu-latest` moving to Ubuntu 26.

## Previously reported versus independently observed

| Baseline claim                                                    | M10 finding                                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Three static/type gates passed                                    | Independently passed                                                                    |
| Backend/frontend production builds passed                         | Independently passed at baseline; patched backend build also passed                     |
| Migrations and seeds passed                                       | Independently passed for development and test databases                                 |
| 32/32 in 1.1 minutes                                              | Independently reproduced on a clean baseline rerun                                      |
| Chromium, Firefox, WebKit, mobile Chromium                        | Independently observed                                                                  |
| Lifecycle/concurrency/cancellation/payment/database checks passed | Independently observed; M10 added two targeted hardening checks                         |
| Docker unavailable                                                | Confirmed; Compose runtime remains blocked                                              |
| GitHub Actions not remotely executed                              | Two replacement workflows passed remotely on `092b2aa`                                  |
| Three high Prisma-chain findings                                  | Observed initially; later npm audit returned zero despite the installed dependency path |
