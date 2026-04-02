import { useState, useEffect, useCallback } from 'react';
import api, { getToken } from '../api';
import {
  SD_CUSTS, SD_ESTS, SD_PROJS, SD_MATS, SD_SUBS, SD_ROLES,
  SD_HRS, SD_INVS, SD_COS, SD_EXPENSES, SD_TASKS, SD_USERS,
  SD_COMPANY, SD_PHASES,
} from '../constants';

// Strips internal/relational fields before sending to API
const strip = (obj) => {
  const c = {...obj};
  delete c._id; delete c.createdAt; delete c.updatedAt; delete c.company; delete c.customer;
  delete c.project; delete c.estimate; delete c.sub; delete c.timeEntries;
  delete c.invoices; delete c.estimates; delete c.projects; delete c.changeOrders; delete c.expenses;
  return c;
};

// Optimistic CRUD factory: updates React state immediately, syncs to API in background
const makeDb = (rawSet, apiRes) => ({
  create: (item) => {
    rawSet(prev => [item, ...prev]);
    const payload = strip(item);
    const localId = item.id;
    if (typeof payload.id === 'number') delete payload.id;
    apiRes.create(payload).then(r => {
      if (r?.id && r.id !== localId) {
        rawSet(prev => prev.map(x => x.id === localId ? {...x, id: r.id} : x));
      }
    }).catch(() => {});
  },
  update: (id, changes) => {
    rawSet(prev => prev.map(x => x.id === id ? {...x, ...changes} : x));
    const payload = strip(changes);
    delete payload.id;
    apiRes.update(id, payload).catch(() => {});
  },
  remove: (id) => {
    rawSet(prev => prev.filter(x => x.id !== id));
    apiRes.remove(id).catch(() => {});
  },
});

// useAppData — loads all app data when auth is present, falls back to seed data
export const useAppData = (auth) => {
  const [custs,    setCusts]    = useState([]);
  const [ests,     setEsts]     = useState([]);
  const [projs,    setProjs]    = useState([]);
  const [mats,     setMats]     = useState([]);
  const [subs,     setSubs]     = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [hrs,      setHrs]      = useState([]);
  const [invs,     setInvs]     = useState([]);
  const [cos,      setCos]      = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [phases,   setPhases]   = useState(SD_PHASES);
  const [company,  setCompany]  = useState({name:"",defaultTaxRate:6.5,paymentTerms:30,laborBurdenDefault:28.3});
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  const loadAll = useCallback(async () => {
    const token = getToken();
    if (!token || !auth) { setLoading(false); return; }

    setLoading(true);
    try {
      const user = await api.getMe();
      // Auth update is handled by App.jsx — we just load data here

      const [c,e,p,m,s,r,h,i,co,ex,tk,ph,comp,u] = await Promise.all([
        api.customers.list().catch(()=>[]),
        api.estimates.list().catch(()=>[]),
        api.projects.list().catch(()=>[]),
        api.materials.list().catch(()=>[]),
        api.subcontractors.list().catch(()=>[]),
        api.laborRoles.list().catch(()=>[]),
        api.timeEntries.list().catch(()=>[]),
        api.invoices.list().catch(()=>[]),
        api.changeOrders.list().catch(()=>[]),
        api.expenses.list().catch(()=>[]),
        api.tasks.list().catch(()=>[]),
        api.phases.list().catch(()=>[]),
        api.company.get().catch(()=>({})),
        api.users.list().catch(()=>[]),
      ]);

      setCusts(c); setEsts(e); setProjs(p); setMats(m);
      setSubs(s); setRoles(r); setHrs(h); setInvs(i);
      setCos(co); setExpenses(ex); setTasks(tk); setUsers(u);
      if (ph?.length > 0) setPhases(ph.map(x => x.name));
      if (comp?.id) setCompany(comp);
    } catch {
      // API unreachable — use seed data for demo/offline mode
      setCusts(SD_CUSTS); setEsts(SD_ESTS); setProjs(SD_PROJS); setMats(SD_MATS);
      setSubs(SD_SUBS); setRoles(SD_ROLES); setHrs(SD_HRS); setInvs(SD_INVS);
      setCos(SD_COS); setExpenses(SD_EXPENSES); setTasks(SD_TASKS); setUsers(SD_USERS);
      setCompany(SD_COMPANY);
    } finally {
      setLoading(false);
    }
  }, [auth?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Optimistic DB helpers — one per resource
  const db = {
    custs:    makeDb(setCusts,    api.customers),
    ests:     makeDb(setEsts,     api.estimates),
    projs:    makeDb(setProjs,    api.projects),
    mats:     makeDb(setMats,     api.materials),
    subs:     makeDb(setSubs,     api.subcontractors),
    roles:    makeDb(setRoles,    api.laborRoles),
    hrs:      makeDb(setHrs,      api.timeEntries),
    invs:     makeDb(setInvs,     api.invoices),
    cos:      makeDb(setCos,      api.changeOrders),
    expenses: makeDb(setExpenses, api.expenses),
    tasks:    makeDb(setTasks,    api.tasks),
    users:    makeDb(setUsers,    api.users),
  };

  const reset = useCallback(() => {
    setCusts([]); setEsts([]); setProjs([]); setMats([]);
    setSubs([]); setRoles([]); setHrs([]); setInvs([]);
    setCos([]); setExpenses([]); setUsers([]); setLoading(true);
  }, []);

  return {
    // Data
    custs, setCusts,
    ests,  setEsts,
    projs, setProjs,
    mats,  setMats,
    subs,  setSubs,
    roles, setRoles,
    hrs,   setHrs,
    invs,  setInvs,
    cos,   setCos,
    expenses, setExpenses,
    tasks, setTasks,
    phases, setPhases,
    company, setCompany,
    users, setUsers,
    // Meta
    loading,
    // Helpers
    db,
    reset,
    reload: loadAll,
  };
};
