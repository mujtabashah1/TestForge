# M11 Authentication and Session Security

Assessment date: 2026-10-23 (Asia/Karachi)

Status: **Partially Verified** pending remote cross-browser verification of the final branch. The targeted API and Chromium security scenarios pass locally.

## Design decision

TestForge retains its documented bearer-token API contract. A migration to HTTP-only cookies would require coordinated credentialed CORS, CSRF tokens, cookie-domain policy, Playwright fixture changes, and a deployment topology decision. Mixing cookies into the existing bearer flow without those controls would not be a security improvement.

M11 instead adds server-side invalidation and current-account authorization to the bearer model:

- JWTs contain a user ID and database-backed token version, expire after two hours, and are restricted to HS256.
- Tokens carry and validate an explicit issuer (`testforge-api`), audience (`testforge-web`), and matching subject/user ID.
- Authentication reloads the user for every protected request and rejects missing, deleted, deactivated, version-mismatched, malformed, or expired sessions.
- The current database role is authoritative. Role elevation or downgrade takes effect on the next request; the middleware no longer trusts a stale role claim.
- Logout atomically increments the user's token version. Previously issued tokens for that user are rejected afterward.
- The browser Sign out action calls the revoking endpoint before clearing local state.
- Production configuration rejects the built-in development JWT secret. Environment examples document issuer/audience values and a non-secret placeholder.

This is global per-user revocation: logging out invalidates all tokens issued at the current token version, not only one browser. That tradeoff is intentional for the current portfolio scope and avoids pretending to provide per-device sessions without a session table.

## Database migration

Migration `20261023000000_auth_session_hardening` adds two non-null fields with safe defaults:

| Field               | Default | Purpose                                            |
| ------------------- | ------- | -------------------------------------------------- |
| `User.active`       | `true`  | Immediate account-deactivation enforcement         |
| `User.tokenVersion` | `0`     | Server-side invalidation of previously issued JWTs |

The migration is additive and does not modify passwords, roles, orders, or existing relationships. It was applied successfully to the dedicated local `testforge_test` database, followed by the deterministic seed.

## Security coverage

The API suite now genuinely verifies:

1. Valid registration and login.
2. Missing credentials and invalid passwords.
3. Missing and malformed bearer tokens.
4. A correctly signed but expired token.
5. Successful access before logout and rejection when the same token is replayed after logout.
6. Customer denial at an admin endpoint, immediate elevation after a database role change, and immediate denial after downgrade using the same token.
7. Immediate rejection of an existing token after account deactivation and rejection of a new login for the inactive account.
8. Existing cross-customer order/idempotency isolation and customer/admin permission tests.

The UI logout test captures the browser's token, clicks Sign out, verifies a 204 response from `/auth/logout`, confirms local storage is cleared, and then proves the captured token receives 401 from `/auth/me`.

Test-generated users and products use unique identifiers and are removed in `finally` cleanup blocks. Direct role/deactivation updates use the guarded `_test` database helper; no production or shared database is used.

## Local verification evidence

| Verification                       | Actual result                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Migration deploy                   | Passed; two migrations recognized and the auth migration applied                                      |
| Deterministic seed                 | Passed                                                                                                |
| TypeScript checks                  | Passed in all three workspaces                                                                        |
| ESLint                             | Passed in all three workspaces                                                                        |
| Prettier                           | Passed after line-ending normalization                                                                |
| Backend production build           | Passed                                                                                                |
| Frontend production build          | Passed                                                                                                |
| Targeted authentication API        | 7 passed, 0 failed                                                                                    |
| Complete API suite                 | 15 passed, 0 failed                                                                                   |
| Database integration suite         | 3 passed, 0 failed                                                                                    |
| Targeted Chromium UI logout/replay | 1 passed, 0 failed                                                                                    |
| First expanded full run            | 38 passed, 0 failed in 55.5 seconds before UI logout coverage was added                               |
| Final expanded full-run attempt    | 35 passed, 6 WebKit process failures; no WebKit assertion executed                                    |
| Focused WebKit rerun               | 7 process failures at `browserContext.newPage`; Playwright WebKit exited cleanly before page creation |
| Dependency audit                   | 0 findings                                                                                            |
| Production-secret guard            | Missing production secret rejected; explicit test secret accepted                                     |

The WebKit failures are recorded as failures, not passing tests or retries. At failure time the host reported approximately 4.0 GB free physical memory and 1.2 GB free virtual memory. Playwright diagnostics showed `Playwright.exe` launching and exiting with code 0 before a page could be created, without an application assertion. Earlier M11 and M10 WebKit executions passed on the same installation. A remote Linux browser-regression run is required before integration; local WebKit remains an environment limitation unless a host reboot/resource recovery resolves it.

## Residual risks and limitations

- Tokens remain in `localStorage`, so a successful same-origin XSS could steal a token. Helmet, React escaping, input validation, and short expiry reduce but do not eliminate that risk.
- If the browser cannot reach the API during Sign out, local state is still cleared but the server cannot revoke the token. The token remains valid until expiry or a later token-version change.
- Logout revokes all current-version tokens for the user; per-device session management would require a persisted session/JTI table.
- There is no user-administration UI/API for role changes or deactivation. Enforcement is implemented and tested through controlled database state changes.
- Password reset, MFA, refresh-token rotation, key rotation, and distributed revocation caching are outside the current portfolio scope.
- Playwright traces can contain authorization headers. Generated reports/traces are ignored by Git and CI retention should remain restricted.

## Future cookie migration requirements

If TestForge later adopts cookies, it should do so as a separate architecture change: HTTP-only and Secure cookies in production, an explicit SameSite policy, credentialed CORS restricted to the deployed frontend origin, CSRF protection for state-changing requests, session rotation, and updated automation fixtures. Bearer and cookie authentication should not be silently mixed.
