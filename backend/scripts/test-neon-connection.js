const { createSeedClient, connectWithRetry } = require('./create-prisma-client');

async function main() {
  const prisma = createSeedClient();
  try {
    await connectWithRetry(prisma);
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log('Neon connection OK:', result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Neon connection FAILED:', err.message);
  process.exit(1);
});
