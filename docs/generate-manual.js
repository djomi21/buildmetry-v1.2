"use strict";
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, Header, Footer, PageNumber,
  NumberFormat, WidthType, BorderStyle, ShadingType,
  TableLayoutType, VerticalAlign,
} = require("docx");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const ACCENT   = "1e4d91";
const ACCENT2  = "2563eb";
const GRAY     = "6b7280";
const LIGHTBG  = "f0f5ff";
const TIPBG    = "fffbeb";
const NOTEBG   = "f0fdf4";

const blank = () => new Paragraph({ text: "", spacing: { after: 60 } });

const h1 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 0, after: 160 },
});

const h2 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 100 },
});

const h3 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 80 },
});

const p = (...parts) => {
  const children = parts.map(part =>
    typeof part === "string"
      ? new TextRun(part)
      : part
  );
  return new Paragraph({ children, spacing: { after: 100 } });
};

const bold = (text, color) => new TextRun({ text, bold: true, color: color || undefined });
const italic = (text) => new TextRun({ text, italics: true });
const colored = (text, color) => new TextRun({ text, color });

const bullet = (text, level = 0) => new Paragraph({
  children: typeof text === "string" ? [new TextRun(text)] : text,
  bullet: { level },
  spacing: { after: 60 },
});

const numbered = (text) => new Paragraph({
  children: typeof text === "string" ? [new TextRun(text)] : text,
  numbering: { reference: "steps", level: 0 },
  spacing: { after: 80 },
});

// Tip callout (yellow bg)
const tip = (text) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  layout: TableLayoutType.FIXED,
  rows: [new TableRow({
    children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: TIPBG },
      borders: {
        top:    { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        right:  { style: BorderStyle.NONE, size: 0 },
        left:   { style: BorderStyle.THICK, color: "f59e0b", size: 14 },
      },
      margins: { top: 80, bottom: 80, left: 160, right: 80 },
      children: [new Paragraph({
        children: [bold("Tip: ", "b45309"), new TextRun(text)],
        spacing: { after: 0 },
      })],
    })],
  })],
  margins: { top: 120, bottom: 120 },
});

// Note callout (green bg)
const note = (text) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  layout: TableLayoutType.FIXED,
  rows: [new TableRow({
    children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: NOTEBG },
      borders: {
        top:    { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        right:  { style: BorderStyle.NONE, size: 0 },
        left:   { style: BorderStyle.THICK, color: "16a34a", size: 14 },
      },
      margins: { top: 80, bottom: 80, left: 160, right: 80 },
      children: [new Paragraph({
        children: [bold("Note: ", "15803d"), new TextRun(text)],
        spacing: { after: 0 },
      })],
    })],
  })],
  margins: { top: 120, bottom: 120 },
});

// Reference table: headers array + rows array of string arrays
const refTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  layout: TableLayoutType.FIXED,
  rows: [
    // header row
    new TableRow({
      tableHeader: true,
      children: headers.map(h => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: ACCENT },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 120, right: 80 },
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, color: "ffffff", size: 20 })],
          spacing: { after: 0 },
        })],
      })),
    }),
    // data rows
    ...rows.map((row, ri) => new TableRow({
      children: row.map(cell => new TableCell({
        shading: ri % 2 === 0
          ? { type: ShadingType.CLEAR, fill: "f8fafc" }
          : { type: ShadingType.CLEAR, fill: "ffffff" },
        margins: { top: 70, bottom: 70, left: 120, right: 80 },
        children: [new Paragraph({
          children: [new TextRun({ text: cell, size: 20 })],
          spacing: { after: 0 },
        })],
      })),
    })),
  ],
  margins: { top: 120, bottom: 160 },
});

// Status table: colored status name + description
const statusTable = (rows) => refTable(["Status", "Meaning", "Next Action"], rows);

// ─────────────────────────────────────────────────────────────
//  SECTION CONTENT BUILDERS
// ─────────────────────────────────────────────────────────────

// Cover page
function coverPage() {
  return [
    new Paragraph({ text: "", spacing: { after: 1800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "BuildMetry", bold: true, size: 96, color: ACCENT })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "v1.0", size: 48, color: ACCENT2 })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Complete User Manual", size: 40, color: GRAY, italics: true })],
      spacing: { after: 180 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "The Contractor Operating System", size: 28, color: GRAY })],
      spacing: { after: 1600 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "2025  ·  Confidential", size: 22, color: "9ca3af" })],
      spacing: { after: 0 },
    }),
  ];
}

// Section 1 — Introduction
function sectionIntro() {
  return [
    h1("1. Introduction"),
    p("BuildMetry is an all-in-one Contractor Operating System (OS) designed to streamline every stage of a contracting business — from the first customer quote through project completion and final payment collection."),
    blank(),
    h2("1.1  Who Is BuildMetry For?"),
    bullet("General contractors and specialty trade companies"),
    bullet("Project managers overseeing multiple active jobs"),
    bullet("Field technicians who need to log hours and view tasks"),
    bullet("Office staff managing estimates, invoices, and payroll"),
    bullet("Business owners who want real-time financial insight"),
    blank(),
    h2("1.2  Core Modules"),
    refTable(
      ["Module", "Purpose"],
      [
        ["Dashboard",     "Live KPIs, revenue charts, and project overview"],
        ["Customers",     "CRM — contacts, history, tags, activity feed"],
        ["Estimates",     "Price jobs with labor, materials, and services; get approvals"],
        ["Projects",      "Track active work, budgets, tasks, and contracts"],
        ["Job Costing",   "Profitability analysis by project and crew member"],
        ["Change Orders", "Scope additions with approval workflow"],
        ["Expenses",      "Job costs and overhead tracking"],
        ["Materials",     "Inventory management with markup pricing"],
        ["Services",      "Billable service price-book with package support"],
        ["Crew",          "Subcontractors/employees, hour logging, burden rates"],
        ["Invoices",      "Billing, payment tracking, and A/R management"],
        ["Reports",       "P&L, Job P&L, A/R Aging, and Labor reports"],
        ["Company Setup", "Settings, users, roles, templates, and branding"],
        ["Contracts",     "Formal contracts inside Projects with e-signature"],
      ]
    ),
    blank(),
    h2("1.3  Data & Privacy"),
    p("All data is stored in your company's private database. BuildMetry does not share data with third parties. User accounts are role-gated so each team member sees only what their role permits."),
  ];
}

// Section 2 — Getting Started
function sectionGettingStarted() {
  return [
    h1("2. Getting Started"),
    h2("2.1  Logging In"),
    p("Navigate to your BuildMetry URL and enter your email and password. First-time users receive an invitation link and will be prompted to set a password."),
    tip("If you forget your password, contact your company Owner or Admin — they can reset it from Company Setup → Users & Roles."),
    blank(),
    h2("2.2  Navigation Sidebar"),
    p("The left sidebar lists all modules with icons. Click any item to navigate. The sidebar can be collapsed to icon-only mode by clicking the menu (≡) button in the top-left header."),
    bullet([bold("Desktop: "), new TextRun("Click the ≡ button to toggle sidebar width.")]),
    bullet([bold("Mobile: "), new TextRun("Tap the ≡ button to open the slide-out drawer.")]),
    blank(),
    h2("2.3  Theme"),
    p("Click the theme buttons at the bottom of the sidebar:"),
    bullet([bold("Light — "), new TextRun("Light background mode.")]),
    bullet([bold("Dark — "), new TextRun("Dark background mode (default).")]),
    bullet([bold("System — "), new TextRun("Follows your OS preference.")]),
    blank(),
    h2("2.4  User Profile"),
    p("Your name and role appear in the sidebar footer. Click your name to open My Profile where you can update personal details, change your password, and upload an avatar."),
    blank(),
    h2("2.5  Logging Out"),
    p("Click the arrow (→) icon next to your name in the sidebar footer. You will be returned to the login page."),
    blank(),
    h2("2.6  Overdue Invoice Alert"),
    p("A red banner appears in the top header whenever invoices are past their due date. It shows the count and total overdue amount. Click it (or navigate to Invoices) to action them."),
  ];
}

// Section 3 — Dashboard
function sectionDashboard() {
  return [
    h1("3. Dashboard"),
    p("The Dashboard provides a real-time financial and operational snapshot of your business. It is the first screen you see after logging in."),
    blank(),
    h2("3.1  KPI Cards"),
    refTable(
      ["Metric", "Description"],
      [
        ["YTD Revenue",       "Sum of all paid invoice totals for the current calendar year"],
        ["Gross Profit",      "YTD Revenue minus YTD labor and material costs"],
        ["Gross Margin %",    "Gross Profit ÷ Revenue as a percentage"],
        ["Total Invoiced",    "Sum of all invoices regardless of payment status"],
        ["Collection Rate",   "Percentage of total invoiced amount that has been collected"],
        ["Active Projects",   "Count of projects with status = Active"],
        ["Pending Estimates", "Count of estimates in Draft or Sent status"],
        ["Customers",         "Total customer count with hot-lead highlight"],
      ]
    ),
    blank(),
    h2("3.2  Charts"),
    bullet([bold("Monthly Revenue vs. Profit: "), new TextRun("Area chart showing revenue and gross profit month by month for the current year.")]),
    bullet([bold("A/R Status Breakdown: "), new TextRun("Pie chart showing the split of invoice amounts across Paid, Sent, Overdue, and Draft statuses.")]),
    blank(),
    h2("3.3  Active Projects Table"),
    p("Lists all active projects with their customer, phase, progress bar, and contract value. Click a row to jump directly to that project."),
    blank(),
    tip("The Dashboard recalculates live every time you load the page — it always reflects the latest data."),
  ];
}

// Section 4 — Customers
function sectionCustomers() {
  return [
    h1("4. Customers"),
    p("The Customers module is your CRM (Customer Relationship Manager). Track contact info, property details, lead source, tags, and all activity history per client."),
    blank(),
    h2("4.1  Adding a Customer"),
    numbered("Click New Customer in the top right."),
    numbered("Fill in at minimum the customer's full name."),
    numbered("Add phone, email, address, and property type as available."),
    numbered("Select a Lead Source so you can track where your work comes from."),
    numbered("Assign one or more Tags (optional)."),
    numbered("Click Save."),
    blank(),
    h2("4.2  Customer Fields"),
    refTable(
      ["Field", "Description", "Options / Example"],
      [
        ["Full Name",      "Required. Customer's full name.",                "John Smith"],
        ["Phone",          "Primary phone number.",                          "(555) 867-5309"],
        ["Email",          "Email address for correspondence.",              "john@email.com"],
        ["Address",        "Service / billing address.",                     "123 Main St, Miami FL"],
        ["Property Type",  "Type of property being serviced.",               "Single Family, Condo, Commercial…"],
        ["Lead Source",    "How this customer found you.",                   "Referral, Google, Website, Angi…"],
        ["Tags",           "Labels for quick filtering and segmentation.",   "VIP, Repeat, Hot Lead, Investor…"],
        ["Notes",          "Free-form notes saved to the customer record.",  "Long-term notes about the client"],
      ]
    ),
    blank(),
    h2("4.3  Customer Detail Tabs"),
    bullet([bold("Overview: "), new TextRun("Summary notes and a combined activity timeline of all estimates, projects, and invoices.")]),
    bullet([bold("Projects: "), new TextRun("All linked projects with status and contract value.")]),
    bullet([bold("Estimates: "), new TextRun("All linked estimates with status and totals.")]),
    bullet([bold("Invoices: "), new TextRun("Total billed, paid, and outstanding amounts plus all invoice records.")]),
    bullet([bold("Notes: "), new TextRun("Dedicated notes field — click anywhere in the field to edit, click away to auto-save.")]),
    blank(),
    h2("4.4  Tags"),
    refTable(
      ["Tag", "Purpose"],
      [
        ["VIP",             "High-value client — priority service"],
        ["Repeat",          "Returning customer"],
        ["Hot Lead",        "Active prospect likely to convert soon"],
        ["Investor",        "Property investor with multiple projects"],
        ["New",             "Newly added contact"],
        ["Referral Source", "This client sends referrals to your business"],
      ]
    ),
    blank(),
    tip("Use the search bar to find customers by name, email, or phone. Use the Tag filter pills to narrow the list."),
  ];
}

// Section 5 — Estimates
function sectionEstimates() {
  return [
    h1("5. Estimates"),
    p("Estimates let you price a job for a customer before any work begins. Once a customer approves an estimate, BuildMetry can automatically create a linked Project."),
    blank(),
    h2("5.1  Creating an Estimate"),
    numbered("Click New Estimate."),
    numbered("Select a Customer (required)."),
    numbered("Enter the Project / Estimate Name."),
    numbered("Set the Date and Expiry Date (default: +30 days)."),
    numbered("Add Line Items using the pickers or the + Custom Line button."),
    numbered("Adjust Tax Rate, Discount, and Deposit settings as needed."),
    numbered("Click Save. The estimate is saved in Draft status."),
    blank(),
    h2("5.2  Line Item Pickers"),
    bullet([bold("+ Material — "), new TextRun("Opens the Materials picker. Select an item from your inventory. BuildMetry auto-fills the description, unit price (cost × markup), and marks the line as a material (taxable).")]),
    bullet([bold("+ Labor — "), new TextRun("Opens the Labor/Roles picker. Select a role. BuildMetry fills the fully-burdened hourly rate and sets the unit to 'hr'.")]),
    bullet([bold("+ Service — "), new TextRun("Opens the Services picker. Single-item services add one line; Package services expand into all their component labor and material lines at once.")]),
    bullet([bold("+ Custom — "), new TextRun("Adds a blank line item. Fill in description, qty, unit price, and type manually.")]),
    blank(),
    h2("5.3  Pricing Calculations"),
    refTable(
      ["Field", "Description"],
      [
        ["Tax Rate",       "Applied to material line items only (default 6.5%)"],
        ["Discount",       "Percentage or fixed dollar amount deducted from subtotal"],
        ["Deposit",        "Optional: 'none', fixed dollar amount, or % of total"],
        ["Subtotal",       "Sum of all line item amounts (labor + materials)"],
        ["Tax",            "Tax Rate × material subtotal (after discount)"],
        ["Total",          "Subtotal − Discount + Tax"],
        ["Balance Due",    "Total − Deposit Amount"],
      ]
    ),
    blank(),
    h2("5.4  Estimate Statuses"),
    statusTable([
      ["Draft",    "Created, not yet sent to customer",          "Edit, then mark as Sent"],
      ["Sent",     "Sent to customer, awaiting their decision",  "Wait; then Approve or Decline"],
      ["Approved", "Customer accepted the estimate",             "Convert to Invoice or Project auto-creates"],
      ["Declined", "Customer rejected the estimate",             "Archive or revise and resubmit"],
    ]),
    blank(),
    h2("5.5  Sending & Approving"),
    numbered("Open the estimate and click Mark Sent. Optionally email the PDF to the customer."),
    numbered("When the customer accepts, click Approve."),
    numbered("BuildMetry automatically creates a linked Project with contract value, labor budget, and materials budget derived from the estimate totals."),
    blank(),
    h2("5.6  Actions"),
    bullet([bold("Print / PDF — "), new TextRun("Generates a professional PDF with itemized labor and materials sections, totals, and your company branding.")]),
    bullet([bold("Email — "), new TextRun("Sends the estimate PDF directly to the customer's email address on file.")]),
    bullet([bold("Signature Link — "), new TextRun("Generates a secure link you can send to the customer for electronic signature approval.")]),
    bullet([bold("Convert to Invoice — "), new TextRun("Creates a new invoice pre-populated with the estimate's line items.")]),
    blank(),
    tip("You can edit line items after saving. Changes to a Draft estimate do not affect any linked projects or invoices."),
  ];
}

// Section 6 — Projects
function sectionProjects() {
  return [
    h1("6. Projects"),
    p("Projects are the operational core of BuildMetry. Each project tracks budget vs. actuals, phases, tasks, contracts, and links to estimates, change orders, and invoices."),
    blank(),
    h2("6.1  Creating a Project"),
    p("Projects are typically auto-created when an Estimate is Approved. You can also create them manually:"),
    numbered("Click New Project."),
    numbered("Enter the Project Name and select a Customer."),
    numbered("Set Contract Value, Budget Labor, and Budget Materials."),
    numbered("Set Start Date, End Date, Phase, and Status."),
    numbered("Enter a Progress % (updated manually as work progresses)."),
    numbered("Click Create Project."),
    blank(),
    h2("6.2  Project Statuses"),
    statusTable([
      ["Active",    "Work is underway",                 "Update progress, log hours, log expenses"],
      ["On Hold",   "Temporarily paused",               "Resume when ready by setting back to Active"],
      ["Complete",  "All work finished",                "Final invoice has been created automatically"],
      ["Cancelled", "Project will not proceed",         "No further action required"],
    ]),
    blank(),
    h2("6.3  Budget Tracking"),
    p("The project detail header shows six budget cards:"),
    bullet([bold("Contract — "), new TextRun("The agreed contract value with the customer.")]),
    bullet([bold("Budget Labor / Budget Mat — "), new TextRun("Planned labor and materials spend.")]),
    bullet([bold("Actual Labor / Actual Mat — "), new TextRun("Real spend drawn from logged hours and expenses. Color turns red if over budget.")]),
    bullet([bold("Gross Profit — "), new TextRun("Contract Value minus total actual costs. Red if negative.")]),
    blank(),
    h2("6.4  Project Phases"),
    p("The project phase tracks where work stands in the lifecycle:"),
    bullet("Initiation (feasibility)"),
    bullet("Planning"),
    bullet("Execution"),
    bullet("Finish Work"),
    bullet("Closeout (final inspection/handover)"),
    p("Phases are configurable in Company Setup → Labor Roles."),
    blank(),
    h2("6.5  Tasks"),
    p("The Overview tab contains a full task management board grouped by phase:"),
    bullet([bold("Add Task — "), new TextRun("Set title, assign a crew member, choose status, and set a due date.")]),
    bullet([bold("Status Toggle — "), new TextRun("Click the checkbox on any task to cycle: To Do → In Progress → Done.")]),
    bullet([bold("Phase Grouping — "), new TextRun("Tasks are grouped under their assigned phase. Current phase tasks are highlighted.")]),
    blank(),
    h2("6.6  Contracts Tab"),
    p("Each project has a Contracts tab where formal contract documents are created and managed. See Section 16 — Contracts for full details."),
    blank(),
    h2("6.7  Mark Complete"),
    numbered("Click the Mark Complete button (only shown on Active projects)."),
    numbered("Confirm the dialog. BuildMetry will:"),
    numbered("Set the project status to Complete, phase to Closeout, and progress to 100%."),
    numbered("Automatically create a Final Invoice in Draft status containing:"),
    bullet("All line items from the linked estimate", 1),
    bullet("Separate line items for each approved Change Order (labor and materials)", 1),
    numbered("Open the Invoices module to review, edit, and send the final invoice."),
    blank(),
    tip("Only Owner, Admin, and Project Manager roles can delete projects."),
  ];
}

// Section 7 — Job Costing
function sectionJobCosting() {
  return [
    h1("7. Job Costing"),
    p("Job Costing gives you deep profitability analysis by project, showing where labor and material margins are healthy — and where they're not."),
    blank(),
    h2("7.1  Project Summary Cards"),
    bullet([bold("Contract Value — "), new TextRun("The agreed price with the customer.")]),
    bullet([bold("Total Budget — "), new TextRun("Sum of budgeted labor and materials.")]),
    bullet([bold("Total Actual — "), new TextRun("Sum of all actual logged labor costs and material expenses.")]),
    bullet([bold("Variance — "), new TextRun("Actual minus Budget. Highlighted red if over budget.")]),
    bullet([bold("Gross Profit — "), new TextRun("Contract Value minus Total Actual.")]),
    bullet([bold("Gross Margin % — "), new TextRun("Gross Profit ÷ Contract Value.")]),
    blank(),
    h2("7.2  Labor Detail Table"),
    p("For the selected project, shows a breakdown of each crew member's contribution:"),
    refTable(
      ["Column", "Description"],
      [
        ["Crew Member",    "Name and role of the worker"],
        ["Hours",          "Total hours logged on this project"],
        ["Billed Amount",  "Hours × billable rate (what the customer pays)"],
        ["True Cost",      "Hours × fully burdened rate (your real cost)"],
        ["Margin %",       "Net profit margin on this crew member's labor (green ≥30%, orange <30%)"],
      ]
    ),
    blank(),
    h2("7.3  By Role Breakdown"),
    p("Aggregates all labor by trade role (e.g., Carpenter, Electrician). Useful for identifying which trade types drive the most cost."),
    blank(),
    h2("7.4  All Projects Chart"),
    p("A bar chart comparing Contract Value, Actual Cost, and Gross Profit across all projects. Visually identifies the most and least profitable jobs at a glance."),
    blank(),
    tip("Use the project selector buttons at the top to focus the labor detail on one specific project."),
  ];
}

// Section 8 — Change Orders
function sectionChangeOrders() {
  return [
    h1("8. Change Orders"),
    p("Change Orders (COs) track approved scope additions or adjustments that change the project cost. Each approved CO automatically updates the project's contract value and budget."),
    blank(),
    h2("8.1  Creating a Change Order"),
    numbered("Click New Change Order."),
    numbered("Select the Project (filtered to Active projects)."),
    numbered("Enter a Description of the scope change."),
    numbered("Select a Reason for the change."),
    numbered("Enter the Labor Amount and/or Material Amount (the Total auto-calculates)."),
    numbered("Add Notes if needed."),
    numbered("Save — the CO is created in Pending status."),
    blank(),
    h2("8.2  Change Order Statuses"),
    statusTable([
      ["Pending",  "Awaiting approval from Owner/PM",      "Review and Approve or Decline"],
      ["Approved", "Accepted — project budget updated",    "CO will be included in final invoice"],
      ["Declined", "Rejected — no budget change",          "Archive or revise and resubmit"],
    ]),
    blank(),
    h2("8.3  Approval Effect on Project"),
    p("When a Change Order is Approved:"),
    bullet("Project Contract Value increases by the CO total"),
    bullet("Project Budget Labor increases by the CO labor amount"),
    bullet("Project Budget Materials increases by the CO material amount"),
    blank(),
    h2("8.4  Change Order Reasons"),
    bullet("Customer request"), bullet("Code requirement"), bullet("Design change"),
    bullet("Unforeseen condition"), bullet("Scope clarification"), bullet("Value engineering"),
    blank(),
    h2("8.5  Final Invoice Integration"),
    p("When a project is marked Complete, all Approved Change Orders are automatically added as separate line items on the final invoice (labeled CO #XXX — Description — Labor/Materials)."),
    blank(),
    note("Only Approved COs are included in the final invoice. Pending or Declined COs are excluded."),
  ];
}

// Section 9 — Expenses
function sectionExpenses() {
  return [
    h1("9. Expenses"),
    p("Log any business expense — materials purchases, subcontractor payments, equipment rentals, permits, and overhead costs. Expenses tied to a project update that project's actual cost totals."),
    blank(),
    h2("9.1  Logging an Expense"),
    numbered("Click New Expense."),
    numbered("Set the Date and select a Category."),
    numbered("Enter a Vendor name (optional but recommended)."),
    numbered("Write a Description of what was purchased."),
    numbered("Enter the Amount."),
    numbered("Select a Project to link this to a job (leave blank for overhead)."),
    numbered("Check Receipt on File and/or Reimbursable as appropriate."),
    numbered("Save."),
    blank(),
    h2("9.2  Expense Categories"),
    bullet("Materials"), bullet("Labor"), bullet("Subcontractor / Crew"),
    bullet("Utilities"), bullet("Equipment"), bullet("Permits"), bullet("Other (user-defined)"),
    blank(),
    h2("9.3  Job Costs vs. Overhead"),
    bullet([bold("Job Cost: "), new TextRun("Expense with a Project selected. Counted toward that project's actual materials cost.")]),
    bullet([bold("Overhead: "), new TextRun("Expense with no project selected. Tracked separately for business overhead analysis.")]),
    blank(),
    h2("9.4  KPI Cards"),
    bullet([bold("Total Expenses — "), new TextRun("Sum of all recorded expense amounts.")]),
    bullet([bold("Job Costs — "), new TextRun("Expenses linked to a project.")]),
    bullet([bold("Overhead — "), new TextRun("Expenses not linked to any project.")]),
    bullet([bold("Reimbursable — "), new TextRun("Expenses marked as reimbursable by the customer.")]),
    blank(),
    tip("Filter expenses by Category or by Project to quickly find what you need. Use the search bar to search by description or vendor name."),
  ];
}

// Section 10 — Materials
function sectionMaterials() {
  return [
    h1("10. Materials"),
    p("The Materials module is your inventory price book. Keep a list of commonly used materials with your cost, markup percentage, and current stock levels. These items appear in the Materials Picker inside Estimates, Invoices, and Contracts."),
    blank(),
    h2("10.1  Adding a Material"),
    numbered("Click Add Material."),
    numbered("Enter the Name (required) and select a Category."),
    numbered("Select the Unit type (ea, SF, LF, bag, sheet, etc.)."),
    numbered("Enter your Cost per unit."),
    numbered("Enter a Markup % — the Sell Price auto-calculates (Cost × (1 + Markup%))."),
    numbered("Set Supplier name and Stock Quantity."),
    numbered("Set Reorder At threshold for low-stock alerts."),
    numbered("Save."),
    blank(),
    h2("10.2  Material Fields"),
    refTable(
      ["Field", "Description", "Example"],
      [
        ["Name",        "Material name",                    "OSB Sheathing 7/16\""],
        ["Category",    "Material type",                    "Lumber, Drywall, Flooring…"],
        ["Unit",        "Unit of measure",                  "ea, SF, LF, bag, sheet, gal…"],
        ["Supplier",    "Vendor you purchase from",         "Home Depot, ABC Supply"],
        ["Cost",        "Your purchase cost per unit",      "$18.50"],
        ["Markup %",    "Margin percentage to add",         "20%"],
        ["Sell Price",  "Auto-calculated: Cost × (1+Markup%)", "$22.20"],
        ["Stock Qty",   "Current inventory count",          "48"],
        ["Reorder At",  "Low-stock alert threshold",        "10"],
      ]
    ),
    blank(),
    h2("10.3  Low Stock Alerts"),
    p("A red alert banner appears at the top of the Materials page when any item's stock quantity falls at or below its Reorder At threshold. The banner lists all affected items so you can reorder promptly."),
    blank(),
    h2("10.4  Using Materials in Estimates"),
    p("In any Estimate or Invoice, click + Material to open the picker. Select a material and it will be added as a line item with qty = 1, unit price = sell price, and type = Material (taxable)."),
    blank(),
    tip("Keep your materials list updated after each project to maintain accurate stock counts and sell prices."),
  ];
}

// Section 11 — Services
function sectionServices() {
  return [
    h1("11. Services"),
    p("The Services module is your billable service price book. Define standard services — individual line items or multi-item packages — that can be quickly inserted into Estimates, Invoices, and Contracts."),
    blank(),
    h2("11.1  Service Types"),
    bullet([bold("Single-Item Service — "), new TextRun("A single labor or material line item with a fixed unit and rate. Example: Tile Installation at $12/SF or Cleanup at $600 lump sum.")]),
    bullet([bold("Package Service — "), new TextRun("A bundle of labor and material line items grouped under one service name. Example: 'Bathroom Reno Package' containing demo labor, rough plumbing, tile labor, and grout material.")]),
    blank(),
    h2("11.2  Adding a Service"),
    numbered("Click Add Service."),
    numbered("Enter a Name (required) and optional Description."),
    numbered("Select a Category."),
    numbered("For a Single-Item service: set Type (Labor/Material), Unit, and Rate."),
    numbered("For a Package: click + Add Labor Item or + Add Material Item to add line items."),
    numbered("Save."),
    blank(),
    h2("11.3  Package Line Items"),
    p("Each line item in a Package has the following fields:"),
    refTable(
      ["Field", "Description", "Example"],
      [
        ["Description", "What this line item covers",           "Rough plumbing labor"],
        ["Qty",         "Quantity",                             "1"],
        ["Unit",        "Unit of measure",                      "ls, sf, hr, ea…"],
        ["Price",       "Unit price for this item",             "$3,200.00"],
        ["Type",        "Click the badge to toggle Labor or Material", "Labor (orange) / Material (purple)"],
      ]
    ),
    p("The running total at the bottom of the package table shows the sum of all line items (qty × price)."),
    blank(),
    h2("11.4  How Packages Insert into Documents"),
    bullet([bold("Single-Item: "), new TextRun("Clicking a service in the picker adds ONE line item to the estimate/invoice/contract.")]),
    bullet([bold("Package: "), new TextRun("Clicking a Package service in the picker expands ALL its line items directly into the document — each labor and material item becomes its own separate line. This saves time on complex jobs.")]),
    blank(),
    h2("11.5  Service Categories"),
    p("General · Plumbing · Electrical · Framing · Painting · Flooring · Roofing · HVAC · Concrete · Landscaping · Cleanup"),
    blank(),
    h2("11.6  KPI Cards"),
    bullet([bold("Total Services — "), new TextRun("Count of all services in the price book.")]),
    bullet([bold("Categories — "), new TextRun("Number of distinct categories in use.")]),
    bullet([bold("Packages — "), new TextRun("Count of services that have package line items.")]),
    bullet([bold("Labor Items — "), new TextRun("Count of single-item labor services.")]),
    blank(),
    tip("Build packages for your most common job types (e.g., 'Half Bath Reno', 'Deck Addition') to speed up estimate creation dramatically."),
  ];
}

// Section 12 — Crew
function sectionCrew() {
  return [
    h1("12. Crew"),
    p("The Crew module (also called Subs) manages your workforce — W-2 employees, 1099 contractors, and sub companies. Track payroll rates, billable rates, hour logs, and labor profitability."),
    blank(),
    h2("12.1  Adding a Crew Member"),
    numbered("Click Add Crew Member."),
    numbered("Enter Name and optionally Company name."),
    numbered("Select Employee Type: W-2 Employee, 1099 Contractor, or Sub Company."),
    numbered("Select their Role / Trade from the pre-configured role list."),
    numbered("Enter Hourly Wage (what you pay them) and Billable Rate (what you charge the customer)."),
    numbered("BuildMetry auto-calculates the Fully Burdened Rate (wage + payroll burden % + benefits %)."),
    numbered("Add Phone, Email, Hire Date, and Certifications as needed."),
    numbered("Save."),
    blank(),
    h2("12.2  Labor Burden Calculation"),
    p("The Fully Burdened Rate represents your true cost per labor hour:"),
    p("  Fully Burdened Rate = Hourly Wage × (1 + Payroll Burden % + Benefits %)"),
    p("Payroll Burden and Benefits percentages are configured per role in Company Setup → Labor Roles. This rate is used in Job Costing to calculate true labor cost, helping you price jobs profitably."),
    blank(),
    h2("12.3  Logging Hours"),
    numbered("Select a crew member and click Log Hours."),
    numbered("Select the Project, Date, and enter the number of Hours."),
    numbered("Add a description of the task (optional)."),
    numbered("Save. Hours appear in the log below the crew member detail."),
    blank(),
    h2("12.4  Hour Approval Workflow"),
    bullet([bold("Pending — "), new TextRun("Newly logged hours awaiting approval.")]),
    bullet([bold("Approved — "), new TextRun("Owner, Admin, or Foreman has approved the log entry.")]),
    p("Approved hours flow into Job Costing as confirmed actual labor costs."),
    blank(),
    h2("12.5  Crew Metrics"),
    bullet([bold("Total Hours — "), new TextRun("All hours logged across all projects.")]),
    bullet([bold("Total Billed — "), new TextRun("Hours × billable rate (revenue generated by this crew member).")]),
    bullet([bold("True Labor Cost — "), new TextRun("Hours × fully burdened rate (your actual cost).")]),
    bullet([bold("Labor Margin % — "), new TextRun("(Billed − Cost) ÷ Billed. Green if ≥ 30%, orange if below.")]),
    blank(),
    refTable(
      ["Employee Type", "Description", "Tax Treatment"],
      [
        ["W-2 Employee",    "On your payroll — full burden applies",  "Payroll taxes withheld"],
        ["1099 Contractor", "Independent contractor",                  "No withholding; Form 1099"],
        ["Sub Company",     "Another business you subcontract to",     "Invoice-based; no payroll"],
      ]
    ),
    blank(),
    tip("Keep billable rates higher than fully burdened rates to ensure positive labor margin. A 30% labor margin is a healthy target."),
  ];
}

// Section 13 — Invoices
function sectionInvoices() {
  return [
    h1("13. Invoices"),
    p("Invoices are the billing backbone of BuildMetry. Create invoices from estimates, build them manually, or let the system auto-generate a final invoice when a project is marked complete."),
    blank(),
    h2("13.1  Creating an Invoice"),
    numbered("Click New Invoice."),
    numbered("Select a Customer (required)."),
    numbered("Optionally link to a Project."),
    numbered("Set Issue Date and Due Date (default: +30 days)."),
    numbered("Add Line Items using the Materials, Labor, Services pickers or manual entry."),
    numbered("Set Tax Rate, Discount, and Deposit settings."),
    numbered("Add Notes for the customer (e.g., payment instructions)."),
    numbered("Save. Invoice is created in Draft status."),
    blank(),
    h2("13.2  Invoice Statuses"),
    statusTable([
      ["Draft",    "Created, not yet sent",           "Review and mark Sent when ready"],
      ["Sent",     "Sent to customer, awaiting payment", "Follow up; mark Paid when received"],
      ["Paid",     "Payment confirmed",                "Archive; feeds YTD revenue totals"],
      ["Overdue",  "Past due date, unpaid",            "Follow up immediately; triggers alert banner"],
      ["Void",     "Cancelled, will not be paid",      "No further action"],
    ]),
    blank(),
    h2("13.3  Marking an Invoice Paid"),
    numbered("Open the invoice."),
    numbered("Click Mark Paid."),
    numbered("Select the Paid Date (defaults to today)."),
    numbered("Confirm. The status changes to Paid and the amount is counted in YTD Revenue."),
    blank(),
    h2("13.4  Line Item Pickers"),
    p("Invoices use the same pickers as Estimates:"),
    bullet([bold("+ Material — "), new TextRun("Add from Materials inventory (cost × markup = sell price).")]),
    bullet([bold("+ Labor — "), new TextRun("Add from labor roles at fully burdened rate.")]),
    bullet([bold("+ Service — "), new TextRun("Add single services or expand Packages into all component lines.")]),
    bullet([bold("+ Custom — "), new TextRun("Manually enter any description, qty, and price.")]),
    blank(),
    h2("13.5  Pricing Calculations"),
    p("Invoices use the same tax, discount, and deposit logic as Estimates. See Section 5.3 for full details."),
    blank(),
    h2("13.6  Final Invoice (Auto-Created)"),
    p("When a project is marked Complete, BuildMetry automatically creates a Final Invoice containing:"),
    bullet("All estimate line items"),
    bullet("Each approved Change Order as separate labor and material line items"),
    p("The auto-created invoice is in Draft status — review it before sending."),
    blank(),
    h2("13.7  Actions"),
    bullet([bold("Print / PDF — "), new TextRun("Professional invoice PDF with your company branding.")]),
    bullet([bold("Email — "), new TextRun("Send directly to the customer's email on file.")]),
    blank(),
    tip("Use the Overdue filter to quickly see all past-due invoices and prioritize follow-up calls."),
  ];
}

// Section 14 — Reports
function sectionReports() {
  return [
    h1("14. Reports"),
    p("The Reports module provides four financial and operational reports to help you understand business performance, job profitability, cash collection, and labor efficiency."),
    blank(),
    h2("14.1  P&L Summary (YTD)"),
    p("An annual Profit & Loss overview showing month-by-month revenue, costs, and profit."),
    bullet([bold("KPIs: "), new TextRun("YTD Revenue, Gross Profit, Margin %, YTD Labor Cost.")]),
    bullet([bold("Monthly Chart: "), new TextRun("Bar chart comparing Revenue, Profit, Labor, and Materials per month.")]),
    bullet([bold("Monthly Table: "), new TextRun("Revenue, Labor, Materials, Other Costs, Profit, and Margin % for each month with a YTD totals row.")]),
    blank(),
    h2("14.2  Job P&L"),
    p("Profitability breakdown per project."),
    bullet([bold("Chart: "), new TextRun("Bar chart comparing Contract Value, Actual Cost, and Gross Profit for each project.")]),
    bullet([bold("Table: "), new TextRun("Project, Customer, Contract, Actual Labor, Actual Materials, Total Actual, Gross Profit, Margin %, and Status.")]),
    blank(),
    h2("14.3  A/R Aging"),
    p("Tracks outstanding invoices and how long they have been unpaid."),
    bullet([bold("KPIs: "), new TextRun("Total Billed, Collected, Overdue Amount, Outstanding Amount.")]),
    bullet([bold("Table: "), new TextRun("Invoice #, Customer, Issue Date, Due Date, Days Past Due, Amount, and Status. Overdue rows highlighted in red.")]),
    blank(),
    h2("14.4  Labor Report"),
    p("Profitability analysis by crew member."),
    bullet([bold("KPIs: "), new TextRun("Total Hours, Total Billed Labor, True Labor Cost, Avg Labor Margin.")]),
    bullet([bold("Table: "), new TextRun("Crew Member, Role, Wage/hr, Bill/hr, True Cost/hr, Hours, Billed, True Cost, Net, Margin %.")]),
    blank(),
    h2("14.5  Exporting Reports"),
    p("All four reports can be printed or exported to PDF. Click the Print / Export button in the top-right of any report tab. The PDF includes your company name and logo."),
    blank(),
    tip("Run the A/R Aging report weekly to stay on top of collections. Even a one-week follow-up call can significantly improve your collection rate."),
  ];
}

// Section 15 — Company Setup
function sectionCompanySetup() {
  return [
    h1("15. Company Setup"),
    p("Company Setup is the control center for your BuildMetry account. Only Owner and Admin roles have full access."),
    blank(),
    h2("15.1  Company Info"),
    p("Set your company name, address, phone, email, website, Tax ID/EIN, and business type. Upload your company logo — it appears on all printed Estimates, Invoices, and Contracts."),
    bullet([bold("Estimate Footer — "), new TextRun("Custom text shown at the bottom of every estimate PDF.")]),
    bullet([bold("Invoice Footer — "), new TextRun("Custom text shown at the bottom of every invoice PDF (e.g., payment instructions, thank-you message).")]),
    blank(),
    h2("15.2  Users & Roles"),
    p("Manage all user accounts for your company:"),
    numbered("Click Add User to invite a new team member by name, email, and role."),
    numbered("They receive an invitation email with a link to set their password."),
    numbered("Active users can log in and use features permitted by their role."),
    numbered("To suspend access, click Disable on the user — they can no longer log in."),
    blank(),
    refTable(
      ["Role", "Typical Access Level"],
      [
        ["Owner",           "Full access to all modules, settings, and user management"],
        ["Admin",           "Full access except cannot delete the Owner account"],
        ["Project Manager", "Estimates, Projects, Change Orders, Reports"],
        ["Field Tech",      "View tasks, log hours; limited edit access"],
        ["Foreman",         "Hour approval, task management, Change Orders"],
        ["Accountant",      "Invoices, Expenses, Reports — no project editing"],
      ]
    ),
    blank(),
    h2("15.3  Labor Roles"),
    p("Define the trades and their payroll burden rates:"),
    bullet([bold("Title — "), new TextRun("Role name (e.g., Carpenter, Electrician, Plumber).")]),
    bullet([bold("Payroll Burden % — "), new TextRun("Employer payroll taxes and insurance as a percentage of wage.")]),
    bullet([bold("Benefits % — "), new TextRun("Health insurance, retirement, and other benefits as a % of wage.")]),
    p("These percentages feed directly into the Fully Burdened Rate calculation for every crew member assigned to this role."),
    blank(),
    h2("15.4  Scope & Exclusion Templates"),
    p("Save reusable blocks of scope of work text and exclusion language for use in Contracts:"),
    numbered("Click Add Template and give it a name."),
    numbered("Paste or type the standard scope text."),
    numbered("Save. The template appears in the 'Use Template' picker inside any Contract."),
    blank(),
    h2("15.5  Theme & Branding"),
    p("Pick an Accent Color to customize the look of BuildMetry. The accent color affects buttons, progress bars, charts, badges, and the sidebar. Click a color swatch or enter a hex value and the preview updates live."),
    blank(),
    h2("15.6  Email Settings"),
    p("Configure your outgoing email settings (SMTP) so BuildMetry can send estimates and invoices directly from your business email address:"),
    bullet("SMTP Host and Port"),
    bullet("Username and Password"),
    bullet("From Email Address and Display Name"),
    bullet("Email Footer (appended to all outgoing emails)"),
    blank(),
    note("If SMTP is not configured, email sending will be unavailable. Printed PDFs can always be attached and emailed manually."),
  ];
}

// Section 16 — Contracts
function sectionContracts() {
  return [
    h1("16. Contracts"),
    p("The Contracts module lives inside each Project (Projects → select a project → Contracts tab). It lets you create formal contract documents with scope of work, payment schedules, and e-signature support."),
    blank(),
    h2("16.1  Accessing Contracts"),
    numbered("Navigate to the Projects module."),
    numbered("Select a project from the left panel."),
    numbered("Click the Contracts tab in the project detail area."),
    numbered("Click New Contract to create the first contract for this project."),
    blank(),
    h2("16.2  Contract Types"),
    bullet("Prime — Main agreement between you and your client"),
    bullet("Subcontractor — Agreement between you and a sub company"),
    bullet("Change Order — Formal modification to an existing contract"),
    bullet("Custom — Any other contract type"),
    blank(),
    h2("16.3  Contract Statuses"),
    statusTable([
      ["Draft",     "Being written, not yet sent",            "Complete and send to client"],
      ["Sent",      "Delivered to client",                    "Await signature or approval"],
      ["Active",    "Signed and work has started",            "Manage milestones and changes"],
      ["Completed", "All work done, final payment received",  "Archive"],
      ["Expired",   "End date passed without completion",     "Extend or close out"],
    ]),
    blank(),
    h2("16.4  Quick Start Templates"),
    p("When a contract has no line items yet, Quick Start buttons appear at the top of the Line Items section. Clicking a template (e.g., 'Kitchen Remodel', 'Bathroom Reno') instantly populates the contract with a complete set of pre-defined labor and material line items. You can edit them freely after insertion."),
    blank(),
    h2("16.5  Line Items"),
    p("Add line items to the contract using the same pickers as Estimates and Invoices:"),
    bullet([bold("+ From Services — "), new TextRun("Opens the Services picker. Single items add one line; Packages expand into all component lines.")]),
    bullet([bold("Manual Entry — "), new TextRun("Edit the line item table directly — change description, qty, unit price, and Labor/Material type.")]),
    blank(),
    h2("16.6  Scope of Work & Exclusions"),
    p("The Scope section contains two large text fields:"),
    bullet([bold("Scope of Work — "), new TextRun("Detailed description of what is included in the contract.")]),
    bullet([bold("Exclusions — "), new TextRun("Explicit list of what is NOT included.")]),
    p("Click Use Template next to either field to quickly insert saved scope or exclusion text from your templates (configured in Company Setup)."),
    blank(),
    h2("16.7  Payment Schedule (Milestones)"),
    p("Define when payments are due throughout the project:"),
    numbered("In the Payment Schedule section, click Add Milestone."),
    numbered("Name the milestone (e.g., 'Deposit', 'Rough-In Complete', 'Final')."),
    numbered("Set the Amount and Due Date."),
    numbered("As each milestone is paid, mark its status as Paid."),
    p("The total of all milestones is validated against the contract total — a warning appears if they don't match."),
    blank(),
    h2("16.8  Signature Workflow"),
    numbered("Click Sign Link button in the contract form."),
    numbered("A unique, secure signature URL is generated and copied to your clipboard."),
    numbered("Send this link to your client by email or text."),
    numbered("The client opens the link and signs electronically."),
    numbered("The Signature Status updates from Unsigned → Signed, with a timestamp."),
    blank(),
    h2("16.9  Financial Summary"),
    p("The Pricing & Tax section shows:"),
    bullet([bold("Discount % — "), new TextRun("Applied to the subtotal.")]),
    bullet([bold("Tax % — "), new TextRun("Applied to material line items.")]),
    bullet([bold("Retention % — "), new TextRun("A holdback amount (e.g., 10%) withheld until project completion.")]),
    blank(),
    h2("16.10  Print / Export PDF"),
    p("Click Print to generate a full contract PDF including:"),
    bullet("Contract header with your company logo and client info"),
    bullet("Itemized line items (Labor and Materials sections)"),
    bullet("Financial summary (discount, tax, retention, total)"),
    bullet("Payment schedule milestones table"),
    bullet("Scope of Work and Exclusions sections"),
    bullet("Signature blocks for contractor and client"),
    blank(),
    tip("Always collect a signed contract before starting work. Use the Signature Link feature to make the signing process fast and paperless."),
  ];
}

// Section 17 — Key Workflows
function sectionWorkflows() {
  return [
    h1("17. Key Workflows"),
    blank(),
    h2("17.1  Full Job Lifecycle: Estimate → Project → Invoice"),
    numbered("Create a Customer record."),
    numbered("Create an Estimate for the customer. Add line items using Materials, Labor, and Services pickers."),
    numbered("Mark the Estimate as Sent. Email the PDF to the customer."),
    numbered("Customer approves. Click Approve on the Estimate."),
    numbered("BuildMetry auto-creates a linked Project with budget values drawn from the estimate."),
    numbered("Go to the Project. Create a Contract in the Contracts tab. Collect e-signature."),
    numbered("Assign crew members. Have them log hours against the project."),
    numbered("Log expenses (material purchases, permit fees) against the project."),
    numbered("If scope changes arise, create a Change Order (Pending → Approved)."),
    numbered("Monitor Budget vs. Actual in the Project detail view and in Job Costing."),
    numbered("When work is complete, click Mark Complete on the project."),
    numbered("BuildMetry creates the Final Invoice (estimate lines + approved COs)."),
    numbered("Review the Final Invoice, then mark it Sent."),
    numbered("When the client pays, mark the Invoice as Paid."),
    numbered("Check the Dashboard and Reports to see the job's impact on YTD numbers."),
    blank(),
    h2("17.2  Change Order Impact"),
    numbered("Field crew identifies a scope change on-site."),
    numbered("Foreman or PM creates a Change Order with description, reason, and amounts."),
    numbered("Owner/Admin approves the CO."),
    numbered("Project contract value and budgets update automatically."),
    numbered("When the project is marked Complete, the CO becomes a line item on the final invoice."),
    blank(),
    h2("17.3  Crew Hour Logging & Approval"),
    numbered("Crew member logs hours: Crew → select member → Log Hours → choose project, date, hours."),
    numbered("Hours appear as Pending in the hour log."),
    numbered("Owner, Admin, or Foreman reviews and clicks Approve."),
    numbered("Approved hours feed into Job Costing as actual labor costs."),
    blank(),
    h2("17.4  Service Package Workflow"),
    numbered("Go to Services → Add Service."),
    numbered("Name the package (e.g., 'Full Bathroom Reno')."),
    numbered("Click + Add Labor Item for each labor task. Set description, qty, unit, and price."),
    numbered("Click + Add Material Item for each material. Set description, qty, unit, and price."),
    numbered("Save. The service now shows as 'Package · N items' in the catalog."),
    numbered("In an Estimate or Invoice, click + Service → select the Package."),
    numbered("All package line items expand directly into the document. Edit as needed."),
    blank(),
    h2("17.5  Contract Signature Process"),
    numbered("Go to the project → Contracts tab → open or create a contract."),
    numbered("Fill in all sections: line items, scope, exclusions, milestones, pricing."),
    numbered("Click Sign Link. A unique URL is generated."),
    numbered("Send the URL to your client via email or text."),
    numbered("Client clicks the link, reviews the contract, and signs."),
    numbered("Signature Status in the contract updates to Signed."),
    numbered("Set the Contract Status to Active and begin work."),
  ];
}

// Section 18 — Glossary
function sectionGlossary() {
  return [
    h1("18. Glossary"),
    p("Key terms used throughout BuildMetry:"),
    blank(),
    refTable(
      ["Term", "Definition"],
      [
        ["A/R (Accounts Receivable)", "Money owed to your company by customers for completed work."],
        ["Balance Due",               "The amount a customer still owes on an invoice (Total − Deposit)."],
        ["Billable Rate",             "The hourly rate you charge the customer for a crew member's labor."],
        ["Budget vs. Actual",         "Comparison of planned costs (budget) against real recorded costs (actual)."],
        ["Change Order (CO)",         "A formal document authorizing a change in project scope and price."],
        ["Contract Value",            "The total agreed price between you and the customer for a project."],
        ["Deposit",                   "An upfront partial payment collected before work begins."],
        ["Discount",                  "A reduction applied to the subtotal — either a % or a fixed dollar amount."],
        ["Estimate",                  "A priced proposal sent to a customer before work is approved."],
        ["Exclusions",                "Work explicitly NOT included in the scope of a contract."],
        ["Fully Burdened Rate",       "Total cost per labor hour including wage, payroll taxes, and benefits."],
        ["Gross Margin %",            "Gross Profit divided by Revenue, expressed as a percentage."],
        ["Gross Profit",              "Revenue minus direct costs (labor + materials)."],
        ["isMaterial",                "A line item flag — when true, the line is subject to sales tax."],
        ["Labor Burden",              "Employer costs beyond wages: payroll taxes, insurance, and benefits."],
        ["Milestone",                 "A scheduled payment point in a contract payment schedule."],
        ["Overdue",                   "An invoice that has passed its due date without being paid."],
        ["Package (Service)",         "A service that contains multiple labor and material line items bundled together."],
        ["Retention",                 "A percentage of the contract withheld until final project acceptance."],
        ["YTD",                       "Year-To-Date — figures accumulated from January 1st of the current year."],
      ]
    ),
  ];
}

// ─────────────────────────────────────────────────────────────
//  BUILD DOCUMENT
// ─────────────────────────────────────────────────────────────

const children = [
  ...coverPage(),
  ...sectionIntro(),
  ...sectionGettingStarted(),
  ...sectionDashboard(),
  ...sectionCustomers(),
  ...sectionEstimates(),
  ...sectionProjects(),
  ...sectionJobCosting(),
  ...sectionChangeOrders(),
  ...sectionExpenses(),
  ...sectionMaterials(),
  ...sectionServices(),
  ...sectionCrew(),
  ...sectionInvoices(),
  ...sectionReports(),
  ...sectionCompanySetup(),
  ...sectionContracts(),
  ...sectionWorkflows(),
  ...sectionGlossary(),
];

const doc = new Document({
  creator: "BuildMetry",
  title: "BuildMetry v1.0 — User Manual",
  description: "Complete user manual for BuildMetry contractor OS",
  numbering: {
    config: [{
      reference: "steps",
      levels: [{
        level: 0,
        format: NumberFormat.DECIMAL,
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 720, hanging: 360 } },
        },
      }],
    }],
  },
  styles: {
    default: {
      heading1: {
        run: { color: ACCENT, bold: true, size: 36 },
        paragraph: { spacing: { after: 160 } },
      },
      heading2: {
        run: { color: ACCENT2, bold: true, size: 26 },
        paragraph: { spacing: { before: 240, after: 100 } },
      },
      heading3: {
        run: { color: "374151", bold: true, size: 22 },
        paragraph: { spacing: { before: 180, after: 80 } },
      },
    },
  },
  sections: [{
    properties: { titlePage: true },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "BuildMetry v1.0  —  User Manual", color: "9ca3af", size: 18 })],
        })],
      }),
      first: new Header({ children: [new Paragraph({ text: "" })] }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], color: "9ca3af", size: 18 }),
          ],
        })],
      }),
      first: new Footer({ children: [new Paragraph({ text: "" })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("BuildMetry-UserManual.docx", buf);
  console.log("✅  BuildMetry-UserManual.docx created successfully.");
  const kb = Math.round(buf.length / 1024);
  console.log(`    File size: ${kb} KB`);
}).catch(err => {
  console.error("❌  Error generating manual:", err.message);
  process.exit(1);
});
