// ─────────────────────────────────────────────────────
// BuildMetry v1.0 — API Client
// Handles JWT auth, token persistence, and all CRUD ops
// ─────────────────────────────────────────────────────

// In production: VITE_API_URL = "https://your-backend.onrender.com/api"
// In development: falls back to "/api" (proxied by Vite to localhost:4000)
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

// ── Token Management ─────────────────────────────────
let _token = null;

export const getToken = () => {
  if (_token) return _token;
  try { _token = localStorage.getItem('bm_token'); } catch(e) {}
  return _token;
};

export const setToken = (token) => {
  _token = token;
  try { if (token) localStorage.setItem('bm_token', token); else localStorage.removeItem('bm_token'); } catch(e) {}
};

export const clearAuth = () => {
  _token = null;
  try { localStorage.removeItem('bm_token'); localStorage.removeItem('bm_user'); } catch(e) {}
};

export const getSavedUser = () => {
  try { const u = localStorage.getItem('bm_user'); return u ? JSON.parse(u) : null; } catch(e) { return null; }
};

export const saveUser = (user) => {
  try { if (user) localStorage.setItem('bm_user', JSON.stringify(user)); else localStorage.removeItem('bm_user'); } catch(e) {}
};

// ── Core Fetch Wrapper ───────────────────────────────
const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

// ── Auth ─────────────────────────────────────────────
export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request('POST', '/auth/login', { email, password });
    setToken(data.token);
    saveUser(data.user);
    return data.user;
  },

  // Signup disabled — users are added by admin via Company Setup
  signup: async () => { throw new Error('Public registration is disabled. Contact your administrator.'); },

  getMe: async () => {
    const user = await request('GET', '/auth/me');
    saveUser(user);
    return user;
  },

  changePassword: (currentPassword, newPassword) =>
    request('PUT', '/auth/password', { currentPassword, newPassword }),

  logout: () => { clearAuth(); },

  // ── Generic CRUD factory ───────────────────────────
  // Returns { list, get, create, update, remove } for a resource
  _crud: (resource) => ({
    list:   ()        => request('GET',    `/${resource}`),
    get:    (id)      => request('GET',    `/${resource}/${id}`),
    create: (data)    => request('POST',   `/${resource}`, data),
    update: (id,data) => request('PUT',    `/${resource}/${id}`, data),
    remove: (id)      => request('DELETE', `/${resource}/${id}`),
  }),

  // ── Resource endpoints ─────────────────────────────
  get customers()      { return this._crud('customers'); },
  get estimates()      { return this._crud('estimates'); },
  get projects()       { return this._crud('projects'); },
  get invoices()       { return this._crud('invoices'); },
  get materials()      { return this._crud('materials'); },
  get subcontractors() { return this._crud('subcontractors'); },
  get laborRoles()     { return this._crud('labor-roles'); },
  get timeEntries()    { return this._crud('time-entries'); },
  get changeOrders()   { return this._crud('change-orders'); },
  get expenses()       { return this._crud('expenses'); },
  get users()          { return this._crud('users'); },

  // ── Company (single resource) ──────────────────────
  company: {
    get:    ()     => request('GET',  '/company'),
    update: (data) => request('PUT',  '/company', data),
  },

  // ── Email ──────────────────────────────────────────
  email: {
    send: (data)  => request('POST', '/email/send', data),
    test: ()      => request('POST', '/email/test'),
    log:  ()      => request('GET',  '/email/log'),
  },

  // ── Tasks ──────────────────────────────────────────
  tasks: {
    list:   ()       => request('GET',    '/tasks'),
    create: (data)   => request('POST',   '/tasks', data),
    update: (id, d)  => request('PUT',    `/tasks/${id}`, d),
    remove: (id)     => request('DELETE', `/tasks/${id}`),
  },

  // ── Phases ─────────────────────────────────────────
  phases: {
    list:    ()       => request('GET',    '/phases'),
    create:  (data)   => request('POST',   '/phases', data),
    update:  (id, d)  => request('PUT',    `/phases/${id}`, d),
    remove:  (id)     => request('DELETE', `/phases/${id}`),
    reorder: (phases) => request('PUT',    '/phases/reorder/bulk', { phases }),
  },
};

export default api;
