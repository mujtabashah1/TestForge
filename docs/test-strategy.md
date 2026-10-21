# Test strategy

1. API contract tests cover status codes, schemas, validation, authorization, pagination, filtering, sorting, and idempotency.
2. Integration tests observe PostgreSQL side effects and competing transactions.
3. UI tests cover accessible interactions, authentication, protected pages, empty states, search, and responsive navigation.
4. End-to-end tests are reserved for cross-layer journeys.

Tests use role and label locators and web-first assertions. No arbitrary sleeps are used. Baseline seed data is deterministic; scenario data is unique and execution-order independent.

HTML and Allure reporters run together. Failures retain screenshots, traces, and video. High-value tests attach API responses and concurrency results. CI artifacts preserve report directories.
