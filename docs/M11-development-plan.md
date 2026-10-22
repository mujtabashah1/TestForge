# M11 Development Plan

Audit date: 2026-10-23 (Asia/Karachi)

## Scope

M11 continues the existing TestForge implementation. It does not rebuild the application or replace its established Next.js, Express, Prisma, PostgreSQL, and Playwright architecture. Work is ordered as Docker runtime verification, Prisma dependency assessment/remediation, targeted authentication hardening, regression and CI verification, then documentation and publication.

## Factual starting state

### Repository

- Local repository: `D:\TestForge`
- Branch: `main`
- Local HEAD at audit start: `270278318504c577bb0700fcc10c1704b6af70e3`
- `origin/main` after `git fetch origin --prune`: the same commit
- Working tree at audit start: clean
- Remote: `https://github.com/mujtabashah1/TestForge.git`
- The seven documented M0-M10 commits are present; no history rewrite or divergence was observed.

### Toolchain and test inventory

- Windows 10 Pro build 19045, 64-bit; Hyper-V is reported present.
- Node.js `v24.11.1`, npm `11.6.2`, Git `2.54.0.windows.1`.
- WSL default version is 2, but `wsl --list --verbose` reports no normally installed user distribution.
- Playwright discovery finds 34 configured test executions in 10 source spec files: 11 API, 3 integration, 6 each on Chromium/Firefox/WebKit, 1 mobile Chromium, and 1 Chromium lifecycle E2E. This is discovery evidence, not a new passing test result.
- The latest verified regression and GitHub Actions evidence remains the M10 evidence recorded in `docs/M10-independent-audit.md`; M11 regression has not yet been run.

### Docker baseline

- Docker Desktop `4.96.3` is installed per-user under `C:\Users\PERSONAL\AppData\Local\Programs\DockerDesktop` but its binaries are not on `PATH`.
- The bundled client is Docker `29.9.2`; Docker Compose is `v5.6.1`.
- `docker compose config --quiet` parses the repository Compose file successfully.
- The Docker daemon was initially absent. Starting Docker Desktop caused the backend to exit while creating the `docker-desktop` WSL instance with `Wsl/Service/CreateInstance/0x80072746` (the connection was forcibly closed by the remote host).
- Consequently image builds, container health, PostgreSQL persistence, restart recovery, and container-targeted tests are not yet verified.

### Dependency-security baseline

- Installed dependency chain: `prisma@6.19.3` -> `@prisma/config@6.19.3` -> `deepmerge-ts@7.1.5`.
- GitHub advisory `GHSA-ggr8-5vv4-36mx` affects `deepmerge-ts <8.0.0`; version `8.0.0` is patched. Exploitation requires merging crafted recursive object graphs and affects availability.
- The vulnerable package is reached through the Prisma CLI/configuration dependency, not the generated production Prisma Client request path.
- An M11 `npm audit --json` request returned zero findings even though the installed affected version and the advisory remain present. This conflicts with M10's final three-high result and is treated as advisory-service inconsistency, not remediation.
- Prisma 6.19.3 is the final published Prisma 6 release. Prisma 7.10.1 uses `deepmerge-ts@8.0.2`; the Prisma CLI currently exposes a Prisma 8 release candidate as its `latest` dist-tag, so upgrades must use an explicit stable version rather than an unqualified tag.
- Prisma 7 is a major migration: official documentation requires ESM-compatible configuration, Node.js >=20.19, TypeScript >=5.4, `prisma.config.ts`, explicit generated-client output, and a PostgreSQL driver adapter. TestForge meets the Node/TypeScript minimums but requires code, build, seed, migration, pooling, Docker, and CI validation.

### Authentication baseline

- The API issues two-hour bearer JWTs and the frontend stores the token in `localStorage`.
- Authentication verifies the token signature but currently trusts the role claim without reloading the user.
- Logout returns HTTP 204 and clears browser state, but the server does not revoke the token.
- There is no account-active flag or session/token version, so role changes and deactivation cannot invalidate existing claims immediately.
- Protected endpoints and role checks exist, and M10 added verified cross-customer order/payment isolation. The residual replay, stale-role, and browser-storage risks remain.

## Planned implementation

| Milestone | Planned work                                                                                                                                                                            | Acceptance evidence                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| M11.0     | Preserve baseline, record actual inventory and constraints                                                                                                                              | This plan committed and pushed without runtime behavior changes                                        |
| M11.1     | Attempt supported WSL/Docker recovery; validate Compose; if the daemon becomes available, build, start, migrate, seed, smoke-test, restart, and verify persistence                      | `docs/M11-docker-verification.md` with commands, logs, and explicit Verified/Blocked/Not tested labels |
| M11.2     | Assess Prisma 7.10.1 on a dedicated branch; migrate only if generation, migrations, seed, transactions, Docker/CI compatibility, and regression can be proven                           | `docs/M11-prisma-migration-assessment.md`, audit before/after, targeted and full test evidence         |
| M11.3     | Retain the bearer-token API contract while adding server-side revocation/version checks, live role enforcement, and account-active enforcement; document the residual localStorage risk | New authentication/security regression tests and `docs/M11-authentication-security.md`                 |
| M11.4     | Run static checks, builds, migrations/seeding, all test projects, full regression, then inspect actual GitHub Actions runs                                                              | Exact counts/durations and remote run URLs; no inference from configuration alone                      |
| M11.5     | Synchronize status, milestone matrix, release checklist, and final verification; commit and push only tested changes                                                                    | Matching local/remote commits and clean status                                                         |

## Guardrails and current blockers

- No production or shared database will be reset. Destructive database tests retain the existing `_test` database-name guard.
- No forced audit update, force push, history rewrite, or unrelated refactor is planned.
- Major Prisma work will not be pushed directly to the known-good `main` branch before branch-level verification.
- Docker runtime work is currently blocked by the host WSL failure. Static Compose validation passed, but it is not a substitute for runtime verification.
- A cookie/CSRF architecture migration is not assumed. The first security target is coherent server-side invalidation for the existing bearer model; HTTP-only cookie adoption remains a separate design decision unless evidence justifies expanding scope.

## Authoritative references used for the migration decision

- Prisma ORM 7 upgrade guide: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- Prisma ORM 7 system requirements: https://www.prisma.io/docs/orm/v7/reference/system-requirements
- GitHub advisory GHSA-ggr8-5vv4-36mx: https://github.com/advisories/GHSA-ggr8-5vv4-36mx
