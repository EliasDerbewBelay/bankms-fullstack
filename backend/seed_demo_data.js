/**
 * Seed CoreBank MS demo org, users, accounts, and sample transactions.
 * Idempotent — safe to re-run (skips existing records, refreshes passwords).
 *
 * Run: node seed_demo_data.js
 */
const argon2 = require('argon2');
const { createSeedClient, connectWithRetry } = require('./scripts/create-prisma-client');

const prisma = createSeedClient();

const DEMO_PASSWORD = 'Password123!';

const STAFF = [
  {
    username: 'abebe.girma',
    role: 'ADMIN',
    employeeCode: 'EMP001',
    firstName: 'Abebe',
    lastName: 'Girma',
    position: 'System Administrator',
    email: 'abebe.girma@corebank.et',
  },
  {
    username: 'tigist.alemu',
    role: 'BRANCH_MANAGER',
    employeeCode: 'EMP002',
    firstName: 'Tigist',
    lastName: 'Alemu',
    position: 'Branch Manager',
    email: 'tigist.alemu@corebank.et',
  },
  {
    username: 'dawit.hailu',
    role: 'SUPERVISOR',
    employeeCode: 'EMP003',
    firstName: 'Dawit',
    lastName: 'Hailu',
    position: 'Operations Supervisor',
    email: 'dawit.hailu@corebank.et',
  },
  {
    username: 'yonas.bekele',
    role: 'TELLER',
    employeeCode: 'EMP004',
    firstName: 'Yonas',
    lastName: 'Bekele',
    position: 'Teller',
    email: 'yonas.bekele@corebank.et',
  },
  {
    username: 'hiwot.tadesse',
    role: 'BRANCH_MANAGER',
    employeeCode: 'EMP005',
    firstName: 'Hiwot',
    lastName: 'Tadesse',
    position: 'Deputy Branch Manager',
    email: 'hiwot.tadesse@corebank.et',
  },
];

const CUSTOMERS = [
  {
    username: 'meron.tadesse',
    customerCode: 'CUS001',
    firstName: 'Meron',
    lastName: 'Tadesse',
    phone: '+251911000001',
    email: 'meron.tadesse@email.et',
    nationalId: 'ET-ID-000001',
    accountNumber: '1000000001',
    balance: 125000,
  },
  {
    username: 'bereket.lemma',
    customerCode: 'CUS002',
    firstName: 'Bereket',
    lastName: 'Lemma',
    phone: '+251911000002',
    email: 'bereket.lemma@email.et',
    nationalId: 'ET-ID-000002',
    accountNumber: '1000000002',
    balance: 45000,
  },
  {
    username: 'sara.kebede',
    customerCode: 'CUS003',
    firstName: 'Sara',
    lastName: 'Kebede',
    phone: '+251911000003',
    email: 'sara.kebede@email.et',
    nationalId: 'ET-ID-000003',
    accountNumber: '1000000003',
    balance: 78000,
  },
  {
    username: 'habesha.trading',
    customerCode: 'CUS004',
    customerType: 'CORPORATE',
    companyName: 'Habesha Trading PLC',
    taxId: 'TIN-000004',
    phone: '+251911000004',
    email: 'accounts@habeshatrading.et',
    accountNumber: '2000000001',
    balance: 520000,
  },
];

async function ensureOrg() {
  let bank = await prisma.bank.findUnique({ where: { bank_code: 'COREBANK' } });
  if (!bank) {
    bank = await prisma.bank.create({
      data: {
        bank_code: 'COREBANK',
        bank_name: 'CoreBank MS',
        address: 'Bole Road, Addis Ababa',
        city: 'Addis Ababa',
        country: 'Ethiopia',
        phone_number: '+251111000000',
        email: 'info@corebank.et',
        website: 'https://corebank.et',
        swift_code: 'CRBKETAA',
        is_head_office: true,
        established_date: new Date('2020-01-01'),
      },
    });
    console.log('  Created bank: CoreBank MS');
  }

  let branch = await prisma.branch.findUnique({ where: { branch_code: 'HQ001' } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        branch_code: 'HQ001',
        branch_name: 'Addis Ababa Main Branch',
        address: 'Bole Road, Addis Ababa',
        city: 'Addis Ababa',
        phone_number: '+251111000001',
        email: 'hq@corebank.et',
        bank_id: bank.bank_id,
        opening_date: new Date('2020-01-15'),
        status: 'ACTIVE',
      },
    });
    console.log('  Created branch: HQ001');
  }

  let department = await prisma.department.findFirst({
    where: { branch_id: branch.branch_id, department_name: 'Operations' },
  });
  if (!department) {
    department = await prisma.department.create({
      data: {
        department_name: 'Operations',
        branch_id: branch.branch_id,
        cost_center: 'OPS-001',
      },
    });
    console.log('  Created department: Operations');
  }

  let etb = await prisma.currency.findUnique({ where: { currency_code: 'ETB' } });
  if (!etb) {
    etb = await prisma.currency.create({
      data: {
        currency_code: 'ETB',
        currency_name: 'Ethiopian Birr',
        symbol: 'Br',
        is_base: true,
        is_active: true,
      },
    });
    console.log('  Created currency: ETB');
  }

  let savings = await prisma.account_type.findUnique({ where: { type_name: 'Savings Account' } });
  if (!savings) {
    savings = await prisma.account_type.create({
      data: {
        type_name: 'Savings Account',
        interest_rate: 0.05,
        minimum_balance: 500,
        calc_method: 'COMPOUND_MONTHLY',
        description: 'Standard savings account',
      },
    });
    console.log('  Created account type: Savings Account');
  }

  let current = await prisma.account_type.findUnique({ where: { type_name: 'Current Account' } });
  if (!current) {
    current = await prisma.account_type.create({
      data: {
        type_name: 'Current Account',
        interest_rate: 0,
        minimum_balance: 1000,
        calc_method: 'SIMPLE',
        description: 'Business current account',
      },
    });
    console.log('  Created account type: Current Account');
  }

  return { bank, branch, department, etb, savings, current };
}

async function ensureStaffUser(staff, org, passwordHash) {
  const existing = await prisma.online_user.findUnique({
    where: { username: staff.username },
    include: { linked_employee: true },
  });
  if (existing) {
    await prisma.online_user.update({
      where: { user_id: existing.user_id },
      data: {
        password_hash: passwordHash,
        must_change_password: false,
        account_locked: false,
        failed_login_attempts: 0,
        lockout_until: null,
      },
    });
    console.log(`  Updated password: ${staff.username}`);
    return existing.linked_employee?.employee_id ?? null;
  }

  const employee = await prisma.employee.create({
    data: {
      employee_code: staff.employeeCode,
      first_name: staff.firstName,
      last_name: staff.lastName,
      position: staff.position,
      employee_type: 'FULL_TIME',
      salary: 25000,
      hire_date: new Date('2021-03-01'),
      phone_number: '+251911100000',
      email: staff.email,
      branch_id: org.branch.branch_id,
      department_id: org.department.department_id,
    },
  });

  await prisma.online_user.create({
    data: {
      username: staff.username,
      password_hash: passwordHash,
      salt: 'argon2',
      role: staff.role,
      linked_employee_id: employee.employee_id,
      must_change_password: false,
    },
  });

  console.log(`  Created staff user: ${staff.username} (${staff.role})`);
  return employee.employee_id;
}

async function ensureCustomerUser(customer, org, passwordHash, openedById) {
  const existing = await prisma.online_user.findUnique({ where: { username: customer.username } });
  if (existing) {
    await prisma.online_user.update({
      where: { user_id: existing.user_id },
      data: {
        password_hash: passwordHash,
        must_change_password: false,
        account_locked: false,
        failed_login_attempts: 0,
        lockout_until: null,
      },
    });
    console.log(`  Updated password: ${customer.username}`);
    return;
  }

  const isCorporate = customer.customerType === 'CORPORATE';
  const dbCustomer = await prisma.customer.create({
    data: {
      customer_code: customer.customerCode,
      customer_type: isCorporate ? 'CORPORATE' : 'INDIVIDUAL',
      first_name: isCorporate ? null : customer.firstName,
      last_name: isCorporate ? null : customer.lastName,
      company_name: isCorporate ? customer.companyName : null,
      tax_id: isCorporate ? customer.taxId : null,
      national_id: isCorporate ? null : customer.nationalId,
      address: 'Addis Ababa, Ethiopia',
      city: 'Addis Ababa',
      phone_number: customer.phone,
      email: customer.email,
      kyc_status: 'VERIFIED',
      risk_profile: 'LOW',
      relationship_manager_id: openedById ?? null,
    },
  });

  const accountType = isCorporate ? org.current : org.savings;
  const account = await prisma.account.create({
    data: {
      account_number: customer.accountNumber,
      iban: `ET${customer.accountNumber}`,
      account_type_id: accountType.account_type_id,
      currency_id: org.etb.currency_id,
      balance: customer.balance,
      available_balance: customer.balance,
      branch_id: org.branch.branch_id,
      opened_by_employee_id: openedById ?? null,
      status: 'ACTIVE',
    },
  });

  await prisma.customer_account.create({
    data: {
      customer_id: dbCustomer.customer_id,
      account_id: account.account_id,
      ownership_percentage: 100,
      is_primary_owner: true,
      relationship_type: 'SOLE_OWNER',
    },
  });

  await prisma.online_user.create({
    data: {
      username: customer.username,
      password_hash: passwordHash,
      salt: 'argon2',
      role: 'CUSTOMER',
      linked_customer_id: dbCustomer.customer_id,
      must_change_password: false,
    },
  });

  console.log(`  Created customer user: ${customer.username}`);
}

async function ensureSampleTransactions(org, tellerEmployeeId) {
  const count = await prisma.transaction.count();
  if (count > 0) {
    console.log(`  Transactions already exist (${count}), skipping sample tx`);
    return;
  }

  const accounts = await prisma.account.findMany({
    where: { account_number: { in: ['1000000001', '1000000002'] } },
  });
  if (accounts.length < 2) return;

  const from = accounts.find((a) => a.account_number === '1000000001');
  const to = accounts.find((a) => a.account_number === '1000000002');

  await prisma.transaction.create({
    data: {
      reference_number: 'TXN-DEMO-0001',
      transaction_type: 'INTERNAL_TRANSFER',
      channel: 'INTERNET',
      amount: 5000,
      currency_id: org.etb.currency_id,
      account_id: from.account_id,
      to_account_id: to.account_id,
      processed_by_employee_id: tellerEmployeeId,
      status: 'COMPLETED',
      description: 'Demo internal transfer',
      transaction_date: new Date(),
    },
  });

  await prisma.transaction.create({
    data: {
      reference_number: 'TXN-DEMO-0002',
      transaction_type: 'DEPOSIT',
      channel: 'BRANCH',
      amount: 10000,
      currency_id: org.etb.currency_id,
      account_id: from.account_id,
      to_account_id: from.account_id,
      processed_by_employee_id: tellerEmployeeId,
      status: 'COMPLETED',
      description: 'Demo cash deposit',
      transaction_date: new Date(Date.now() - 86400000),
    },
  });

  console.log('  Created 2 sample transactions');
}

async function main() {
  console.log('Seeding CoreBank MS demo data...\n');
  await connectWithRetry(prisma);
  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const org = await ensureOrg();
  console.log('\nStaff users:');

  let tellerId = null;
  for (const staff of STAFF) {
    const employeeId = await ensureStaffUser(staff, org, passwordHash);
    if (staff.username === 'yonas.bekele') tellerId = employeeId;
  }

  const rm = await prisma.employee.findUnique({ where: { employee_code: 'EMP002' } });

  console.log('\nCustomer users:');
  for (const customer of CUSTOMERS) {
    await ensureCustomerUser(customer, org, passwordHash, rm?.employee_id);
  }

  console.log('\nSample data:');
  await ensureSampleTransactions(org, tellerId);

  const userCount = await prisma.online_user.count();
  console.log(`\nDone. ${userCount} online user(s) in database.`);
  console.log(`Login with any demo username and password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
