require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ══════════════════════════════════════════════════════
// BIND PORT IMMEDIATELY
// ══════════════════════════════════════════════════════
const PORT = parseInt(process.env.PORT, 10) || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  BuildMetry v1.0 API');
  console.log('  Port: ' + PORT);
  console.log('  Env:  ' + (process.env.NODE_ENV || 'dev'));
  console.log('  Time: ' + new Date().toISOString());
  console.log('');
});

server.on('error', (err) => {
  console.error('SERVER FAILED TO START:', err.message);
  process.exit(1);
});

// ── CORS — wide open for now, lock down later ────────
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// ── HEALTH CHECK ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', port: PORT, timestamp: new Date().toISOString() });
});

// ── LOAD ROUTES SAFELY ───────────────────────────────
const loadRoute = (path, name) => {
  try { return require(path); }
  catch (e) {
    console.error('ROUTE LOAD FAIL [' + name + ']: ' + e.message);
    const r = express.Router();
    r.all('*', (req2, res2) => res2.status(503).json({ error: name + ' unavailable' }));
    return r;
  }
};

app.use('/api/auth',           loadRoute('./routes/auth', 'auth'));
app.use('/api/company',        loadRoute('./routes/company', 'company'));
app.use('/api/customers',      loadRoute('./routes/customers', 'customers'));
app.use('/api/estimates',      loadRoute('./routes/estimates', 'estimates'));
app.use('/api/projects',       loadRoute('./routes/projects', 'projects'));
app.use('/api/invoices',       loadRoute('./routes/invoices', 'invoices'));
app.use('/api/materials',      loadRoute('./routes/materials', 'materials'));
app.use('/api/subcontractors', loadRoute('./routes/subcontractors', 'subcontractors'));
app.use('/api/labor-roles',    loadRoute('./routes/laborRoles', 'laborRoles'));
app.use('/api/time-entries',   loadRoute('./routes/timeEntries', 'timeEntries'));
app.use('/api/change-orders',  loadRoute('./routes/changeOrders', 'changeOrders'));
app.use('/api/expenses',       loadRoute('./routes/expenses', 'expenses'));
app.use('/api/tasks',          loadRoute('./routes/tasks', 'tasks'));
app.use('/api/phases',         loadRoute('./routes/phases', 'phases'));
app.use('/api/email',          loadRoute('./routes/email', 'email'));
app.use('/api/users',          loadRoute('./routes/users', 'users'));

// ── ERROR HANDLER ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

process.on('unhandledRejection', (e) => console.error('Unhandled:', e));
process.on('uncaughtException', (e) => console.error('Uncaught:', e));
