# Architecture decisions

The frontend is a Next.js App Router application and communicates only with the Express REST API. The API owns authentication, authorization, validation, pricing, inventory, ordering, and payment state. Prisma is the application database adapter.

Checkout uses a serializable transaction. Each inventory row is updated with an inventory-greater-than-or-equal predicate; any failed update aborts the transaction. Order items snapshot product names and prices. Unique constraints make checkout and payment idempotency keys durable.

Passwords are hashed with bcrypt cost 12. JWTs expire after two hours. Admin endpoints enforce roles server-side. Zod validates input, Helmet supplies defensive headers, Prisma parameterizes queries, and CORS is environment-restricted.

Browser, API, and integration projects have disjoint file patterns. Browser contexts are isolated. Unique Faker identifiers support parallel tests. Database helpers reject non-test targets.
