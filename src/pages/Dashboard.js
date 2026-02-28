import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Kitting from './dashboard/Kitting';
import BoQOptimizer from './dashboard/BoQOptimizer';
import RepetitionPlanner from './dashboard/RepetitionPlanner';
import ScheduleDashboard from './dashboard/ScheduleDashboard';
import ScenarioSimulator from './dashboard/ScenarioSimulator';

function Dashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('overview');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kitiq_auth');
    navigate('/');
  };

  const navItems = [
    { id: 'overview', icon: '🏠', label: 'Dashboard' },
    { id: 'kitting', icon: '📋', label: 'Formwork Kitting' },
    { id: 'boq', icon: '📊', label: 'BoQ Optimizer' },
    { id: 'repetition', icon: '🔁', label: 'Repetition Planner' },
    { id: 'schedule', icon: '📅', label: 'Schedule & Inventory' },
    { id: 'scenario', icon: '🎯', label: 'Scenario Simulator' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'kitting': return <Kitting />;
      case 'boq': return <BoQOptimizer />;
      case 'repetition': return <RepetitionPlanner />;
      case 'schedule': return <ScheduleDashboard />;
      case 'scenario': return <ScenarioSimulator />;
      default: return <Overview setActivePage={setActivePage} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{
        width: '250px', backgroundColor: '#0d1117',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        borderRight: '1px solid #1e2a38', zIndex: 100,
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      }}>
        {/* LOGO */}
        <div style={{
          padding: '28px 24px 24px', borderBottom: '1px solid #1e2a38',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '900', color: '#0d1117', fontSize: '20px',
              boxShadow: '0 4px 12px rgba(45,212,191,0.3)',
            }}>K</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
                Kit<span style={{ color: '#2dd4bf' }}>IQ</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '-2px' }}>L&T CreaTech</div>
            </div>
          </div>
        </div>

        {/* NAV LABEL */}
        <div style={{ padding: '20px 24px 8px' }}>
          <div style={{ fontSize: '11px', color: '#334155', fontWeight: '700', letterSpacing: '1.5px' }}>MAIN MENU</div>
        </div>

        {/* NAV ITEMS */}
        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '13px 14px', borderRadius: '10px', border: 'none',
              backgroundColor: activePage === item.id ? 'rgba(45,212,191,0.12)' : 'transparent',
              color: activePage === item.id ? '#2dd4bf' : '#94a3b8',
              fontSize: '14px', fontWeight: activePage === item.id ? '700' : '500',
              cursor: 'pointer', marginBottom: '3px', textAlign: 'left',
              borderLeft: activePage === item.id ? '3px solid #2dd4bf' : '3px solid transparent',
              transition: 'all 0.2s',
              position: 'relative',
            }}
              onMouseEnter={e => { if (activePage !== item.id) { e.currentTarget.style.backgroundColor = '#1e2a38'; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={e => { if (activePage !== item.id) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
            >
              <span style={{ fontSize: '17px', width: '22px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && (
                <div style={{
                  position: 'absolute', right: '14px', width: '6px', height: '6px',
                  backgroundColor: '#2dd4bf', borderRadius: '50%',
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* USER + LOGOUT */}
        <div style={{ padding: '12px', borderTop: '1px solid #1e2a38' }}>
          <div style={{
            backgroundColor: '#161b22', borderRadius: '10px', padding: '12px 14px',
            marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', color: '#0d1117', fontSize: '14px', flexShrink: 0,
            }}>A</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Admin</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>admin@kitiq.in</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 14px', borderRadius: '10px', border: 'none',
            backgroundColor: 'transparent', color: '#ef4444',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2d1515'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: '250px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* TOP BAR */}
        <div style={{
          backgroundColor: '#ffffff', padding: '0 32px', height: '68px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 99,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                {navItems.find(n => n.id === activePage)?.label || 'Dashboard'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                L&T CreaTech — KitIQ Platform
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              backgroundColor: '#f8fafc', borderRadius: '8px', padding: '8px 14px',
              border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              🕐 {time.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} {time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
            </div>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0d1117', fontWeight: '800', fontSize: '16px',
              boxShadow: '0 2px 8px rgba(45,212,191,0.3)', cursor: 'pointer',
            }}>A</div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: '28px 32px', flex: 1 }}>
          <div key={activePage} className="page-animate">
            {renderPage()}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '14px 32px', borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff', textAlign: 'center',
          color: '#94a3b8', fontSize: '13px',
        }}>
          Developed by Team Titan
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW PAGE ───────────────────────────────────────────────
function Overview({ setActivePage }) {
  // ── Read real data from localStorage ──
  const savedInventory  = localStorage.getItem('kitiq_inventory');
  const savedProject    = localStorage.getItem('kitiq_last_project');
  const savedKitting    = localStorage.getItem('kitiq_kitting');
  const inventoryData   = savedInventory ? JSON.parse(savedInventory) : [];
  const projectData     = savedProject   ? JSON.parse(savedProject)   : null;
  const kittingData     = savedKitting   ? JSON.parse(savedKitting)   : null;
  const lastProject     = projectData;
  const lastKitting     = kittingData;

  // ── Dynamic stat calculations ──
  const totalComponents = inventoryData.length > 0 ? inventoryData.length : 14;
  const lowStockCount   = inventoryData.filter(c => c.status === 'Critical' || c.status === 'Low').length;
  const pendingOrders   = inventoryData.filter(c => c.status === 'Critical').length;
  const costSaved       = projectData ? `₹${(projectData.totalSaving / 100000).toFixed(1)}L` : '₹24.5L';

  const stats = [
    {
      label: 'Active Projects',
      value: '3',
      sub: kittingData ? `${kittingData.floors} floors tracked` : 'Out of 4 total',
      gradient: 'linear-gradient(135deg, #2dd4bf, #0891b2)', icon: '🏗️', light: false,
    },
    {
      label: 'Total Components',
      value: String(totalComponents),
      sub: lowStockCount > 0 ? `${lowStockCount} Low Stock ⚠️` : 'All stock levels OK ✅',
      bg: '#ffffff', icon: '📦', light: true, iconBg: '#fef3c7',
    },
    {
      label: 'Pending Orders',
      value: String(pendingOrders),
      sub: pendingOrders > 0 ? `${pendingOrders} Critical reorders` : 'No pending orders ✅',
      bg: '#ffffff', icon: '🛒', light: true, iconBg: '#fce7f3',
    },
    {
      label: 'Cost Saved',
      value: costSaved,
      sub: projectData ? `${projectData.savingPct}% saving · ${projectData.city}` : 'AI Optimization 🤖',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', icon: '💰', light: false,
    },
  ];

  const quickActions = [
    { icon: '📋', title: 'Formwork Kitting',      desc: 'Auto-generate kit lists per floor', id: 'kitting',    color: '#2dd4bf' },
    { icon: '📊', title: 'BoQ Optimizer',          desc: 'Minimize procurement costs',        id: 'boq',        color: '#818cf8' },
    { icon: '🔁', title: 'Repetition Planner',     desc: 'Maximize formwork reuse',           id: 'repetition', color: '#fb923c' },
    { icon: '📅', title: 'Schedule & Inventory',   desc: 'Track project timeline',            id: 'schedule',   color: '#4ade80' },
  ];

  const projects = [
    {
      name:     lastKitting ? `Active Project — Mumbai` : 'Residential Tower - Mumbai',
      status:   'In Progress',
      progress: lastKitting ? Math.min(Math.round((lastKitting.floors / 20) * 100), 95) : 65,
      cost:     lastProject ? `₹${(lastProject.totalOptimized / 100000).toFixed(2)}L` : '₹12.50 Cr',
      zone:     lastKitting ? `${lastKitting.floors} Floors · ${lastKitting.zones} Zones` : 'Maharashtra',
    },
    { name: 'Commercial Complex - Pune',  status: 'In Progress', progress: 42, cost: '₹8.90 Cr',  zone: 'Pune'        },
    { name: 'Industrial Shed - Nashik',   status: 'Planning',    progress: 15, cost: '₹6.70 Cr',  zone: 'Nashik'      },
    { name: 'Bridge Project - Nagpur',    status: 'In Progress', progress: 78, cost: '₹15.30 Cr', zone: 'Nagpur'      },
  ];

  const alerts = inventoryData.length > 0 ? inventoryData.map(c => ({
    name:    c.name,
    stock:   `${c.stock} Units`,
    status:  c.status,
    reorder: Math.round(c.total * 0.4),
  })) : [
    { name: 'Wall Panels (Type A)', stock: '52 Units',  status: 'Low',      reorder: 100  },
    { name: 'Prop Supports (3m)',   stock: '850 Units', status: 'Low',      reorder: 1000 },
    { name: 'Beam Clamps',          stock: '920 Units', status: 'Low',      reorder: 800  },
    { name: 'Slab Panels (Type B)', stock: '4 Units',   status: 'Critical', reorder: 50   },
    { name: 'Corner Pieces',        stock: '11 Units',  status: 'Critical', reorder: 8    },
    { name: 'Base Plates',          stock: '45 Units',  status: 'Good',     reorder: 50   },
    { name: 'Tie Rods',             stock: '38 Units',  status: 'Good',     reorder: 35   },
  ];

  return (
    <div>

      {/* WELCOME BANNER */}
      <div style={{
  background: 'linear-gradient(135deg, #0f2d1f 0%, #0d1117 100%)',
  borderRadius: '18px', padding: '24px 32px', marginBottom: '28px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  border: '1px solid #1e2a38',
}}>
  <div>
    <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', marginBottom: '6px' }}>
      Welcome back, Admin! 👋
    </div>
    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
      {kittingData
        ? `Active project: ${kittingData.floors} floors · ${kittingData.zones} zones · Last updated ${kittingData.timestamp}`
        : "Here's your formwork project overview for today"}
    </div>
  </div>
  <div style={{ display: 'flex', gap: '12px' }}>
    <div style={{
      backgroundColor: 'rgba(45,212,191,0.1)', borderRadius: '12px',
      padding: '12px 20px', textAlign: 'center', border: '1px solid rgba(45,212,191,0.2)',
    }}>
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#2dd4bf' }}>
        {projectData ? `₹${(projectData.totalSaving / 100000).toFixed(1)}L` : '₹24.5L'}
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Total Saved</div>
    </div>
    <div style={{
      backgroundColor: 'rgba(129,140,248,0.1)', borderRadius: '12px',
      padding: '12px 20px', textAlign: 'center', border: '1px solid rgba(129,140,248,0.2)',
    }}>
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#818cf8' }}>
        {projectData ? `${projectData.savingPct}%` : '96%'}
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>BoQ Accuracy</div>
    </div>
    <div style={{
      backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '12px',
      padding: '12px 20px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.2)',
    }}>
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80' }}>
        {inventoryData.length > 0
          ? `${Math.round(inventoryData.reduce((s, c) => s + (c.stock / c.total) * 100, 0) / inventoryData.length)}%`
          : '87%'}
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Reuse Rate</div>
    </div>
  </div>
</div>

      {/* ESG BANNER */}
{(() => {
  const savedESG = localStorage.getItem('kitiq_esg');
  const esg = savedESG ? JSON.parse(savedESG) : { co2Saved: 2840, timberSaved: 320, wasteReduced: 1240, carbonValue: 1420 };
  return (
    <div style={{
      background: 'linear-gradient(135deg, #052e16 0%, #0d1117 100%)',
      borderRadius: '16px', padding: '20px 28px', marginBottom: '24px',
      border: '1px solid #16a34a33', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ fontSize: '32px' }}>🌱</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80', marginBottom: '3px' }}>
            ESG Impact — Today's Sustainability Score
          </div>
          <div style={{ fontSize: '13px', color: '#86efac' }}>
            L&T Net Zero 2040 · Formwork reuse contributing to carbon reduction goals
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        {[
          ['🌿', `${esg.co2Saved} kg`,     'CO₂ Saved'],
          ['🪵', `${esg.timberSaved} kg`,   'Timber Saved'],
          ['♻️', `${esg.wasteReduced} kg`,  'Waste Reduced'],
          ['💚', `₹${esg.carbonValue}`,     'Carbon Credits'],
        ].map(([icon, val, label]) => (
          <div key={label} style={{
            backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: '12px',
            padding: '12px 16px', textAlign: 'center',
            border: '1px solid rgba(74,222,128,0.2)',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80' }}>{val}</div>
            <div style={{ fontSize: '11px', color: '#86efac', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
})()}

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '28px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.gradient || s.bg,
            borderRadius: '16px', padding: '22px 24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            border: s.light ? '1px solid #e2e8f0' : 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: s.light ? '#64748b' : 'rgba(255,255,255,0.75)', fontWeight: '500' }}>{s.label}</div>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: s.light ? (s.iconBg || '#f1f5f9') : 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '34px', fontWeight: '900', color: s.light ? '#0f172a' : '#ffffff', letterSpacing: '-1px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: s.light ? '#94a3b8' : 'rgba(255,255,255,0.6)', marginTop: '6px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '22px', background: 'linear-gradient(#2dd4bf, #0891b2)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Quick Actions</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {quickActions.map(a => (
            <button key={a.id} onClick={() => setActivePage(a.id)} style={{
              backgroundColor: '#ffffff', borderRadius: '14px', padding: '22px',
              border: `1px solid #e2e8f0`, cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px rgba(0,0,0,0.12)`; e.currentTarget.style.borderColor = a.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px', fontSize: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: `${a.color}18`, marginBottom: '14px',
              }}>{a.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '5px' }}>{a.title}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>{a.desc}</div>
              <div style={{ position: 'absolute', bottom: '18px', right: '18px', color: a.color, fontSize: '18px', fontWeight: '700' }}>→</div>
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM TWO COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ACTIVE PROJECTS */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '20px', background: 'linear-gradient(#2dd4bf, #0891b2)', borderRadius: '4px' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Active Projects</div>
            </div>
            <span style={{ color: '#2dd4bf', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>View All →</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {projects.map((p, i) => (
              <div key={p.name} style={{
                padding: '16px 24px',
                borderBottom: i < projects.length - 1 ? '1px solid #f8fafc' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{p.zone} · {p.cost}</div>
                  </div>
                  <span style={{
                    backgroundColor: p.status === 'Planning' ? '#fef3c7' : '#dcfce7',
                    color: p.status === 'Planning' ? '#d97706' : '#16a34a',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    whiteSpace: 'nowrap',
                  }}>{p.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #2dd4bf, #0891b2)',
                      width: `${p.progress}%`, height: '6px', borderRadius: '6px',
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', minWidth: '35px' }}>{p.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INVENTORY ALERTS */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '16px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '20px', background: 'linear-gradient(#ef4444, #f97316)', borderRadius: '4px' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Inventory Alerts</div>
            </div>
            <span style={{ color: '#2dd4bf', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>View All →</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {alerts.map((a, i) => {
              const statusStyles = {
                Critical: { bg: '#fef2f2', color: '#ef4444', dot: '#ef4444' },
                Low: { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
                Good: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
              };
              const ss = statusStyles[a.status];
              return (
                <div key={a.name} style={{
                  padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: i < alerts.length - 1 ? '1px solid #f8fafc' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ss.dot, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{a.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Stock: {a.stock}</div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: ss.bg, color: ss.color,
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                    whiteSpace: 'nowrap',
                  }}>{a.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;