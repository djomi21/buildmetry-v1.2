var PrismaClient = require('@prisma/client').PrismaClient;
var bcrypt = require('bcryptjs');
var prisma = new PrismaClient();

async function main() {
  console.log('Seeding Buildmetry database...\n');

  // ── Company ────────────────────────────────────────
  var company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'JB Construction LLC', owner: 'Jason Braddock', phone: '(512) 555-0199',
      email: 'jason@jbconstruction.com', address: '2801 S Lamar Blvd, Suite 210, Austin TX 78704',
      website: 'www.jbconstruction.com', license: 'TX GC License #28841', ein: '74-3229901',
      defaultTaxRate: 6.5, paymentTerms: 30, laborBurdenDefault: 28.3,
      invoiceFooter: 'Thank you for your business. Payment due within terms shown above.',
      estimateFooter: 'This estimate is valid for 30 days. Prices subject to change after expiry.',
      smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: true,
      emailSubjectEstimate: 'Estimate #{number} from {company}',
      emailSubjectInvoice: 'Invoice #{number} from {company}',
      themeAccent: '#3b82f6', themeName: 'Ocean Blue',
    }
  });
  console.log('  + Company: ' + company.name);

  // ── Owner user ─────────────────────────────────────
  var passwordHash = await bcrypt.hash('contractor123', 12);
  var existing = await prisma.user.findUnique({ where: { email: 'jason@jbconstruction.com' } });
  if (!existing) {
    await prisma.user.create({
      data: { companyId: company.id, name: 'Jason Braddock', email: 'jason@jbconstruction.com', passwordHash: passwordHash, phone: '(512)555-0199', role: 'Owner', status: 'active', lastLogin: new Date() }
    });
    console.log('  + Owner user (jason@jbconstruction.com / contractor123)');
  } else {
    await prisma.user.update({ where: { email: 'jason@jbconstruction.com' }, data: { passwordHash: passwordHash } });
    console.log('  ~ Owner password reset');
  }

  // ── Customers (7) ──────────────────────────────────
  var custs = [
    
  ];
  for (var c of custs) { await prisma.customer.upsert({ where: { id: custs.indexOf(c) + 1 }, update: {}, create: c }); }
  console.log('  + 0 customers');

  // ── Materials (25) ─────────────────────────────────
  var mats = [
    { name:'Framing Lumber 2x4x8',unit:'ea',category:'Lumber',supplier:'Home Depot',cost:4.82,markup:20,stock:180,reorderAt:50 },
    { name:'Framing Lumber 2x6x8',unit:'ea',category:'Lumber',supplier:'Home Depot',cost:6.40,markup:20,stock:85,reorderAt:40 },
    { name:'OSB Sheathing 4x8',unit:'sheet',category:'Lumber',supplier:'Home Depot',cost:22.50,markup:18,stock:60,reorderAt:20 },
    { name:'Drywall 4x8 half inch',unit:'sheet',category:'Drywall',supplier:'ABC Supply',cost:14.80,markup:22,stock:120,reorderAt:40 },
    { name:'Drywall 4x8 Fire Rated',unit:'sheet',category:'Drywall',supplier:'ABC Supply',cost:17.20,markup:22,stock:48,reorderAt:20 },
    { name:'LVP Flooring',unit:'SF',category:'Flooring',supplier:'Floor & Decor',cost:2.80,markup:35,stock:840,reorderAt:200 },
    { name:'Hardwood Flooring',unit:'SF',category:'Flooring',supplier:'Floor & Decor',cost:5.60,markup:35,stock:320,reorderAt:100 },
    { name:'Ceramic Floor Tile 12x12',unit:'SF',category:'Tile',supplier:'Floor & Decor',cost:2.10,markup:40,stock:600,reorderAt:150 },
    { name:'Porcelain Wall Tile 4x12',unit:'SF',category:'Tile',supplier:'Floor & Decor',cost:3.40,markup:40,stock:420,reorderAt:100 },
    { name:'Interior Paint 1 gal',unit:'gal',category:'Paint',supplier:'Sherwin-Williams',cost:32.00,markup:30,stock:28,reorderAt:10 },
    { name:'Exterior Paint 1 gal',unit:'gal',category:'Paint',supplier:'Sherwin-Williams',cost:38.00,markup:28,stock:18,reorderAt:8 },
    { name:'PVC Pipe half inch',unit:'LF',category:'Plumbing',supplier:'Ferguson',cost:0.68,markup:45,stock:320,reorderAt:80 },
    { name:'Kitchen Faucet Mid',unit:'ea',category:'Plumbing',supplier:'Ferguson',cost:145,markup:40,stock:4,reorderAt:2 },
    { name:'Toilet 1.28 GPF',unit:'ea',category:'Plumbing',supplier:'Ferguson',cost:188,markup:35,stock:3,reorderAt:2 },
    { name:'14/2 NM Wire',unit:'roll',category:'Electrical',supplier:'Graybar',cost:58,markup:30,stock:12,reorderAt:4 },
    { name:'20A GFCI Outlet',unit:'ea',category:'Electrical',supplier:'Graybar',cost:14,markup:50,stock:24,reorderAt:10 },
    { name:'LED Recessed 6 inch',unit:'ea',category:'Electrical',supplier:'Graybar',cost:18,markup:45,stock:36,reorderAt:12 },
    { name:'Composite Decking 1x6',unit:'LF',category:'Decking',supplier:'Home Depot',cost:4.20,markup:30,stock:600,reorderAt:150 },
    { name:'Concrete Mix 80lb',unit:'bag',category:'Concrete',supplier:'Home Depot',cost:6.80,markup:20,stock:80,reorderAt:30 },
    { name:'R-19 Batt Insulation',unit:'roll',category:'Insulation',supplier:'ABC Supply',cost:38,markup:25,stock:22,reorderAt:8 },
    { name:'Exterior Door 36 inch',unit:'ea',category:'Doors & Windows',supplier:'Home Depot',cost:320,markup:35,stock:3,reorderAt:1 },
    { name:'12/2 NM Wire',unit:'roll',category:'Electrical',supplier:'Graybar',cost:72,markup:30,stock:10,reorderAt:4 },
    { name:'R-13 Batt Insulation',unit:'roll',category:'Insulation',supplier:'ABC Supply',cost:28,markup:25,stock:30,reorderAt:10 },
    { name:'Cement Board 3x5',unit:'sheet',category:'Drywall',supplier:'ABC Supply',cost:16.40,markup:22,stock:35,reorderAt:12 },
    { name:'Deck Rail System',unit:'ea',category:'Decking',supplier:'Home Depot',cost:280,markup:30,stock:5,reorderAt:2 },
  ];
  for (var m of mats) { await prisma.material.upsert({ where: { id: mats.indexOf(m) + 1 }, update: {}, create: { companyId: company.id, ...m } }); }
  console.log('  + 25 materials');

  // ── Subcontractors (10) ────────────────────────────
  var subs = [
    
  ];
  for (var s of subs) { await prisma.subcontractor.upsert({ where: { id: subs.indexOf(s) + 1 }, update: {}, create: { companyId: company.id, ...s } }); }
  console.log('  + 0 subcontractors');

  // ── Labor Roles (10) ───────────────────────────────
  var roles = [
    { title:'Carpenter',baseRate:32,payrollPct:15.3,benefitsPct:12.5 },
    { title:'Electrician',baseRate:42,payrollPct:15.3,benefitsPct:14.0 },
    { title:'Plumber',baseRate:40,payrollPct:15.3,benefitsPct:14.0 },
    { title:'Tile Setter',baseRate:36,payrollPct:15.3,benefitsPct:11.0 },
    { title:'Laborer',baseRate:22,payrollPct:15.3,benefitsPct:8.0 },
    { title:'Painter',baseRate:28,payrollPct:15.3,benefitsPct:10.0 },
    { title:'Framer',baseRate:34,payrollPct:15.3,benefitsPct:12.0 },
    { title:'HVAC Technician',baseRate:44,payrollPct:15.3,benefitsPct:15.0 },
    { title:'Roofer',baseRate:35,payrollPct:15.3,benefitsPct:18.0 },
    { title:'Mason',baseRate:38,payrollPct:15.3,benefitsPct:13.0 },
  ];
  for (var r of roles) { await prisma.laborRole.upsert({ where: { id: roles.indexOf(r) + 1 }, update: {}, create: { companyId: company.id, ...r } }); }
  console.log('  + 10 labor roles');

  // ── Project Phases ──────────────────────────────────
  var phaseNames = ['Initiation (feasibility)','Planning & Design (blueprints)','Pre-construction (permits/site prep)','Procurement (bidding/materials)','Construction (execution/monitoring)','Closeout (final inspection/handover)'];
  for (var i = 0; i < phaseNames.length; i++) {
    await prisma.projectPhase.upsert({
      where: { companyId_name: { companyId: company.id, name: phaseNames[i] } },
      update: { sortOrder: i },
      create: { companyId: company.id, name: phaseNames[i], sortOrder: i },
    });
  }
  console.log('  + 6 project phases');

  // ── Projects (5) ───────────────────────────────────
  var projects = [
    
  ];
  for (var p of projects) { await prisma.project.upsert({ where: { id: p.id }, update: {}, create: p }); }
  console.log('  + 0 projects');

  // ── Estimates (6) ──────────────────────────────────
  var estimates = [
    
  ];
  for (var e of estimates) { await prisma.estimate.upsert({ where: { id: e.id }, update: {}, create: e }); }
  console.log('  + 0 estimates');

  // ── Invoices (5) ───────────────────────────────────
  var invoices = [
    
  ];
  for (var inv of invoices) { await prisma.invoice.upsert({ where: { id: inv.id }, update: {}, create: inv }); }
  console.log('  + 0 invoices');

  // ── Change Orders (3) ──────────────────────────────
  var cos = [
    
  ];
  for (var co of cos) { await prisma.changeOrder.upsert({ where: { id: co.id }, update: {}, create: co }); }
  console.log('  + 0 change orders');

  // ── Expenses (8) ───────────────────────────────────
  var expenses = [
    
    
  ];
  for (var ex of expenses) { await prisma.expense.upsert({ where: { id: expenses.indexOf(ex) + 1 }, update: {}, create: ex }); }
  console.log('  + 0 expenses');

  // ── Time Entries (15) ──────────────────────────────
  var hours = [
    
  ];
  for (var h of hours) { await prisma.timeEntry.upsert({ where: { id: hours.indexOf(h) + 1 }, update: {}, create: h }); }
  console.log('  + 0 time entries');

  console.log('\nSeed complete!\n');
  console.log('  Login: jason@jbconstruction.com / contractor123');
  console.log('  Records: 0 customers, 25 materials, 0 subs, 10 roles,');
  console.log('           0 projects, 0 estimates, 0 invoices,');
  console.log('           0 change orders, 0 expenses, 0 time entries\n');
}

main()
  .then(function() { return prisma.$disconnect(); })
  .catch(function(e) { console.error(e); process.exit(1); });
