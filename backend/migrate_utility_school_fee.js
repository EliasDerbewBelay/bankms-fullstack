const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // schema.sql defines SCHOOL_FEE on public.utility_type; ensure the DB enum has it.
    await prisma.$executeRawUnsafe(
      `ALTER TYPE public.utility_type ADD VALUE IF NOT EXISTS 'SCHOOL_FEE';`
    );
    console.log('utility_type.SCHOOL_FEE ensured.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exitCode = 1;
  }
}

main().finally(() => prisma.$disconnect());
