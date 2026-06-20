require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
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
