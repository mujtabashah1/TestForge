import { app } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';

const server = app.listen(config.PORT, () =>
  console.log(`TestForge API listening on ${config.PORT}`),
);
const shutdown = () => server.close(() => void prisma.$disconnect().finally(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
