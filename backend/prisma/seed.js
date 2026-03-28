const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Skip if data already exists
  const existing = await prisma.company.findFirst();
  if (existing) {
    console.log('Database already seeded — skipping.');
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: 'BuildMetry Demo Co.',
      owner: 'Admin User',
      email: 'admin@buildmetry.com',
      defaultTaxRate: 0,
      paymentTerms: 0,
      laborBurdenDefault: 0,
    },
  });

  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Admin User',
      email: 'admin@buildmetry.com',
      passwordHash,
      role: 'Admin',
      status: 'active',
    },
  });

  await prisma.laborRole.createMany({
    data: [
      { companyId: company.id, title: 'General Laborer', baseRate: 22, payrollPct: 15.3, benefitsPct: 12.0 },
      { companyId: company.id, title: 'Skilled Tradesman', baseRate: 35, payrollPct: 15.3, benefitsPct: 12.0 },
      { companyId: company.id, title: 'Foreman', baseRate: 48, payrollPct: 15.3, benefitsPct: 12.0 },
      { companyId: company.id, title: 'Project Manager', baseRate: 65, payrollPct: 15.3, benefitsPct: 12.0 },
    ],
  });

  await prisma.projectPhase.createMany({
    data: [
      { companyId: company.id, name: 'Pre-Construction', sortOrder: 1 },
      { companyId: company.id, name: 'Foundation', sortOrder: 2 },
      { companyId: company.id, name: 'Framing', sortOrder: 3 },
      { companyId: company.id, name: 'Rough-In', sortOrder: 4 },
      { companyId: company.id, name: 'Insulation', sortOrder: 5 },
      { companyId: company.id, name: 'Drywall', sortOrder: 6 },
      { companyId: company.id, name: 'Finishes', sortOrder: 7 },
      { companyId: company.id, name: 'Punch List', sortOrder: 8 },
    ],
  });

  console.log(`Seeded company id=${company.id}`);
  console.log('Admin login: admin@buildmetry.com / Admin1234!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
