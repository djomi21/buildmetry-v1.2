---
name: buildmetry-dev
description: "Skill for developing and maintaining the BuildMetry construction business management app. Use this skill whenever the user asks to modify, add features to, fix bugs in, or extend BuildMetry — a single-file React JSX app (~4900 lines) with a Node.js/Express/Prisma backend deployed on Vercel+Supabase+Render or Dokploy+Hostinger. Trigger this skill for any mention of BuildMetry, ContractorOS, estimates, invoices, projects, change orders, crew, materials, labor roles, job costing, or any construction business software feature. Also trigger when the user references App.jsx, api.js, schema.prisma, or any backend route files. Even if the user just says 'add a button' or 'fix the save' — if the context is BuildMetry, use this skill."
---

# BuildMetry App Development Skill

## Architecture Overview

BuildMetry is a construction business OS. Single-file React frontend + Express/Prisma backend + PostgreSQL.

### Stack
- **Frontend**: Single `App.jsx` file (~4900 lines), React + Vite, deployed on Vercel
- **Backend**: Express + Prisma ORM, deployed on Render
- **Database**: PostgreSQL on Supabase
- **Alt deploy**: Dokploy + Hostinger VPS (Docker Compose)

### File Map
```
frontend/src/
  App.jsx          — ALL components, styles, seed data, icons (single file)
  api.js           — JWT auth + CRUD API client
  main.jsx         — React entry point

backend/src/
  server.js        — Express app, route registration
  middleware/auth.js — JWT authentication middleware
  routes/           — One file per resource (16 routes)
  prisma/schema.prisma — Database models (15 models)
```

---

## CRITICAL RULES

### 1. Single-File Architecture
Everything lives in `App.jsx`. Components, CSS, icons, seed data, helpers — all in one file. Never split into separate files. New components go in the same file.

### 2. Working File Location
Always work on `/home/claude/ContractorOS.jsx`. Copy to `/mnt/user-data/outputs/App.jsx` when delivering.

### 3. Find Before Edit
Always `grep` or `view` to find the exact code before using `str_replace`. Never guess line content.

### 4. Validate After Edit
After edits, check brace/bracket balance:
```python
python3 -c "
code = open('/home/claude/ContractorOS.jsx').read()
print('{ =', code.count('{'), '} =', code.count('}'), 'diff =', code.count('{') - code.count('}'))
print('[ =', code.count('['), '] =', code.count(']'), 'diff =', code.count('[') - code.count(']'))
"
```

### 5. Delivery Pattern
```bash
cp /home/claude/ContractorOS.jsx /mnt/user-data/outputs/App.jsx
# Then use present_files tool
```

---

## COMPONENT PATTERN

Every module follows the same structure:

```jsx
function ModuleName({data,setData,showToast,db,...otherProps}) {
  const [sel, setSel] = useState(data[0]?.id||null);
  const [form, setForm] = useState(null);
  const se = data.find(e=>e.id===sel)||null;  // selected item

  const blank = {field1:"",field2:"",...};
  const openNew = () => setForm({...blank,_id:null});
  const openEdit = (item) => setForm({...item,_id:item.id});

  const save = () => {
    if(!form.field1.trim()){showToast("Required","error");return;}
    const data = {...form};
    if(form._id) {
      var ch={...data};delete ch._id;
      db.resource.update(form._id, ch);
      showToast("Updated");
    } else {
      db.resource.create({...data,id:uid()});
      showToast("Created");
    }
    setForm(null);
  };

  const del = (id) => {
    db.resource.remove(id);
    if(sel===id) setSel(null);
    showToast("Deleted");
  };

  return (
    <div className="spl">           {/* Split panel layout */}
      <div className="spl-l">       {/* Left list */}
        {/* Header with count + Add button */}
        {/* Scrollable list of items */}
      </div>

      {se ? (
        <div className="spl-r">     {/* Right detail */}
          {/* Header with name, status chip, action buttons */}
          {/* KPI cards row */}
          {/* Detail content */}
        </div>
      ) : (
        <div>Select an item</div>   {/* Empty state */}
      )}

      {form && (
        <div className="ov">        {/* Modal overlay */}
          <div className="mo">      {/* Modal box */}
            {/* Form fields */}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## STATE MANAGEMENT

### Main App State
All data lives in the main `App` component and is passed via the `sh` (shared) object:

```jsx
const sh = {
  custs,setCusts,ests,setEsts,projs,setProjs,mats,setMats,
  subs,setSubs,roles,setRoles,hrs,setHrs,invs,setInvs,
  cos,setCos,expenses,setExpenses,tasks,setTasks,phases,setPhases,
  company,setCompany,users,setUsers,auth,setAuth:handleAuth,
  updateAuth,showToast,setTab,handleLogout,db
};

// Components receive via spread: <ModuleName {...sh}/>
// Destructure only what's needed: function ModuleName({custs,showToast,db})
```

### The `db` Helper (Optimistic Updates + API Sync)
```jsx
const makeDb = (rawSet, apiRes) => ({
  create: (item) => {
    rawSet(prev => [item, ...prev]);              // Instant UI update
    apiRes.create(strip(item)).then(r => {         // Background API call
      if (r?.id && r.id !== item.id)
        rawSet(prev => prev.map(x => x.id === item.id ? {...x, id: r.id} : x));
    }).catch(e => console.error('DB CREATE FAIL:', e));
  },
  update: (id, changes) => {
    rawSet(prev => prev.map(e => e.id === id ? {...e,...changes} : e));
    apiRes.update(id, strip(changes)).catch(e => console.error('DB UPDATE FAIL:', e));
  },
  remove: (id) => {
    rawSet(prev => prev.filter(e => e.id !== id));
    apiRes.remove(id).catch(e => console.error('DB DELETE FAIL:', e));
  },
});

// Usage in components:
db.ests.create({id:uid(), name:"...", ...});
db.ests.update("EST-2026-001", {status:"approved"});
db.ests.remove("EST-2026-001");
```

### ID Convention
- Estimates: `EST-2026-001` (string, via `nxtNum(ests,"EST")`)
- Projects: `PRJ-2026-001`
- Invoices: `INV-2026-001`
- Change Orders: `CO-2026-001`
- Tasks: `T-` + `uid()` (random)
- Other entities: auto-increment integers from database

---

## CSS CONVENTIONS

All CSS is in a template literal at the top of App.jsx inside `<style>`.

### Class Names
| Class | Purpose |
|-------|---------|
| `.spl` | Split panel (grid: 300px 1fr) |
| `.spl-l` | Left list panel |
| `.spl-r` | Right detail panel |
| `.ov` | Modal overlay (fixed, backdrop blur) |
| `.mo` | Modal box |
| `.inp` | Input fields (dark theme) |
| `.lbl` | Form labels |
| `.bb` | Base button |
| `.b-bl` | Blue button (primary, uses --accent) |
| `.b-gr` | Green button (approve/success) |
| `.b-am` | Amber button (warning/send) |
| `.b-gh` | Ghost button (outline) |
| `.b-rd` | Red button (delete/danger) |
| `.g2/.g3/.g4` | Grid layouts (2/3/4 columns) |
| `.mn` | Monospace font (JetBrains Mono) |
| `.rh` | Row hover effect |
| `.act-bar` | Action button bar (responsive wrap) |
| `.stl` | Section title label |
| `.sub-tabs` | Sub-tab navigation (Company Setup) |

### Theme System
Accent color via CSS variables set from `company.themeAccent`:
```
--accent, --accent-dark, --accent-light, --accent-r, --accent-g, --accent-b
```

### Responsive Breakpoints
```
1024px — g4 → 2 columns
768px  — g2/g3 → 1 column, split panel stacks, modals fullscreen
480px  — g4 → 1 column, smaller buttons
```

---

## CALCULATION RULES

```
Subtotal = sum(qty × unitPrice)
Labor    = items where isMaterial = false
Materials = items where isMaterial = true
Discount applies to subtotal
Tax applies ONLY to discounted materials
Deposit = percent of total OR flat amount
Balance Due = Total - Deposit
Default tax rate = 6.5%
```

The `calcInv()` function handles all this:
```jsx
calcInv(lineItems, taxRate, discountPct, depositType, depositValue)
// Returns: {sub, lab, mat, discountPct, discAmt, discSub, tax, total, depAmt, balanceDue}
```

---

## BUSINESS WORKFLOW

```
Estimate (approved) → Project (auto-created)
                          ↓
                    Change Orders → update project budget
                          ↓
                    Mark Complete → Invoice (auto-created)
                                    ├── Estimate lines (section:"estimate")
                                    └── CO lines (section:"changeorder")
```

---

## ADDING A NEW FEATURE — CHECKLIST

### Frontend Only (UI change)
1. `grep` to find the relevant code
2. `view` the section
3. `str_replace` to make the change
4. Validate braces
5. Copy to outputs + `present_files`

### New Data Field (existing model)
1. Add field to seed data constant (`SD_*`)
2. Add to component `blank` object
3. Add to form UI
4. Add to detail view
5. Add to `save()` function data object
6. Add to Prisma schema
7. Create SQL migration
8. If needed, add to backend route's allowed fields

### New Module (full CRUD)
1. Add seed data (`SD_NEWMODULE`)
2. Add state: `const [items, setItems] = useState([])`
3. Add to `sh` object
4. Add `db.items: makeDb(setItems, api.newmodule)`
5. Add to API loading Promise.all
6. Add nav tab: `{id:"newmod",label:"New Module",icon:"..."}`
7. Add component rendering: `{tab==="newmod" && <NewModule {...sh}/>}`
8. Write the component following the component pattern
9. Create `backend/src/routes/newmodule.js`
10. Register in `server.js`
11. Add to `api.js`
12. Add Prisma model + SQL migration

### Role-Based Access
```jsx
const canDoThing = auth && ["Owner","Admin","Project Manager"].includes(auth.role);
// Then conditionally render: {canDoThing && <button>...</button>}
```

---

## BACKEND ROUTE PATTERN

Every route file follows this structure:
```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.modelName.findMany({
      where: { companyId: req.companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, companyId: req.companyId };
    if (typeof data.id === 'number') delete data.id; // Keep string IDs
    // Validate FK references — set to null if not found
    const item = await prisma.modelName.create({ data });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const allowed = ['field1','field2',...]; // Allowlist
    const data = {};
    allowed.forEach(f => { if(req.body[f] !== undefined) data[f] = req.body[f]; });
    const item = await prisma.modelName.update({ where:{id:req.params.id}, data });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.modelName.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

Register in server.js:
```javascript
app.use('/api/newmodule', loadRoute('./routes/newmodule', 'newmodule'));
```

---

## API CLIENT PATTERN (api.js)

```javascript
newmodule: {
  list:   ()       => request('GET',    '/newmodule'),
  create: (data)   => request('POST',   '/newmodule', data),
  update: (id, d)  => request('PUT',    `/newmodule/${id}`, d),
  remove: (id)     => request('DELETE', `/newmodule/${id}`),
},
```

---

## PRISMA MODEL PATTERN

```prisma
model NewModule {
  id          String/Int  @id [@default(autoincrement())]
  companyId   Int
  company     Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // ... fields
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([companyId])
}
```
Don't forget to add the relation array to the Company model.

---

## SQL MIGRATION PATTERN

```sql
CREATE TABLE IF NOT EXISTS "NewModule" (
  "id" TEXT PRIMARY KEY,
  "companyId" INTEGER NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  -- fields
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "NewModule_companyId_idx" ON "NewModule"("companyId");
```

For adding columns to existing tables:
```sql
ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "fieldName" TYPE DEFAULT value;
```

---

## COMMON PITFALLS

1. **Prisma rejects unknown fields** — if you add a field to the frontend but not the schema, saves will fail silently (500 error). Always add the column to Prisma + run SQL migration.

2. **String IDs must be preserved** — the `makeDb.create` strips numeric IDs but keeps strings like `EST-2026-001`. If the backend deletes the `id` from POST body, the record gets a random ID and the frontend loses reference.

3. **FK validation** — POST routes should check if referenced records exist and set to `null` if not, rather than letting Prisma throw a foreign key error.

4. **`setAuth` vs `updateAuth`** — `setAuth` (actually `handleAuth`) triggers a full data reload. `updateAuth` just updates auth state. Use `updateAuth` for profile changes to avoid loading screen flash.

5. **CSS in template literal** — all styles are in a JS template literal string. Use `\` to escape backticks if needed. No separate CSS files.

6. **calcInv must be called with all params** — if you add deposit to an entity, pass `depositType` and `depositValue` to `calcInv` or the deposit won't calculate.

7. **Line items have section tags** — invoice line items from estimates get `section:"estimate"`, from change orders get `section:"changeorder"`. This controls the separated display in invoice detail.

---

## CURRENT MODELS (15)

Company, User, Customer, Estimate, Project, Invoice, Material, Subcontractor, TimeEntry, LaborRole, ChangeOrder, Expense, EmailLog, Task, ProjectPhase

## CURRENT ROLES (8)

Owner, Admin, Project Manager, Estimator, Foreman, Bookkeeper, Field Tech, Read Only

## CURRENT PHASES (10)

Planning, Design, Permitting, Demolition, Site Prep, Rough-In, Installations, Finishes, Closeout & Punch List, Completed
