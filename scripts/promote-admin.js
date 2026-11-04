require('reflect-metadata');
const { DataSource } = require('typeorm');
const { databaseOptions } = require('../src/database');
const { User } = require('../src/entities/user.entity');

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run admin:promote -- email@example.com');
  }

  const database = new DataSource({
    ...databaseOptions(process.env),
    synchronize: false,
  });
  await database.initialize();
  try {
    const users = database.getRepository(User);
    const user = await users.findOneBy({ Email: email });
    if (!user)
      throw new Error(
        'Register the account before granting administrator access',
      );
    await users.update({ UserID: user.UserID }, { Role: 'admin' });
    console.log('Administrator access granted.');
  } finally {
    await database.destroy();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
