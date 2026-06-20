/**
 * Reset demo user passwords to: Password123!
 * Run with: node reset_demo_passwords.js
 */
const argon2 = require('argon2');
const { createSeedClient, connectWithRetry } = require('./scripts/create-prisma-client');

const prisma = createSeedClient();

const DEMO_USERS = [
  'abebe.girma',
  'tigist.alemu',
  'dawit.hailu',
  'yonas.bekele',
  'hiwot.tadesse',
  'meron.tadesse',
  'bereket.lemma',
  'sara.kebede',
  'habesha.trading',
];

const NEW_PASSWORD = 'Password123!';

async function main() {
  await connectWithRetry(prisma);
  console.log(`Resetting passwords to: ${NEW_PASSWORD}\n`);
  const hash = await argon2.hash(NEW_PASSWORD);

  let updated = 0;
  for (const username of DEMO_USERS) {
    const result = await prisma.online_user.updateMany({
      where: { username },
      data: { password_hash: hash },
    });
    if (result.count > 0) {
      console.log(`  ✅ Reset: ${username}`);
      updated++;
    } else {
      console.log(`  ⚠️  Not found: ${username}`);
    }
  }

  console.log(`\nDone. Updated ${updated} user(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
