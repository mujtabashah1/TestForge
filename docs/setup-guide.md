# Setup and troubleshooting

Use docker compose up --build -d and scripts/wait-for-services.ps1. Compose creates development and test databases; the backend applies its migration and seed.

For native execution, create both databases, copy example environments, and run generation, migration, and seed commands from the repository root.

- Prisma P1001: PostgreSQL is unreachable or the URL is wrong.
- Browser executable missing: run npx playwright install.
- Authentication required: sign in and verify browser-to-API connectivity.
- CORS error: FRONTEND_URL must exactly match the UI origin.
- Cleanup refusal: use a dedicated database ending in _test.
- Port conflict: free or consistently remap 3000, 4000, or 5432.
