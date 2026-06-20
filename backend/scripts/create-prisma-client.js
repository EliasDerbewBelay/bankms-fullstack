/**
 * Prisma client for one-off seed/migration scripts.
 * Uses DIRECT_URL (more reliable than pooler for scripts) with retry for Neon cold starts.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');

function createSeedClient() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL / DIRECT_URL in backend/.env');
    process.exit(1);
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(prisma, attempts = 5, delayMs = 5000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$connect();
      if (i > 1) console.log('Database connected.');
      return;
    } catch (err) {
      console.warn(`Connection attempt ${i}/${attempts} failed: ${err.message}`);
      if (i === attempts) {
        console.error(
          '\nCould not reach Neon. Check:\n' +
            '  • backend/.env has valid DATABASE_URL and DIRECT_URL\n' +
            '  • Neon project is active (console.neon.tech)\n' +
            '  • Internet connection is working\n' +
            '  • Free-tier DB may be waking from sleep — run the command again in ~30s'
        );
        throw err;
      }
      console.log(`Retrying in ${delayMs / 1000}s (Neon may be waking up)...`);
      await sleep(delayMs);
    }
  }
}

module.exports = { createSeedClient, connectWithRetry };
