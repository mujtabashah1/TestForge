# Release readiness checklist

## Local quality gates

- [x] Repository and original commits inspected
- [x] Dependency installation completed with `npm ci`
- [x] Prisma client generated
- [x] TypeScript passed in all workspaces
- [x] ESLint passed in all workspaces
- [x] Prettier check passed
- [x] Backend and frontend production builds passed
- [x] Development and test migrations passed
- [x] Development and test seeds passed
- [x] API, integration, UI, E2E, and full regression executed
- [x] Cross-user checkout idempotency boundary tested
- [x] Concurrent cancellation/restock behavior tested
- [x] Lifecycle navigation fix repeated three times
- [x] Final post-documentation regression recorded: 34 passed in 1.1m

## Security

- [x] Current files scanned for high-confidence secret signatures
- [x] Reachable Git history scanned for high-confidence secret signatures
- [x] Only placeholder/example environment files are tracked
- [x] Generated reports, traces, logs, build output, local database, and node_modules are ignored
- [x] JWT, bcrypt, authorization, CORS, input validation, payment simulation, and database protections reviewed
- [x] npm audit and actual dependency paths inspected
- [ ] Plan and validate a Prisma 7 migration before replacing Prisma 6

## Infrastructure and delivery

- [x] Compose YAML parsed
- [x] GitHub Actions YAML parsed
- [x] CI browser smoke, lifecycle, cross-browser, reports, and service logs configured
- [ ] Docker images built locally - blocked because Docker is not installed
- [ ] Compose services and health checks run - blocked because Docker is not installed
- [x] GitHub account verified as `mujtabashah1`
- [x] Public repository created at `mujtabashah1/TestForge`
- [x] Local commits pushed without force
- [x] Remote `main` verified against local source commit
- [x] Replacement GitHub Actions runs passed on `092b2aa`

## Documentation and evidence

- [x] README architecture, commands, reports, CI, and limitations reviewed
- [x] Architecture, strategy, coverage, setup, status, M10 audit, matrix, and checklist present
- [x] Genuine application screenshots committed
- [x] Local HTML/Allure/failure evidence locations documented
- [x] CI run links/results recorded after publication

Release readiness remains partial only because Docker runtime verification is blocked on this host.
