import { useState, useCallback, useEffect, useRef } from "react";
import api, { getSavedUser, saveUser } from "./api";
import { CSS, FONT_URL, USER_ROLE_C } from "./constants";
import { calcInv, fmt } from "./utils/calculations";
import { useAppData } from "./hooks/useAppData";
import { I } from "./components/shared/Icons";
import { ini } from "./components/shared/ui";

// ── VIEWS ──────────────────────────────────────────────────────
import LoginPage            from "./components/LoginPage";
import ForceChangePassword  from "./components/ForceChangePassword";
import Dashboard            from "./components/Dashboard";
import Customers            from "./components/Customers";
import Estimates            from "./components/Estimates";
import Projects             from "./components/Projects";
import JobCosting           from "./components/JobCosting";
import ChangeOrders         from "./components/ChangeOrders";
import Expenses             from "./components/Expenses";
import Materials            from "./components/Materials";
import Subs                 from "./components/Subs";
import Invoices             from "./components/Invoices";
import Reports              from "./components/Reports";
import CompanySetup         from "./components/CompanySetup";
import UserProfile          from "./components/UserProfile";

// ── NAV CONFIG ─────────────────────────────────────────────────
const NAV = [
  {id:"dashboard", label:"Dashboard",    icon:"dashboard"},
  {id:"customers", label:"Customers",    icon:"customers"},
  {id:"estimates", label:"Estimates",    icon:"estimates"},
  {id:"projects",  label:"Projects",     icon:"projects"},
  {id:"costing",   label:"Job Costing",  icon:"costing"},
  {id:"cos",       label:"Change Orders",icon:"changeorder"},
  {id:"expenses",  label:"Expenses",     icon:"expense"},
  {id:"materials", label:"Materials",    icon:"materials"},
  {id:"subs",      label:"Crew",         icon:"employees"},
  {id:"invoices",  label:"Invoices",     icon:"invoices"},
  {id:"reports",   label:"Reports",      icon:"reports"},
  {id:"company",   label:"Company Setup",icon:"settings"},
];

export default function App() {
  // ── Auth state ─────────────────────────────────────────────
  const [auth, setAuthRaw] = useState(() => getSavedUser());

  const setAuth = useCallback((user) => {
    saveUser(user);
    setAuthRaw(user);
  }, []);

  const updateAuth = useCallback((user) => {
    saveUser(user);
    setAuthRaw(user);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('buildmetry_tab');
    window.history.replaceState(null, '', '#dashboard');
    api.logout();
    setAuthRaw(null);
    reset();
  }, []);

  const handleAuth = useCallback((user) => {
    setAuth(user);
  }, [setAuth]);

  // ── Data (via hook) ────────────────────────────────────────
  const appData = useAppData(auth);
  const { reset, loading } = appData;

  // ── Tab / routing (hash-based) ─────────────────────────────
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return localStorage.getItem('buildmetry_tab') || 'dashboard';
  };
  const [tab, setTabRaw] = useState(getInitialTab);

  const setTab = useCallback((newTab) => {
    setTabRaw(prev => {
      if (prev !== newTab) window.history.pushState({tab: newTab}, '', `#${newTab}`);
      localStorage.setItem('buildmetry_tab', newTab);
      return newTab;
    });
  }, []);

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState({tab}, '', `#${tab}`);
    const onPop = (e) => {
      const newTab = e.state?.tab || window.location.hash.replace('#', '') || 'dashboard';
      setTabRaw(newTab);
      localStorage.setItem('buildmetry_tab', newTab);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── Load fonts ─────────────────────────────────────────────
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
  }, []);

  // ── Theme accent color ─────────────────────────────────────
  useEffect(() => {
    const accent = appData.company.themeAccent || '#3b82f6';
    const hex = accent.replace('#', '');
    let r=59, g=130, b=246;
    if (hex.length === 6) {
      r = parseInt(hex.substring(0,2),16);
      g = parseInt(hex.substring(2,4),16);
      b = parseInt(hex.substring(4,6),16);
    }
    const dark  = '#'+[r,g,b].map(c=>Math.max(0,Math.floor(c*.7)).toString(16).padStart(2,'0')).join('');
    const light = '#'+[r,g,b].map(c=>Math.min(255,Math.floor(c*1.3)).toString(16).padStart(2,'0')).join('');
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-dark', dark);
    root.style.setProperty('--accent-light', light);
    root.style.setProperty('--accent-r', String(r));
    root.style.setProperty('--accent-g', String(g));
    root.style.setProperty('--accent-b', String(b));
  }, [appData.company.themeAccent]);

  // ── Theme mode (dark / light / system) ────────────────────
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('bm_theme')||'dark');
  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode) => {
      if (mode === 'system') {
        root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', mode);
      }
    };
    apply(themeMode);
    localStorage.setItem('bm_theme', themeMode);
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => apply('system');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [themeMode]);

  // ── Toast notifications ────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, type="success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({msg, type});
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Sidebar state ──────────────────────────────────────────
  const [sOpen, setSOpen] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  // ── Overdue alerts ─────────────────────────────────────────
  const overdue = appData.invs.filter(i => i.status === "overdue");
  const overdueAmt = overdue.reduce((s,i) => s + calcInv(i.lineItems, i.taxRate, i.discount||0).total, 0);

  // ── Shared props bundle (passed down to all views) ─────────
  const sh = {
    ...appData,
    auth,
    setAuth: handleAuth,
    updateAuth,
    showToast,
    setTab,
    handleLogout,
  };

  // ── Loading screen ─────────────────────────────────────────
  if (loading && auth) return (
    <div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",background:"var(--bg)",color:"var(--text)",flexDirection:"column",gap:16}}>
      <style>{CSS}</style>
      <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,var(--accent),var(--accent-dark))",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="wrench" s={20}/></div>
      <div style={{fontSize:14,fontWeight:700}}>Loading BuildMetry…</div>
      <div style={{width:120,height:4,borderRadius:2,background:"var(--border)",overflow:"hidden"}}><div style={{width:"60%",height:"100%",borderRadius:2,background:"var(--accent)",animation:"pulse 1.5s ease-in-out infinite"}}/></div>
    </div>
  );

  // ── Auth gates ─────────────────────────────────────────────
  if (!auth) return <LoginPage users={appData.users} onLogin={handleAuth} />;
  if (auth.mustChangePassword) return (
    <ForceChangePassword auth={auth} setAuth={handleAuth} showToast={showToast} handleLogout={handleLogout}/>
  );

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",background:"var(--bg)",color:"var(--text)",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* MOBILE NAV OVERLAY */}
      {mobileNav && <div className="mob-drawer-overlay" onClick={() => setMobileNav(false)}/>}

      {/* SIDEBAR */}
      <aside style={{
        width: mobileNav ? 260 : (sOpen ? 234 : 56),
        background:"var(--bg-sidebar)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0,transition:"all .26s ease",overflow:"hidden",zIndex:mobileNav?100:10,
        ...(typeof window!=="undefined" && window.innerWidth<=768 ? {position:"fixed",top:0,bottom:0,left:mobileNav?0:-270,boxShadow:mobileNav?"8px 0 40px rgba(0,0,0,.6)":"none"} : {})
      }}>
        <div style={{padding:"18px 12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {appData.company.logo
            ? <img src={appData.company.logo} alt="Logo" style={{width:32,height:32,borderRadius:8,objectFit:"contain",flexShrink:0}}/>
            : <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#1e40af)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="wrench" s={15}/></div>
          }
          {(sOpen||mobileNav) && (
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:"var(--text-2)",lineHeight:1}}>{appData.company.name||"BuildMetry"}</div>
              <div style={{fontSize:8,color:"var(--text-ghost)",fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",marginTop:2}}>v1.0</div>
            </div>
          )}
          {mobileNav && <button onClick={() => setMobileNav(false)} style={{color:"var(--text-dim)",padding:4}}><I n="x" s={16}/></button>}
        </div>

        <nav style={{flex:1,padding:"8px 5px",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
          {NAV.map(n => (
            <button key={n.id} className={`nb ${tab===n.id?"on":""}`} onClick={() => {setTab(n.id); setMobileNav(false);}}>
              <I n={n.icon} s={16}/>
              {(sOpen||mobileNav) && <span>{n.label}</span>}
              {n.id==="invoices" && overdue.length>0 && (
                <span style={{marginLeft:"auto",background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:800,flexShrink:0}}>{overdue.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer — theme + user */}
        <div style={{padding:"10px 7px",borderTop:"1px solid var(--border)",display:"flex",flexDirection:"column",gap:6}}>
          {(sOpen||mobileNav) ? (
            <div style={{display:"flex",alignItems:"center",gap:3,background:"var(--bg-card)",borderRadius:8,padding:3,border:"1px solid var(--border)"}}>
              {[{m:"light",icon:"sun",title:"Light"},{m:"dark",icon:"moon",title:"Dark"},{m:"system",icon:"monitor",title:"System"}].map(({m,icon,title}) => (
                <button key={m} onClick={() => setThemeMode(m)} title={title} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"5px 4px",borderRadius:6,fontSize:9,fontWeight:700,transition:"all .15s",background:themeMode===m?"var(--bg-sidebar)":"transparent",color:themeMode===m?"var(--accent-light)":"var(--text-dim)",border:themeMode===m?"1px solid var(--border-2)":"1px solid transparent"}}>
                  <I n={icon} s={11}/>{title}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setThemeMode(m => m==='dark'?'light':m==='light'?'system':'dark')} title={`Theme: ${themeMode}`} style={{color:"var(--text-dim)",padding:7,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,transition:"all .15s",width:"100%"}}>
              <I n={themeMode==='light'?'sun':themeMode==='system'?'monitor':'moon'} s={15}/>
            </button>
          )}

          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={() => {setTab("profile"); setMobileNav(false);}} style={{flex:1,display:"flex",alignItems:"center",gap:8,overflow:"hidden",padding:0,borderRadius:6,transition:"all .15s",cursor:"pointer"}} title="View Profile">
              {(sOpen||mobileNav) ? (
                <>
                  <div style={{width:28,height:28,borderRadius:"50%",background:auth.avatar?`url(${auth.avatar}) center/cover`:`linear-gradient(135deg,${USER_ROLE_C[auth.role]||"var(--accent)"},${USER_ROLE_C[auth.role]||"var(--accent)"}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0}}>{!auth.avatar&&ini(auth.name)}</div>
                  <div style={{overflow:"hidden",textAlign:"left"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text-2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{auth.name}</div>
                    <div style={{fontSize:9,color:"var(--text-faint)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{auth.role}</div>
                  </div>
                </>
              ) : (
                <div style={{width:28,height:28,borderRadius:"50%",background:auth.avatar?`url(${auth.avatar}) center/cover`:`linear-gradient(135deg,${USER_ROLE_C[auth.role]||"var(--accent)"},${USER_ROLE_C[auth.role]||"var(--accent)"}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0,margin:"0 auto"}}>{!auth.avatar&&ini(auth.name)}</div>
              )}
            </button>
            <button onClick={handleLogout} title="Sign Out" style={{color:"var(--text-dim)",padding:7,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,transition:"all .15s",flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";}} onMouseLeave={e=>{e.currentTarget.style.color="var(--text-dim)";}}>
              <I n="arrow" s={15}/>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <header style={{height:52,borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 14px 0 12px",justifyContent:"space-between",background:"var(--bg)",flexShrink:0,gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0,flex:1}}>
            <button className="mob-only" onClick={() => setMobileNav(true)} style={{color:"var(--text-muted)",padding:4,flexShrink:0}}><I n="menu" s={20}/></button>
            <button className="desk-only" onClick={() => setSOpen(o=>!o)} style={{color:"var(--text-dim)",padding:4,flexShrink:0,display:"flex"}}><I n="menu" s={16}/></button>
            <div style={{fontSize:17,fontWeight:800,letterSpacing:.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {tab==="profile" ? "My Profile" : NAV.find(n=>n.id===tab)?.label}
            </div>
          </div>
          <div style={{display:"flex",gap:9,alignItems:"center",flexShrink:0}}>
            {overdue.length>0 && (
              <div className="desk-flex" style={{alignItems:"center",gap:5,padding:"4px 11px",background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.22)",borderRadius:16,color:"#ef4444",fontSize:10,fontWeight:700}}>
                <I n="alert" s={11}/>{overdue.length} overdue · {fmt(overdueAmt)}
              </div>
            )}
            <button onClick={() => setTab("profile")} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"3px 0",borderRadius:8,transition:"all .15s",border:"none",background:"none",color:"inherit",fontFamily:"inherit"}}>
              <div className="desk-only" style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--text-2)"}}>{auth.name}</div>
                <div style={{fontSize:9,color:"var(--text-faint)"}}>{auth.role}</div>
              </div>
              <div style={{width:32,height:32,borderRadius:"50%",background:auth.avatar?`url(${auth.avatar}) center/cover`:`linear-gradient(135deg,${USER_ROLE_C[auth.role]||"var(--accent)"},${USER_ROLE_C[auth.role]||"var(--accent)"}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:"#fff",flexShrink:0}}>
                {!auth.avatar && ini(auth.name)}
              </div>
            </button>
          </div>
        </header>

        <main style={{flex:1,overflow:"auto",padding:"16px clamp(12px,3vw,20px)"}} className="fu" key={tab}>
          {tab==="dashboard" && <Dashboard {...sh}/>}
          {tab==="customers" && <Customers {...sh}/>}
          {tab==="estimates" && <Estimates {...sh}/>}
          {tab==="projects"  && <Projects  {...sh}/>}
          {tab==="costing"   && <JobCosting {...sh}/>}
          {tab==="cos"       && <ChangeOrders {...sh}/>}
          {tab==="expenses"  && <Expenses   {...sh}/>}
          {tab==="materials" && <Materials  {...sh}/>}
          {tab==="subs"      && <Subs       {...sh}/>}
          {tab==="invoices"  && <Invoices   {...sh}/>}
          {tab==="reports"   && <Reports    {...sh}/>}
          {tab==="company"   && <CompanySetup {...sh}/>}
          {tab==="profile"   && <UserProfile {...sh}/>}
        </main>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",bottom:20,right:20,zIndex:2000,background:toast.type==="success"?"#052e16":"#450a0a",border:`1px solid ${toast.type==="success"?"#22c55e":"#ef4444"}`,color:"#fff",padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:600,display:"flex",gap:7,alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,.5)",animation:"up .28s ease"}}>
          <I n={toast.type==="success"?"check":"alert"} s={14}/>{toast.msg}
        </div>
      )}
    </div>
  );
}
