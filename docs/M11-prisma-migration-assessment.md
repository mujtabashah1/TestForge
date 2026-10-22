# M11 Prisma Migration Assessment

Assessment date: 2026-10-23 (Asia/Karachi)

Status: **Partially Verified** pending Docker image execution and remote Linux CI on the migration branch.

## Finding and exposure

The M10 baseline resolved this dependency chain:

```text
prisma@6.19.3
└─ @prisma/config@6.19.3
   └─ deepmerge-ts@7.1.5
```

`deepmerge-ts@7.1.5` is affected by `GHSA-ggr8-5vv4-36mx` / `CVE-2026-40345`. Crafted mutually recursive object graphs can cause uncontrolled recursion and stack exhaustion. The affected package was used through the Prisma CLI configuration path. TestForge does not pass HTTP request payloads to Prisma configuration merging, so direct production request-path exploitation was not identified; developer and CI availability exposure remained.

Prisma 6.19.3 is the final Prisma 6 release and pins the affected major. There is no non-major Prisma 6 update containing `deepmerge-ts >=8.0.0`.

## Version decision

| Package                       | Before |            Selected | Reason                                                                                                             |
| ----------------------------- | -----: | ------------------: | ------------------------------------------------------------------------------------------------------------------ |
| `prisma`                      | 6.19.3 |              7.10.1 | Explicit stable Prisma 7 version; avoids the Prisma CLI registry's current Prisma 8 release-candidate `latest` tag |
| `@prisma/client`              | 6.19.3 |              7.10.1 | Must match the CLI major/version                                                                                   |
| `@prisma/config`              | 6.19.3 | 7.10.1 (transitive) | Pulls patched `deepmerge-ts@8.0.2`                                                                                 |
| `@prisma/adapter-pg`          | absent |              7.10.1 | Prisma 7 requires a PostgreSQL driver adapter                                                                      |
| `pg` (backend)                | absent |              8.16.3 | Runtime driver for the adapter                                                                                     |
| `@types/pg` (backend)         | absent |              8.16.0 | Type support for the runtime driver                                                                                |
| `@prisma/client` (automation) | 6.19.3 |             removed | Automation uses its guarded `pg` helper and had no Prisma imports                                                  |

The project already satisfied Prisma 7's minimum Node.js and TypeScript requirements: local Node.js is 24.11.1, CI/Docker use Node.js 22, and TypeScript is 5.9.3. The backend was already an ESM package using NodeNext resolution.

## Compatibility changes

- Added `app/backend/prisma.config.ts` for schema, migration, seed, and datasource configuration.
- Moved the datasource URL out of `schema.prisma` into Prisma Config.
- Changed the generator from `prisma-client-js` to `prisma-client` with explicit output under `src/generated/prisma`.
- Ignored generated client source; `prisma generate` remains an explicit local, CI, and Docker build step.
- Updated backend imports to the generated client.
- Instantiated Prisma Client with `PrismaPg` in both application and seed paths.
- Moved the seed command from the deprecated package manifest field into Prisma Config.
- Preserved the existing PostgreSQL schema and migration history. This dependency migration introduces no database DDL or destructive data migration.

Driver-adapter pooling now follows the `pg` driver's defaults rather than Prisma 6's Rust engine defaults. TestForge does not set custom Prisma connection-pool URL parameters, and its serializable transactions, conditional inventory updates, and unique idempotency constraints remain application/database enforced.

## Actual verification

All commands used the dedicated local `testforge_test` database for test execution.

| Command/check                             | Result                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `npm run db:generate`                     | Passed; Prisma Client 7.10.1 generated                              |
| `npm run db:migrate`                      | Passed; existing migration history recognized, no pending migration |
| `npm run db:seed`                         | Passed; deterministic seed completed                                |
| Backend TypeScript check                  | Passed                                                              |
| Backend production build                  | Passed                                                              |
| Root TypeScript checks (three workspaces) | Passed                                                              |
| Root ESLint checks (three workspaces)     | Passed                                                              |
| Root Prettier check                       | Passed after restoring Next.js-generated `next-env.d.ts` formatting |
| Backend and frontend production builds    | Passed                                                              |
| API suite                                 | 11 passed, 0 failed                                                 |
| Database integration suite                | 3 passed, 0 failed                                                  |
| Complete Order Lifecycle                  | 1 passed, 0 failed                                                  |
| Full Playwright run                       | 34 passed, 0 failed, 0 skipped, 0 retried in 1.3 minutes            |
| Browser coverage                          | Chromium, Firefox, WebKit, Pixel 7 mobile Chromium                  |
| `npm audit --json` after update           | 0 total findings: 0 high, 0 critical                                |

The integration evidence includes simultaneous purchase oversell protection, cancellation/restocking, and simultaneous cancellation protection. The lifecycle test exercises UI checkout, API response validation, PostgreSQL order/payment assertions, and inventory deduction.

## Remaining verification

- Docker Desktop cannot keep its WSL backend running on this host; therefore the Node 22 Alpine image build and Compose runtime remain unverified. See `docs/M11-docker-verification.md`.
- Remote GitHub Actions must pass on this branch before integration into `main`. This is necessary evidence for Node 22 and Ubuntu runner compatibility.
- The Prisma CLI currently advertises a Prisma 8 release candidate through its unqualified `latest` tag. TestForge pins 7.10.1 exactly to avoid accidental prerelease adoption.

## Rollback and data safety

The known-good pre-migration `main` commit is `5a97b20bb548ea0d1082388f64183f88f6b9083a`. The migration is isolated on `m11/prisma-security-remediation`. No database migrations were added, modified, or rolled back, and no production/shared database was accessed.

## References

- Prisma 7 upgrade guide: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- Prisma 7 system requirements: https://www.prisma.io/docs/orm/v7/reference/system-requirements
- GitHub advisory: https://github.com/advisories/GHSA-ggr8-5vv4-36mx
