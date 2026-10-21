$dbUrl = if ($env:TEST_DATABASE_URL) { $env:TEST_DATABASE_URL } else { 'postgresql://testforge:testforge@localhost:5432/testforge_test?schema=public' }
if ($dbUrl -notmatch 'testforge_test') { throw 'Refusing to reset a database not named testforge_test' }
$env:DATABASE_URL = $dbUrl
npm run db:migrate
npm run db:seed
