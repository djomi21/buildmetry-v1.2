// ── GLOBAL CONSTANTS ───────────────────────────────────────────
export const TAX = 6.5;

export const FONT_URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap';

// ── CHART DATA TEMPLATE ────────────────────────────────────────
export const REV_DATA = [
  {month:"Jan",revenue:0,profit:0,labor:0,materials:0},
  {month:"Feb",revenue:0,profit:0,labor:0,materials:0},
  {month:"Mar",revenue:0,profit:0,labor:0,materials:0},
  {month:"Apr",revenue:0,profit:0,labor:0,materials:0},
  {month:"May",revenue:0,profit:0,labor:0,materials:0},
  {month:"Jun",revenue:0,profit:0,labor:0,materials:0},
  {month:"Jul",revenue:0,profit:0,labor:0,materials:0},
  {month:"Aug",revenue:0,profit:0,labor:0,materials:0},
  {month:"Sep",revenue:0,profit:0,labor:0,materials:0},
  {month:"Oct",revenue:0,profit:0,labor:0,materials:0},
  {month:"Nov",revenue:0,profit:0,labor:0,materials:0},
  {month:"Dec",revenue:0,profit:0,labor:0,materials:0},
];

// ── SEED DATA ──────────────────────────────────────────────────
export const SD_CUSTS = [
  {id:1,name:"Robert Thornton",phone:"(555)201-4400",email:"bob.thornton@email.com",address:"4821 Maple Ridge Dr, Austin TX 78704",propertyType:"Single Family",leadSource:"Referral",notes:"Decisive. Prefers text. HOA exterior restrictions.",tags:["Repeat","VIP"],totalRevenue:48000,createdAt:"2025-07-10"},
  {id:2,name:"Ana Rivera",phone:"(555)308-9921",email:"ana.rivera@gmail.com",address:"2204 Sunflower Ln, Austin TX 78745",propertyType:"Condo",leadSource:"Google",notes:"Budget-conscious. Needs itemized breakdowns.",tags:["Repeat"],totalRevenue:9750,createdAt:"2026-01-15"},
  {id:3,name:"Samuel Goldberg",phone:"(555)744-2200",email:"sam@goldberg-props.com",address:"9102 Ridgecrest Blvd, Austin TX 78731",propertyType:"Multi-family",leadSource:"Referral",notes:"Property investor. Net-30 terms.",tags:["VIP","Investor"],totalRevenue:0,createdAt:"2026-02-10"},
  {id:4,name:"Jin Park",phone:"(555)611-8833",email:"jin.park@techcorp.io",address:"505 Barton Springs Rd #8, Austin TX",propertyType:"Single Family",leadSource:"Website",notes:"ADU for rental income. Weekly updates.",tags:["New"],totalRevenue:20000,createdAt:"2026-02-28"},
  {id:5,name:"Lily Chen",phone:"(555)920-0047",email:"lily.chen@outlook.com",address:"3310 Clarkson Ave, Austin TX 78723",propertyType:"Single Family",leadSource:"Angi",notes:"Very happy — 5 referral cards requested.",tags:["Repeat","Referral Source"],totalRevenue:31000,createdAt:"2025-12-01"},
  {id:6,name:"Marcus Webb",phone:"(555)402-7765",email:"m.webb@email.com",address:"1821 Pecos St, Austin TX 78702",propertyType:"Single Family",leadSource:"Referral",notes:"Kitchen remodel. Granite + soft-close. Meeting 3/15.",tags:["Hot Lead"],totalRevenue:0,createdAt:"2026-03-01"},
  {id:7,name:"Priya Nair",phone:"(555)835-1122",email:"p.nair@email.com",address:"6710 Lamar Blvd, Austin TX 78757",propertyType:"Single Family",leadSource:"Referral",notes:"Basement finish + wet bar. Pre-approved.",tags:["Hot Lead"],totalRevenue:0,createdAt:"2026-03-09"},
];

export const SD_ESTS = [
  {id:"EST-2026-001",number:"EST-2026-001",custId:1,projId:"PRJ-2026-001",name:"Thornton Kitchen Full Remodel",discount:0,status:"approved",date:"2026-01-20",expiry:"2026-02-20",taxRate:TAX,notes:"Includes demo, cabinets, countertops, flooring.",subtotal:32800,materialSubtotal:14200,
   lineItems:[{id:1,description:"Demo & Hauling",qty:1,unitPrice:2400,isMaterial:false},{id:2,description:"Cabinet Package (14 units)",qty:1,unitPrice:6200,isMaterial:true},{id:3,description:"Granite Countertop 22 LF",qty:22,unitPrice:180,isMaterial:true},{id:4,description:"LVP Flooring 280 SF",qty:280,unitPrice:4.5,isMaterial:true},{id:5,description:"Labor Install",qty:80,unitPrice:75,isMaterial:false},{id:6,description:"Electrical Materials",qty:1,unitPrice:620,isMaterial:true},{id:7,description:"Plumbing Fixtures",qty:1,unitPrice:480,isMaterial:true}]},
  {id:"EST-2026-002",number:"EST-2026-002",custId:2,projId:"PRJ-2026-002",name:"Rivera Bathroom Remodel",discount:0,status:"approved",date:"2026-02-01",expiry:"2026-03-01",taxRate:TAX,notes:"Tile shower, new vanity, fixtures.",subtotal:17400,materialSubtotal:8100,
   lineItems:[{id:1,description:"Demo & Prep",qty:1,unitPrice:1800,isMaterial:false},{id:2,description:"Shower Tile 90 SF",qty:90,unitPrice:6,isMaterial:true},{id:3,description:"Floor Tile 85 SF",qty:85,unitPrice:4.5,isMaterial:true},{id:4,description:"Vanity & Mirror",qty:1,unitPrice:850,isMaterial:true},{id:5,description:"Plumbing Labor",qty:16,unitPrice:100,isMaterial:false},{id:6,description:"Tile Labor",qty:32,unitPrice:85,isMaterial:false},{id:7,description:"Cement Board & Drywall",qty:1,unitPrice:420,isMaterial:true}]},
  {id:"EST-2026-003",number:"EST-2026-003",custId:3,projId:"PRJ-2026-003",name:"Goldberg Composite Deck",discount:0,status:"approved",date:"2026-02-20",expiry:"2026-03-20",taxRate:TAX,notes:"280 SF composite deck with rail system.",subtotal:11900,materialSubtotal:6200,
   lineItems:[{id:1,description:"Deck Framing Labor",qty:24,unitPrice:80,isMaterial:false},{id:2,description:"Composite Decking 280 SF",qty:280,unitPrice:12,isMaterial:true},{id:3,description:"Framing Lumber & Hardware",qty:1,unitPrice:1840,isMaterial:true},{id:4,description:"Rail System",qty:1,unitPrice:1080,isMaterial:true}]},
  {id:"EST-2026-004",number:"EST-2026-004",custId:4,projId:"PRJ-2026-004",name:"Park Detached ADU",discount:0,status:"approved",date:"2026-03-01",expiry:"2026-04-01",taxRate:TAX,notes:"Full detached ADU 640 SF.",subtotal:74000,materialSubtotal:32000,
   lineItems:[{id:1,description:"Foundation & Concrete",qty:1,unitPrice:12000,isMaterial:true},{id:2,description:"Framing Labor",qty:120,unitPrice:80,isMaterial:false},{id:3,description:"Framing Materials",qty:1,unitPrice:8200,isMaterial:true},{id:4,description:"Electrical Rough + Finish",qty:1,unitPrice:6800,isMaterial:false},{id:5,description:"Plumbing Rough + Finish",qty:1,unitPrice:5200,isMaterial:false},{id:6,description:"Drywall Materials",qty:1,unitPrice:3200,isMaterial:true},{id:7,description:"Roofing Material",qty:1,unitPrice:4800,isMaterial:true}]},
  {id:"EST-2026-005",number:"EST-2026-005",custId:6,projId:null,name:"Webb Kitchen Remodel",discount:0,status:"draft",date:"2026-03-10",expiry:"2026-04-10",taxRate:TAX,notes:"Granite, soft-close cabinets.",subtotal:35500,materialSubtotal:15800,
   lineItems:[{id:1,description:"Demo Labor",qty:1,unitPrice:2200,isMaterial:false},{id:2,description:"Cabinet Package",qty:1,unitPrice:7400,isMaterial:true},{id:3,description:"Granite 28 LF",qty:28,unitPrice:185,isMaterial:true},{id:4,description:"Install Labor",qty:88,unitPrice:75,isMaterial:false},{id:5,description:"Plumbing Fixtures",qty:1,unitPrice:920,isMaterial:true}]},
  {id:"EST-2026-006",number:"EST-2026-006",custId:7,projId:null,name:"Nair Basement Finish + Wet Bar",discount:0,status:"sent",date:"2026-03-09",expiry:"2026-04-09",taxRate:TAX,notes:"Full basement finish, wet bar.",subtotal:46000,materialSubtotal:18000,
   lineItems:[{id:1,description:"Framing",qty:60,unitPrice:80,isMaterial:false},{id:2,description:"Drywall Materials",qty:1,unitPrice:3600,isMaterial:true},{id:3,description:"Flooring Materials",qty:1,unitPrice:4200,isMaterial:true},{id:4,description:"Electrical",qty:1,unitPrice:5800,isMaterial:false},{id:5,description:"Wet Bar Materials",qty:1,unitPrice:6200,isMaterial:true},{id:6,description:"Plumbing",qty:1,unitPrice:4800,isMaterial:false}]},
];

export const SD_PROJS = [
  {id:"PRJ-2026-001",name:"Thornton Kitchen Full Remodel",custId:1,estId:"EST-2026-001",status:"active",contractValue:38000,budgetLabor:18000,budgetMaterials:14200,actualLabor:12400,actualMaterials:9800,start:"2026-02-01",end:"2026-03-28",phase:"Finish Work",progress:72,notes:"On track. Countertops install next week."},
  {id:"PRJ-2026-002",name:"Rivera Bathroom Remodel",custId:2,estId:"EST-2026-002",status:"active",contractValue:19500,budgetLabor:9300,budgetMaterials:8100,actualLabor:7200,actualMaterials:6900,start:"2026-02-15",end:"2026-03-20",phase:"Tile & Fixtures",progress:85,notes:"Final punch list pending."},
  {id:"PRJ-2026-003",name:"Goldberg Composite Deck",custId:3,estId:"EST-2026-003",status:"active",contractValue:14200,budgetLabor:5700,budgetMaterials:6200,actualLabor:3200,actualMaterials:4100,start:"2026-03-01",end:"2026-03-22",phase:"Framing",progress:40,notes:"Material delivery on 3/14."},
  {id:"PRJ-2026-004",name:"Park Detached ADU",custId:4,estId:"EST-2026-004",status:"active",contractValue:88000,budgetLabor:42000,budgetMaterials:32000,actualLabor:9600,actualMaterials:12000,start:"2026-03-10",end:"2026-07-01",phase:"Foundation",progress:12,notes:"Foundation pour complete. Framing starts 3/16."},
  {id:"PRJ-2026-005",name:"Chen Master Suite Addition",custId:5,estId:null,status:"complete",contractValue:31000,budgetLabor:16500,budgetMaterials:9500,actualLabor:16200,actualMaterials:9100,start:"2026-01-05",end:"2026-02-28",phase:"Complete",progress:100,notes:"Signed off 2/28."},
];

export const SD_MATS = [
  {id:1,name:"Framing Lumber 2x4x8",unit:"ea",category:"Lumber",supplier:"Home Depot",cost:4.82,markup:20,stock:180,reorderAt:50},
  {id:2,name:"Framing Lumber 2x6x8",unit:"ea",category:"Lumber",supplier:"Home Depot",cost:6.40,markup:20,stock:85,reorderAt:40},
  {id:3,name:"OSB Sheathing 4x8",unit:"sheet",category:"Lumber",supplier:"Home Depot",cost:22.50,markup:18,stock:60,reorderAt:20},
  {id:4,name:"Drywall 4x8 half inch",unit:"sheet",category:"Drywall",supplier:"ABC Supply",cost:14.80,markup:22,stock:120,reorderAt:40},
  {id:5,name:"Drywall 4x8 Fire Rated",unit:"sheet",category:"Drywall",supplier:"ABC Supply",cost:17.20,markup:22,stock:48,reorderAt:20},
  {id:6,name:"LVP Flooring",unit:"SF",category:"Flooring",supplier:"Floor & Decor",cost:2.80,markup:35,stock:840,reorderAt:200},
  {id:7,name:"Hardwood Flooring",unit:"SF",category:"Flooring",supplier:"Floor & Decor",cost:5.60,markup:35,stock:320,reorderAt:100},
  {id:8,name:"Ceramic Floor Tile 12x12",unit:"SF",category:"Tile",supplier:"Floor & Decor",cost:2.10,markup:40,stock:600,reorderAt:150},
  {id:9,name:"Porcelain Wall Tile 4x12",unit:"SF",category:"Tile",supplier:"Floor & Decor",cost:3.40,markup:40,stock:420,reorderAt:100},
  {id:10,name:"Interior Paint 1 gal",unit:"gal",category:"Paint",supplier:"Sherwin-Williams",cost:32.00,markup:30,stock:28,reorderAt:10},
  {id:11,name:"Exterior Paint 1 gal",unit:"gal",category:"Paint",supplier:"Sherwin-Williams",cost:38.00,markup:28,stock:18,reorderAt:8},
  {id:12,name:"PVC Pipe half inch",unit:"LF",category:"Plumbing",supplier:"Ferguson",cost:0.68,markup:45,stock:320,reorderAt:80},
  {id:13,name:"Kitchen Faucet Mid",unit:"ea",category:"Plumbing",supplier:"Ferguson",cost:145,markup:40,stock:4,reorderAt:2},
  {id:14,name:"Toilet 1.28 GPF",unit:"ea",category:"Plumbing",supplier:"Ferguson",cost:188,markup:35,stock:3,reorderAt:2},
  {id:15,name:"14/2 NM Wire",unit:"roll",category:"Electrical",supplier:"Graybar",cost:58,markup:30,stock:12,reorderAt:4},
  {id:16,name:"20A GFCI Outlet",unit:"ea",category:"Electrical",supplier:"Graybar",cost:14,markup:50,stock:24,reorderAt:10},
  {id:17,name:"LED Recessed 6 inch",unit:"ea",category:"Electrical",supplier:"Graybar",cost:18,markup:45,stock:36,reorderAt:12},
  {id:18,name:"Composite Decking 1x6",unit:"LF",category:"Decking",supplier:"Home Depot",cost:4.20,markup:30,stock:600,reorderAt:150},
  {id:19,name:"Concrete Mix 80lb",unit:"bag",category:"Concrete",supplier:"Home Depot",cost:6.80,markup:20,stock:80,reorderAt:30},
  {id:20,name:"R-19 Batt Insulation",unit:"roll",category:"Insulation",supplier:"ABC Supply",cost:38,markup:25,stock:22,reorderAt:8},
  {id:21,name:"Exterior Door 36 inch",unit:"ea",category:"Doors & Windows",supplier:"Home Depot",cost:320,markup:35,stock:3,reorderAt:1},
  {id:22,name:"12/2 NM Wire",unit:"roll",category:"Electrical",supplier:"Graybar",cost:72,markup:30,stock:10,reorderAt:4},
  {id:23,name:"R-13 Batt Insulation",unit:"roll",category:"Insulation",supplier:"ABC Supply",cost:28,markup:25,stock:30,reorderAt:10},
  {id:24,name:"Cement Board 3x5",unit:"sheet",category:"Drywall",supplier:"ABC Supply",cost:16.40,markup:22,stock:35,reorderAt:12},
  {id:25,name:"Deck Rail System",unit:"ea",category:"Decking",supplier:"Home Depot",cost:280,markup:30,stock:5,reorderAt:2},
];

export const SD_SUBS = [
  {id:1,name:"Carlos Mendez",company:"Mendez Carpentry LLC",role:"Carpenter",hourlyWage:32,billableRate:75,status:"active",phone:"(555)301-2211",email:"carlos@mendezcarpentry.com"},
  {id:2,name:"Mike Torres",company:"Torres Electric Inc",role:"Electrician",hourlyWage:42,billableRate:95,status:"active",phone:"(555)301-3322",email:"mike@torreselectric.com"},
  {id:3,name:"Jake Sullivan",company:"Sullivan Plumbing Co",role:"Plumber",hourlyWage:40,billableRate:100,status:"active",phone:"(555)301-4433",email:"jake@sullivanplumbing.com"},
  {id:4,name:"Devon Harris",company:"Harris Tile & Stone",role:"Tile Setter",hourlyWage:36,billableRate:85,status:"active",phone:"(555)301-5544",email:"devon@harristile.com"},
  {id:5,name:"Luis Ramirez",company:"Ramirez Labor Services",role:"Laborer",hourlyWage:22,billableRate:55,status:"active",phone:"(555)301-6655",email:"luis@ramirezlabor.com"},
  {id:6,name:"Sean Wright",company:"Wright Painting Co",role:"Painter",hourlyWage:28,billableRate:65,status:"active",phone:"(555)301-7766",email:"sean@wrightpainting.com"},
  {id:7,name:"Tyrone Jackson",company:"Jackson Framing",role:"Framer",hourlyWage:34,billableRate:80,status:"active",phone:"(555)301-8877",email:"tyrone@jacksonframing.com"},
  {id:8,name:"Rosa Gutierrez",company:"RG HVAC Solutions",role:"HVAC Technician",hourlyWage:44,billableRate:105,status:"active",phone:"(555)301-9988",email:"rosa@rghvac.com"},
  {id:9,name:"David Kim",company:"Kim Roofing",role:"Roofer",hourlyWage:35,billableRate:82,status:"active",phone:"(555)301-1100",email:"david@kimroofing.com"},
  {id:10,name:"Anthony Russo",company:"Russo Concrete & Masonry",role:"Mason",hourlyWage:38,billableRate:90,status:"active",phone:"(555)301-2233",email:"anthony@russoconcrete.com"},
];

export const SD_HRS = [
  {id:1,subId:1,projId:"PRJ-2026-001",date:"2026-02-05",hours:8,desc:"Cabinet demo & haul",approved:true},
  {id:2,subId:1,projId:"PRJ-2026-001",date:"2026-02-10",hours:8,desc:"Upper cabinet install",approved:true},
  {id:3,subId:1,projId:"PRJ-2026-001",date:"2026-02-11",hours:8,desc:"Lower cabinet install",approved:true},
  {id:4,subId:7,projId:"PRJ-2026-001",date:"2026-02-08",hours:8,desc:"Framing modifications",approved:true},
  {id:5,subId:4,projId:"PRJ-2026-001",date:"2026-02-18",hours:8,desc:"Backsplash tile set",approved:true},
  {id:6,subId:6,projId:"PRJ-2026-001",date:"2026-02-20",hours:7,desc:"Primer coat",approved:true},
  {id:7,subId:3,projId:"PRJ-2026-002",date:"2026-02-16",hours:8,desc:"Rough plumbing",approved:true},
  {id:8,subId:4,projId:"PRJ-2026-002",date:"2026-02-20",hours:8,desc:"Shower tile day 1",approved:true},
  {id:9,subId:4,projId:"PRJ-2026-002",date:"2026-02-21",hours:8,desc:"Shower tile day 2",approved:true},
  {id:10,subId:5,projId:"PRJ-2026-003",date:"2026-03-02",hours:8,desc:"Excavation & footings",approved:true},
  {id:11,subId:7,projId:"PRJ-2026-003",date:"2026-03-04",hours:8,desc:"Deck framing",approved:true},
  {id:12,subId:1,projId:"PRJ-2026-004",date:"2026-03-10",hours:8,desc:"Foundation prep",approved:true},
  {id:13,subId:7,projId:"PRJ-2026-004",date:"2026-03-11",hours:8,desc:"Wall framing day 1",approved:false},
  {id:14,subId:1,projId:"PRJ-2026-005",date:"2026-01-12",hours:8,desc:"Addition framing",approved:true},
  {id:15,subId:6,projId:"PRJ-2026-005",date:"2026-02-10",hours:8,desc:"Paint all surfaces",approved:true},
];

export const SD_INVS = [
  {id:"INV-2026-001",number:"INV-2026-001",custId:1,projId:"PRJ-2026-001",estId:"EST-2026-001",status:"paid",issueDate:"2026-02-01",dueDate:"2026-03-01",discount:0,paidDate:"2026-02-28",taxRate:6.5,notes:"Deposit 50%.",
   lineItems:[{id:1,description:"Kitchen Remodel Labor & Mgmt",qty:1,unitPrice:14200,isMaterial:false},{id:2,description:"Cabinet Package",qty:1,unitPrice:6200,isMaterial:true},{id:3,description:"Granite Countertop 22 LF",qty:1,unitPrice:3960,isMaterial:true},{id:4,description:"LVP Flooring 280 SF",qty:1,unitPrice:1260,isMaterial:true}]},
  {id:"INV-2026-002",number:"INV-2026-002",custId:1,projId:"PRJ-2026-001",estId:"EST-2026-001",status:"sent",issueDate:"2026-03-10",dueDate:"2026-03-25",discount:0,paidDate:null,taxRate:6.5,notes:"Final balance due on completion.",
   lineItems:[{id:1,description:"Kitchen Remodel Final Labor",qty:1,unitPrice:9800,isMaterial:false},{id:2,description:"Backsplash Tile 32 SF",qty:1,unitPrice:640,isMaterial:true},{id:3,description:"Hardware & Accessories",qty:1,unitPrice:420,isMaterial:true}]},
  {id:"INV-2026-003",number:"INV-2026-003",custId:2,projId:"PRJ-2026-002",estId:"EST-2026-002",status:"overdue",issueDate:"2026-02-20",dueDate:"2026-03-05",discount:0,paidDate:null,taxRate:6.5,notes:"50% deposit overdue.",
   lineItems:[{id:1,description:"Bathroom Remodel Labor",qty:1,unitPrice:7200,isMaterial:false},{id:2,description:"Shower Tile 90 SF",qty:1,unitPrice:540,isMaterial:true},{id:3,description:"Vanity & Mirror",qty:1,unitPrice:850,isMaterial:true},{id:4,description:"Toilet & Fixtures",qty:1,unitPrice:620,isMaterial:true}]},
  {id:"INV-2026-004",number:"INV-2026-004",custId:3,projId:"PRJ-2026-003",estId:"EST-2026-003",status:"draft",issueDate:"2026-03-12",dueDate:"2026-04-12",discount:0,paidDate:null,taxRate:6.5,notes:"Deposit work begins 3/15.",
   lineItems:[{id:1,description:"Deck Construction Labor",qty:1,unitPrice:5400,isMaterial:false},{id:2,description:"Composite Decking 280 SF",qty:1,unitPrice:3360,isMaterial:true},{id:3,description:"Framing Lumber & Hardware",qty:1,unitPrice:1840,isMaterial:true}]},
  {id:"INV-2026-005",number:"INV-2026-005",custId:5,projId:"PRJ-2026-005",estId:null,status:"paid",issueDate:"2026-02-20",dueDate:"2026-02-28",discount:0,paidDate:"2026-02-27",taxRate:6.5,notes:"Final invoice project complete.",
   lineItems:[{id:1,description:"Master Suite Full Labor",qty:1,unitPrice:16200,isMaterial:false},{id:2,description:"Framing Materials",qty:1,unitPrice:3200,isMaterial:true},{id:3,description:"Drywall & Insulation",qty:1,unitPrice:1800,isMaterial:true},{id:4,description:"Flooring 320 SF",qty:1,unitPrice:896,isMaterial:true},{id:5,description:"Electrical Materials",qty:1,unitPrice:980,isMaterial:true}]},
];

export const SD_COS = [
  {id:"CO-2026-001",number:"CO-2026-001",projId:"PRJ-2026-001",custId:1,discount:0,status:"approved",date:"2026-02-18",description:"Add under-cabinet lighting package",reason:"Customer request",laborAmt:1200,materialAmt:680,totalAmt:1880,approvedBy:"Customer",approvedDate:"2026-02-19",notes:"LED strip + transformer + install labor."},
  {id:"CO-2026-002",number:"CO-2026-002",projId:"PRJ-2026-002",custId:2,status:"pending",date:"2026-03-08",description:"Upgrade shower valve to thermostatic",reason:"Code requirement",laborAmt:400,materialAmt:520,totalAmt:920,approvedBy:null,approvedDate:null,notes:"Inspector flagged existing valve."},
  {id:"CO-2026-003",number:"CO-2026-003",projId:"PRJ-2026-004",custId:4,discount:0,status:"approved",date:"2026-03-12",description:"Add mini-split HVAC to ADU",reason:"Customer request",laborAmt:2800,materialAmt:3200,totalAmt:6000,approvedBy:"Customer",approvedDate:"2026-03-13",notes:"Mitsubishi 12K BTU wall mount."},
];

export const SD_EXPENSES = [
  {id:1,projId:"PRJ-2026-001",date:"2026-02-04",category:"Materials",vendor:"Home Depot",description:"Framing lumber & hardware",amount:1840,receipt:true,reimbursable:false,notes:"PO #4421"},
  {id:2,projId:"PRJ-2026-001",date:"2026-02-12",category:"Permits",vendor:"City of Austin",description:"Kitchen remodel permit",amount:385,receipt:true,reimbursable:false,notes:"Permit #KR-2026-0188"},
  {id:3,projId:"PRJ-2026-002",date:"2026-02-17",category:"Materials",vendor:"Floor & Decor",description:"Shower tile 90 SF + floor tile",amount:920,receipt:true,reimbursable:false,notes:""},
  {id:4,projId:"PRJ-2026-003",date:"2026-03-03",category:"Equipment Rental",vendor:"Sunbelt Rentals",description:"Mini excavator 1-day",amount:450,receipt:true,reimbursable:true,notes:"Footing excavation"},
  {id:5,projId:"PRJ-2026-004",date:"2026-03-11",category:"Materials",vendor:"Home Depot",description:"Foundation concrete & rebar",amount:3200,receipt:true,reimbursable:false,notes:"12 yards ready-mix"},
  {id:6,projId:null,date:"2026-03-01",category:"Insurance",vendor:"State Farm",description:"Monthly GL premium",amount:680,receipt:true,reimbursable:false,notes:"Policy #GL-4492"},
  {id:7,projId:null,date:"2026-03-01",category:"Vehicle",vendor:"Shell",description:"Fuel — work trucks",amount:340,receipt:true,reimbursable:false,notes:"Fleet cards"},
  {id:8,projId:null,date:"2026-02-28",category:"Office",vendor:"QuickBooks",description:"Monthly subscription",amount:85,receipt:false,reimbursable:false,notes:""},
];

export const EXPENSE_CATS = ["Materials","Labor","Permits","Equipment Rental","Insurance","Vehicle","Fuel","Office","Tools","Subcontractor/Crew","Disposal","Meals","Travel","Marketing","Miscellaneous"];

export const SD_PHASES = ["Initiation (feasibility)","Planning & Design (blueprints)","Pre-construction (permits/site prep)","Procurement (bidding/materials)","Construction (execution/monitoring)","Closeout (final inspection/handover)"];

export const SD_TASKS = [
  {id:"T-001",projId:"PRJ-2026-001",phase:"Finish Work",title:"Install countertops",assignedTo:1,status:"in_progress",dueDate:"2026-03-18",notes:"Granite template done"},
  {id:"T-002",projId:"PRJ-2026-001",phase:"Finish Work",title:"Install backsplash tile",assignedTo:4,status:"todo",dueDate:"2026-03-20",notes:""},
  {id:"T-003",projId:"PRJ-2026-001",phase:"Punch List",title:"Touch-up paint",assignedTo:6,status:"todo",dueDate:"2026-03-25",notes:""},
  {id:"T-004",projId:"PRJ-2026-002",phase:"Tile & Fixtures",title:"Install shower fixtures",assignedTo:3,status:"in_progress",dueDate:"2026-03-16",notes:"Thermostatic valve"},
  {id:"T-005",projId:"PRJ-2026-002",phase:"Punch List",title:"Final cleaning",assignedTo:null,status:"todo",dueDate:"2026-03-19",notes:""},
  {id:"T-006",projId:"PRJ-2026-003",phase:"Framing",title:"Set deck posts",assignedTo:7,status:"done",dueDate:"2026-03-08",notes:"6x6 posts set in concrete"},
  {id:"T-007",projId:"PRJ-2026-003",phase:"Framing",title:"Install joists & blocking",assignedTo:7,status:"in_progress",dueDate:"2026-03-14",notes:""},
  {id:"T-008",projId:"PRJ-2026-004",phase:"Foundation",title:"Pour slab",assignedTo:10,status:"done",dueDate:"2026-03-15",notes:"640 SF slab poured"},
];

export const SD_COMPANY = {
  name:"JB Construction LLC",owner:"Jason Braddock",phone:"(512) 555-0199",email:"jason@jbconstruction.com",
  address:"2801 S Lamar Blvd, Suite 210, Austin TX 78704",website:"www.jbconstruction.com",
  license:"TX GC License #28841",ein:"74-3229901",defaultTaxRate:6.5,paymentTerms:30,
  laborBurdenDefault:28.3,logo:null,
  invoiceFooter:"Thank you for your business. Payment due within terms shown above.",
  estimateFooter:"This estimate is valid for 30 days. Prices subject to change after expiry.",
  smtpHost:"smtp.gmail.com",smtpPort:587,smtpUser:"jason@jbconstruction.com",smtpPass:"",smtpSecure:true,
  emailFromName:"JB Construction LLC",emailReplyTo:"jason@jbconstruction.com",
  emailSignature:"Best regards,\nJason Braddock\nJB Construction LLC\n(512) 555-0199",
  notifyEstimateSent:true,notifyEstimateApproved:true,notifyEstimateDeclined:true,
  notifyInvoiceSent:true,notifyInvoicePaid:true,notifyInvoiceOverdue:true,notifyPaymentReminder:true,
  reminderDaysBefore:3,overdueFollowupDays:7,
  emailSubjectEstimate:"Estimate #{number} from {company}",emailSubjectInvoice:"Invoice #{number} from {company}",
  emailBodyEstimate:"Hi {customer},\n\nPlease find attached your estimate for {project}.\n\nTotal: {total}\n\nThis estimate is valid for 30 days.\n\nThank you,\n{company}",
  emailBodyInvoice:"Hi {customer},\n\nPlease find attached your invoice for {project}.\n\nAmount Due: {total}\nDue Date: {dueDate}\n\nThank you for your business.\n\n{company}",
  themeAccent:"#3b82f6",themeName:"Ocean Blue",
};

export const USER_ROLES = ["Owner","Admin","Project Manager","Estimator","Foreman","Bookkeeper","Field Tech","Read Only"];
export const USER_ROLE_C = {"Owner":"#f5a623","Admin":"#6366f1","Project Manager":"#3b82f6","Estimator":"#14b8a6","Foreman":"#fb923c","Bookkeeper":"#ec4899","Field Tech":"#78716c","Read Only":"var(--text-dim)"};
export const USER_ROLE_PERMS = {
  "Owner":["All Access","Manage Users","Company Settings","Financial Reports","Delete Records"],
  "Admin":["All Access","Manage Users","Company Settings","Financial Reports"],
  "Project Manager":["Projects","Estimates","Invoices","Customers","Job Costing","Materials"],
  "Estimator":["Estimates","Customers","Materials","Projects (View)"],
  "Foreman":["Projects (View)","Time Tracking","Materials (View)","Crew (View)"],
  "Bookkeeper":["Invoices","Financial Reports","Customers","Job Costing","Expenses"],
  "Field Tech":["Time Tracking","Projects (View)","Materials (View)"],
  "Read Only":["Dashboard (View)","Projects (View)","Reports (View)"],
};
export const USR_SC = {"active":{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Active"},"invited":{bg:"rgba(245,166,35,.12)",c:"#f5a623",label:"Invited"},"disabled":{bg:"rgba(239,68,68,.12)",c:"#ef4444",label:"Disabled"}};

export const SD_USERS = [
  {id:1,name:"Jason Braddock",email:"jason@jbconstruction.com",phone:"(512)555-0199",role:"Owner",status:"active",lastLogin:"2026-03-12",createdAt:"2025-01-01"},
  {id:2,name:"Maria Santos",email:"maria@jbconstruction.com",phone:"(512)555-0202",role:"Admin",status:"active",lastLogin:"2026-03-11",createdAt:"2025-03-15"},
  {id:3,name:"Derek Nguyen",email:"derek@jbconstruction.com",phone:"(512)555-0303",role:"Project Manager",status:"active",lastLogin:"2026-03-10",createdAt:"2025-06-01"},
  {id:4,name:"Sarah Kim",email:"sarah@jbconstruction.com",phone:"(512)555-0404",role:"Estimator",status:"active",lastLogin:"2026-03-09",createdAt:"2025-09-12"},
  {id:5,name:"Carlos Mendez",email:"carlos@jbconstruction.com",phone:"(512)555-0505",role:"Foreman",status:"active",lastLogin:"2026-03-12",createdAt:"2025-06-01"},
  {id:6,name:"Linda Tran",email:"linda@jbconstruction.com",phone:"(512)555-0606",role:"Bookkeeper",status:"active",lastLogin:"2026-03-08",createdAt:"2025-11-01"},
  {id:7,name:"Mike Torres",email:"mike.t@jbconstruction.com",phone:"(512)555-0707",role:"Field Tech",status:"active",lastLogin:"2026-03-11",createdAt:"2026-01-10"},
  {id:8,name:"Amy Chen",email:"amy@jbconstruction.com",phone:"(512)555-0808",role:"Read Only",status:"invited",lastLogin:null,createdAt:"2026-03-05"},
];

// ── LABOR ROLES (70) ───────────────────────────────────────────
export const SD_ROLES = [
  {id:1,title:"Carpenter",baseRate:32,payrollPct:15.3,benefitsPct:12.5},
  {id:2,title:"Electrician",baseRate:42,payrollPct:15.3,benefitsPct:14.0},
  {id:3,title:"Plumber",baseRate:40,payrollPct:15.3,benefitsPct:14.0},
  {id:4,title:"Tile Setter",baseRate:36,payrollPct:15.3,benefitsPct:11.0},
  {id:5,title:"Laborer",baseRate:22,payrollPct:15.3,benefitsPct:8.0},
  {id:6,title:"Painter",baseRate:28,payrollPct:15.3,benefitsPct:10.0},
  {id:7,title:"Framer",baseRate:34,payrollPct:15.3,benefitsPct:12.0},
  {id:8,title:"HVAC Technician",baseRate:44,payrollPct:15.3,benefitsPct:15.0},
  {id:9,title:"Roofer",baseRate:35,payrollPct:15.3,benefitsPct:18.0},
  {id:10,title:"Mason",baseRate:38,payrollPct:15.3,benefitsPct:13.0},
  {id:11,title:"Concrete Finisher",baseRate:34,payrollPct:15.3,benefitsPct:12.5},
  {id:12,title:"Drywall Installer",baseRate:30,payrollPct:15.3,benefitsPct:11.5},
  {id:13,title:"Insulation Installer",baseRate:27,payrollPct:15.3,benefitsPct:11.0},
  {id:14,title:"Flooring Installer",baseRate:33,payrollPct:15.3,benefitsPct:11.5},
  {id:15,title:"Cabinet Installer",baseRate:35,payrollPct:15.3,benefitsPct:12.0},
  {id:16,title:"Countertop Installer",baseRate:36,payrollPct:15.3,benefitsPct:12.0},
  {id:17,title:"Window Installer",baseRate:32,payrollPct:15.3,benefitsPct:12.5},
  {id:18,title:"Door Installer",baseRate:31,payrollPct:15.3,benefitsPct:12.0},
  {id:19,title:"Siding Installer",baseRate:30,payrollPct:15.3,benefitsPct:12.0},
  {id:20,title:"Gutter Installer",baseRate:28,payrollPct:15.3,benefitsPct:11.0},
  {id:21,title:"Fence Builder",baseRate:29,payrollPct:15.3,benefitsPct:11.0},
  {id:22,title:"Deck Builder",baseRate:34,payrollPct:15.3,benefitsPct:12.5},
  {id:23,title:"Demolition Crew",baseRate:26,payrollPct:15.3,benefitsPct:14.0},
  {id:24,title:"Excavation Operator",baseRate:40,payrollPct:15.3,benefitsPct:13.0},
  {id:25,title:"Grading Operator",baseRate:38,payrollPct:15.3,benefitsPct:13.0},
  {id:26,title:"Surveyor",baseRate:45,payrollPct:15.3,benefitsPct:14.5},
  {id:27,title:"Welder",baseRate:42,payrollPct:15.3,benefitsPct:16.0},
  {id:28,title:"Ironworker",baseRate:44,payrollPct:15.3,benefitsPct:17.0},
  {id:29,title:"Scaffolding Erector",baseRate:33,payrollPct:15.3,benefitsPct:15.0},
  {id:30,title:"Stucco Applicator",baseRate:34,payrollPct:15.3,benefitsPct:12.0},
  {id:31,title:"Waterproofer",baseRate:32,payrollPct:15.3,benefitsPct:12.5},
  {id:32,title:"Fire Sprinkler Installer",baseRate:43,payrollPct:15.3,benefitsPct:15.0},
  {id:33,title:"Elevator Installer",baseRate:52,payrollPct:15.3,benefitsPct:16.0},
  {id:34,title:"Glass & Glazier",baseRate:36,payrollPct:15.3,benefitsPct:13.0},
  {id:35,title:"Locksmith",baseRate:30,payrollPct:15.3,benefitsPct:11.0},
  {id:36,title:"Landscape Contractor",baseRate:28,payrollPct:15.3,benefitsPct:10.5},
  {id:37,title:"Irrigation Installer",baseRate:30,payrollPct:15.3,benefitsPct:11.0},
  {id:38,title:"Pool Builder",baseRate:38,payrollPct:15.3,benefitsPct:13.5},
  {id:39,title:"Solar Installer",baseRate:36,payrollPct:15.3,benefitsPct:13.0},
  {id:40,title:"Low Voltage Tech",baseRate:35,payrollPct:15.3,benefitsPct:12.5},
  {id:41,title:"Fire Alarm Tech",baseRate:38,payrollPct:15.3,benefitsPct:14.0},
  {id:42,title:"Security System Tech",baseRate:34,payrollPct:15.3,benefitsPct:12.5},
  {id:43,title:"Acoustical Ceiling Installer",baseRate:31,payrollPct:15.3,benefitsPct:11.5},
  {id:44,title:"Epoxy Flooring Installer",baseRate:33,payrollPct:15.3,benefitsPct:12.0},
  {id:45,title:"Paving Contractor",baseRate:36,payrollPct:15.3,benefitsPct:13.5},
  {id:46,title:"Structural Engineer",baseRate:65,payrollPct:15.3,benefitsPct:16.0},
  {id:47,title:"Architect",baseRate:60,payrollPct:15.3,benefitsPct:16.0},
  {id:48,title:"Interior Designer",baseRate:45,payrollPct:15.3,benefitsPct:14.0},
  {id:49,title:"General Cleanup Crew",baseRate:18,payrollPct:15.3,benefitsPct:7.5},
  {id:50,title:"Site Superintendent",baseRate:48,payrollPct:15.3,benefitsPct:15.0},
  {id:51,title:"Project Manager",baseRate:52,payrollPct:15.3,benefitsPct:16.0},
  {id:52,title:"Office Manager",baseRate:28,payrollPct:15.3,benefitsPct:14.0},
  {id:53,title:"Estimator",baseRate:42,payrollPct:15.3,benefitsPct:15.0},
  {id:54,title:"Bookkeeper",baseRate:25,payrollPct:15.3,benefitsPct:13.0},
  {id:55,title:"Accounts Payable",baseRate:23,payrollPct:15.3,benefitsPct:12.5},
  {id:56,title:"Accounts Receivable",baseRate:23,payrollPct:15.3,benefitsPct:12.5},
  {id:57,title:"Receptionist",baseRate:18,payrollPct:15.3,benefitsPct:10.0},
  {id:58,title:"HR Coordinator",baseRate:30,payrollPct:15.3,benefitsPct:14.5},
  {id:59,title:"Safety Officer",baseRate:38,payrollPct:15.3,benefitsPct:15.0},
  {id:60,title:"Quality Control Inspector",baseRate:36,payrollPct:15.3,benefitsPct:14.0},
  {id:61,title:"Dispatcher",baseRate:22,payrollPct:15.3,benefitsPct:12.0},
  {id:62,title:"Warehouse Manager",baseRate:26,payrollPct:15.3,benefitsPct:13.0},
  {id:63,title:"Purchasing Agent",baseRate:28,payrollPct:15.3,benefitsPct:13.5},
  {id:64,title:"Marketing Coordinator",baseRate:26,payrollPct:15.3,benefitsPct:13.0},
  {id:65,title:"Business Development",baseRate:45,payrollPct:15.3,benefitsPct:15.0},
  {id:66,title:"Controller / CFO",baseRate:65,payrollPct:15.3,benefitsPct:18.0},
  {id:67,title:"Operations Manager",baseRate:50,payrollPct:15.3,benefitsPct:16.0},
  {id:68,title:"Field Supervisor",baseRate:42,payrollPct:15.3,benefitsPct:15.0},
  {id:69,title:"Permit Coordinator",baseRate:28,payrollPct:15.3,benefitsPct:13.0},
  {id:70,title:"IT / Tech Support",baseRate:30,payrollPct:15.3,benefitsPct:13.5},
];

// ── STYLE MAPS ─────────────────────────────────────────────────
export const INV_SC = {"draft":{bg:"rgba(74,80,104,.18)",c:"#7a8299",label:"Draft"},"sent":{bg:"rgba(245,166,35,.12)",c:"#f5a623",label:"Sent"},"paid":{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Paid"},"overdue":{bg:"rgba(239,68,68,.12)",c:"#ef4444",label:"Overdue"},"void":{bg:"rgba(99,102,241,.1)",c:"#6366f1",label:"Void"}};
export const EST_SC = {"draft":{bg:"rgba(74,80,104,.18)",c:"#7a8299",label:"Draft"},"sent":{bg:"rgba(245,166,35,.12)",c:"#f5a623",label:"Sent"},"approved":{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Approved"},"declined":{bg:"rgba(239,68,68,.12)",c:"#ef4444",label:"Declined"}};
export const PRJ_SC = {"active":{bg:"rgba(59,130,246,.12)",c:"#3b82f6",label:"Active"},"complete":{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Complete"},"on_hold":{bg:"rgba(245,166,35,.12)",c:"#f5a623",label:"On Hold"},"cancelled":{bg:"rgba(239,68,68,.1)",c:"#ef4444",label:"Cancelled"}};
export const CO_SC = {"pending":{bg:"rgba(245,166,35,.12)",c:"#f5a623",label:"Pending"},"approved":{bg:"rgba(34,197,94,.12)",c:"#22c55e",label:"Approved"},"declined":{bg:"rgba(239,68,68,.12)",c:"#ef4444",label:"Declined"},"invoiced":{bg:"rgba(99,102,241,.1)",c:"#6366f1",label:"Invoiced"}};
export const TAG_C = {"VIP":{bg:"rgba(245,166,35,.14)",c:"#f5a623"},"Repeat":{bg:"rgba(99,179,237,.14)",c:"#63b3ed"},"Hot Lead":{bg:"rgba(239,68,68,.12)",c:"#ef4444"},"Investor":{bg:"rgba(166,139,250,.12)",c:"#a78bfa"},"New":{bg:"rgba(34,197,94,.1)",c:"#22c55e"},"Referral Source":{bg:"rgba(251,146,60,.1)",c:"#fb923c"}};
export const CAT_C = {"Lumber":"#f5a623","Drywall":"#94a3b8","Flooring":"#22c55e","Tile":"#14b8a6","Paint":"#ec4899","Plumbing":"#3b82f6","Electrical":"#f59e0b","Decking":"#a78bfa","Concrete":"#78716c","Insulation":"#fb923c","Doors & Windows":"#6366f1"};
export const SVC_CATS = ["General","Plumbing","Electrical","Framing","Painting","Flooring","Roofing","HVAC","Concrete","Landscaping","Cleanup"];
export const SVC_CAT_C = {"General":"#94a3b8","Plumbing":"#3b82f6","Electrical":"#f59e0b","Framing":"#f5a623","Painting":"#ec4899","Flooring":"#22c55e","Roofing":"#6366f1","HVAC":"#06b6d4","Concrete":"#78716c","Landscaping":"#84cc16","Cleanup":"#fb923c"};
export const SD_SVCS = [
  {id:1,name:"Demolition & Haul-off",description:"Demo existing structure and remove debris",category:"General",unit:"ls",unitPrice:800,isMaterial:false,lineItems:[]},
  {id:2,name:"Rough Plumbing",description:"Supply & drain rough-in",category:"Plumbing",unit:"ls",unitPrice:3200,isMaterial:false,lineItems:[]},
  {id:3,name:"Electrical Rough-in",description:"Rough-in wiring and panel work",category:"Electrical",unit:"ls",unitPrice:2400,isMaterial:false,lineItems:[]},
  {id:4,name:"Tile Installation",description:"Set tile — floor or wall",category:"Flooring",unit:"sf",unitPrice:12,isMaterial:false,lineItems:[]},
  {id:5,name:"Interior Painting",description:"Walls & trim, 2 coats",category:"Painting",unit:"ls",unitPrice:1600,isMaterial:false,lineItems:[]},
  {id:6,name:"Framing Labor",description:"Wood framing per sq ft",category:"Framing",unit:"sf",unitPrice:8,isMaterial:false,lineItems:[]},
  {id:7,name:"Cleanup & Haul-off",description:"Final jobsite cleanup and debris removal",category:"Cleanup",unit:"ls",unitPrice:600,isMaterial:false,lineItems:[]},
];

// Role colors — computed from SD_ROLES order
const _RC = ["#f5a623","#6366f1","#3b82f6","#14b8a6","#78716c","#ec4899","#fb923c","#a78bfa","#ef4444","#22c55e","#f59e0b","#94a3b8","#06b6d4","#84cc16","#e879f9","#facc15","#0ea5e9","#d946ef","#f97316","#10b981"];
export const ROLE_C = {};
SD_ROLES.forEach((r,i) => { ROLE_C[r.title] = _RC[i % _RC.length]; });

export const MGMT_ROLES = new Set(["Project Manager","Office Manager","Estimator","Bookkeeper","Accounts Payable","Accounts Receivable","Receptionist","HR Coordinator","Safety Officer","Quality Control Inspector","Dispatcher","Warehouse Manager","Purchasing Agent","Marketing Coordinator","Business Development","Controller / CFO","Operations Manager","Field Supervisor","Permit Coordinator","IT / Tech Support","Architect","Interior Designer","Structural Engineer","Surveyor","Site Superintendent"]);

// ── GLOBAL CSS ─────────────────────────────────────────────────
export const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --accent:#3b82f6;--accent-dark:#1d4ed8;--accent-light:#63b3ed;--accent-r:59;--accent-g:130;--accent-b:246;
  --bg:#080a0f;--bg-sidebar:#0a0d15;--bg-card:#0c0f17;--bg-input:#0c0f17;--bg-darker:#0e1119;
  --border:#111826;--border-2:#1e2535;
  --text:#dde1ec;--text-2:#c8d0e0;--text-3:#9aabb8;--text-muted:#7a8299;--text-dim:#4a566e;--text-faint:#3a4160;--text-ghost:#2d3a52;
}
:root[data-theme="light"]{
  --bg:#f3f6fb;--bg-sidebar:#eaeff8;--bg-card:#ffffff;--bg-input:#f8fafc;--bg-darker:#edf1f8;
  --border:#dbe2ef;--border-2:#c8d4e6;
  --text:#0f172a;--text-2:#1e293b;--text-3:#334155;--text-muted:#4b5d7a;--text-dim:#617499;--text-faint:#8fa3c0;--text-ghost:#c0cfdf;
}
:root[data-theme="light"] .card:hover{box-shadow:0 6px 24px rgba(15,23,42,.09);transform:translateY(-1px)}
:root[data-theme="light"] .mo{box-shadow:0 20px 60px rgba(15,23,42,.18)}
:root[data-theme="light"] .rh:hover{background:rgba(59,130,246,.05)!important}
:root[data-theme="light"] .inp{box-shadow:inset 0 1px 3px rgba(15,23,42,.06)}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:var(--bg-card)}
::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:2px}
button{cursor:pointer;border:none;background:none;font-family:inherit;color:inherit}
input,select,textarea{outline:none;font-family:inherit}
.nb{transition:all .16s;border-left:2px solid transparent;display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:8px;color:var(--text-dim);text-align:left;white-space:nowrap;width:100%;font-size:13px;font-weight:600;cursor:pointer}
.nb:hover{background:rgba(var(--accent-r),var(--accent-g),var(--accent-b),.07)!important;color:var(--text-2)!important}
.nb.on{background:rgba(var(--accent-r),var(--accent-g),var(--accent-b),.1)!important;border-left-color:var(--accent-light)!important;color:var(--accent-light)!important}
.card{transition:box-shadow .2s,transform .2s}
.card:hover{box-shadow:0 10px 36px rgba(0,0,0,.18);transform:translateY(-1px)}
.rh:hover{background:rgba(var(--accent-r),var(--accent-g),var(--accent-b),.04)!important}
.bb{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-family:inherit;border-radius:8px;cursor:pointer;transition:all .15s;border:none}
.b-bl{background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:#fff}.b-bl:hover{transform:translateY(-1px);box-shadow:0 5px 22px rgba(var(--accent-r),var(--accent-g),var(--accent-b),.45)}
.b-gr{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}.b-gr:hover{transform:translateY(-1px);box-shadow:0 5px 20px rgba(34,197,94,.4)}
.b-am{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff}.b-am:hover{transform:translateY(-1px);box-shadow:0 5px 20px rgba(245,158,11,.4)}
.b-gh{border:1px solid var(--border-2)!important;color:var(--text-muted)!important;background:transparent}.b-gh:hover{border-color:var(--accent)!important;color:var(--accent-light)!important}
.b-rd{border:1px solid rgba(239,68,68,.3)!important;color:#ef4444!important;background:transparent}.b-rd:hover{background:rgba(239,68,68,.08)!important}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:900;display:flex;align-items:flex-start;justify-content:center;padding:20px;backdrop-filter:blur(8px);overflow-y:auto}
.mo{background:var(--bg-darker);border:1px solid var(--border-2);border-radius:16px;width:100%;box-shadow:0 28px 70px rgba(0,0,0,.35)}
.inp{background:var(--bg-input);border:1px solid var(--border-2);color:var(--text);border-radius:8px;padding:9px 13px;font-size:13px;width:100%;transition:border-color .18s}
.inp:focus{border-color:var(--accent)}.inp::placeholder{color:var(--text-faint)}
select.inp option{background:var(--bg-input);color:var(--text)}
.lbl{display:block;font-size:11px;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.g6{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes gridFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.fu{animation:up .26s ease}
.sl{cursor:pointer;transition:all .15s;border-left:3px solid transparent}
.sl:hover{background:rgba(var(--accent-r),var(--accent-g),var(--accent-b),.05)!important;border-left-color:var(--accent)!important}
.sl.on{background:rgba(var(--accent-r),var(--accent-g),var(--accent-b),.08)!important;border-left-color:var(--accent-light)!important}
.mn{font-family:'JetBrains Mono',monospace;font-weight:600}
.stl{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.4px;color:var(--text-dim);margin-bottom:12px}
.spl{display:grid;grid-template-columns:300px 1fr;height:calc(100vh - 88px);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.spl-l{border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--bg-sidebar);overflow:hidden}
.spl-r{display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.mob-only{display:none}
.desk-only{display:block}
.desk-flex{display:flex}
.mob-drawer-overlay{display:none}
.sub-tabs{display:flex;gap:2;background:var(--bg-sidebar);border-radius:10;padding:3px;border:1px solid var(--border);width:fit-content;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.sub-tabs::-webkit-scrollbar{height:0}
main table{min-width:600px}
main .tbl-auto{overflow-x:auto;-webkit-overflow-scrolling:touch}
main>div table,main>div>div table,.spl-r table{min-width:600px}
div:has(>table){overflow-x:auto;-webkit-overflow-scrolling:touch}
@media(max-width:768px){
  main>div table,main>div>div table,.spl-r table{min-width:500px}
  .sub-tabs{width:100%;flex-wrap:wrap;gap:4px;padding:6px}
  .sub-tabs button{font-size:10px!important;padding:6px 10px!important;gap:4px!important}
  div:has(>table){overflow-x:auto}
}
@media(max-width:1024px){
  .g4{grid-template-columns:repeat(2,1fr)}
  .g6{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:768px){
  .g2{grid-template-columns:1fr}
  .g3{grid-template-columns:1fr}
  .g4{grid-template-columns:1fr 1fr}
  .g6{grid-template-columns:repeat(2,1fr)}
  .spl{grid-template-columns:1fr;height:auto}
  .spl-l{max-height:40vh;border-right:none;border-bottom:1px solid var(--border)}
  .spl-r{min-height:50vh}
  .ov{padding:0}
  .mo{border-radius:0;min-height:100vh;border:none}
  .mob-only{display:block}
  .desk-only{display:none!important}
  .desk-flex{display:none!important}
  .mob-drawer-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99;backdrop-filter:blur(4px)}
  .full-form-grid{grid-template-columns:1fr!important}
  .jc-grid{grid-template-columns:1fr!important}
  main div:has(>table){overflow-x:auto;-webkit-overflow-scrolling:touch}
  main table{min-width:580px}
  .act-bar{flex-wrap:wrap!important;gap:4px!important;justify-content:flex-start!important}
  .act-bar .bb{font-size:10px!important;padding:5px 8px!important;flex-shrink:0}
  .kpi-row{grid-template-columns:repeat(2,1fr)!important}
  .est-detail-header,.inv-detail-header{flex-direction:column!important;gap:10px!important;align-items:stretch!important}
  .est-kpi-row,.inv-kpi-row{gap:6px!important}
  .est-kpi-row>div,.inv-kpi-row>div{flex:1 1 45%!important;min-width:0!important}
}
@media(max-width:480px){
  .g4{grid-template-columns:1fr}
  .g6{grid-template-columns:1fr}
  .sub-tabs button{font-size:9px!important;padding:5px 7px!important}
  .sub-tabs button svg{display:none!important}
  .act-bar .bb{font-size:9px!important;padding:4px 6px!important}
  .est-kpi-row>div,.inv-kpi-row>div{flex:1 1 100%!important}
}
`;
