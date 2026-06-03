const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Create Enums if they don't exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE public.teller_drawer_status AS ENUM ('OPEN', 'CLOSED', 'BALANCING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE public.dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create teller_drawer table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.teller_drawer (
        drawer_id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES public.employee(employee_id) ON DELETE RESTRICT,
        branch_id INTEGER NOT NULL REFERENCES public.branch(branch_id) ON DELETE RESTRICT,
        status public.teller_drawer_status NOT NULL DEFAULT 'CLOSED',
        opening_balance NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
        current_balance NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
        opened_at TIMESTAMPTZ(6),
        closed_at TIMESTAMPTZ(6),
        created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Create dispute table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.dispute (
        dispute_id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES public.customer(customer_id) ON DELETE RESTRICT,
        transaction_id INTEGER NOT NULL REFERENCES public.transaction(transaction_id) ON DELETE RESTRICT,
        status public.dispute_status NOT NULL DEFAULT 'OPEN',
        description TEXT NOT NULL,
        remarks JSONB,
        created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Migration executed successfully via Raw SQL.");
  } catch (error) {
    console.error("Migration error:", error);
  }
}

main().finally(() => prisma.$disconnect());
