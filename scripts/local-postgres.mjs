import EmbeddedPostgres from 'embedded-postgres';

const database = new EmbeddedPostgres({
  databaseDir: '.local-postgres/data',
  user: 'testforge',
  password: 'testforge',
  port: 5432,
  persistent: true,
  onLog: (message) => console.log(String(message)),
  onError: (error) => console.error(error),
});

await database.initialise();
await database.start();
for (const name of ['testforge_dev', 'testforge_test']) {
  try {
    await database.createDatabase(name);
    console.log(`Created ${name}`);
  } catch (error) {
    if (!String(error).includes('already exists')) throw error;
  }
}
console.log('Local PostgreSQL ready on port 5432');

const stop = async () => {
  await database.stop();
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
await new Promise(() => {});
