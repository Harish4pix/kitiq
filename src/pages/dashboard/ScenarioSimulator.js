import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── LP OPTIMIZER (same logic as BoQ) ────────────────────────────
function lpOptimize(qty, floors, buyPrice, rentPrice, lifeUses) {
  const totalDemand  = qty * floors;
  const reuseCycles  = Math.min(Math.floor(lifeUses / floors) + 1, floors);
  const marginalBuy  = buyPrice / reuseCycles;
  const marginalRent = rentPrice * floors;
  const decision     = marginalBuy < marginalRent ? 'Buy' : 'Rent';
  const buyQty       = decision === 'Buy' ? qty : 0;
  const rentQty      = decision === 'Buy'
    ? Math.max(0, totalDemand - buyQty * reuseCycles)
    : totalDemand;
  const optimizedCost    = buyQty * buyPrice + rentQty * rentPrice;
  const traditionalCost  = totalDemand * buyPrice;
  return { optimizedCost, traditionalCost, saving: traditionalCost - optimizedCost, decision, reuseCycles };
}

const BASE_COMPONENTS = [
  { name: 'Wall Panels',   icon: '🧱', perSqm: 0.8, buy: 4200, rent: 380, life: 50 },
  { name: 'Slab Panels',   icon: '⬜', perSqm: 0.6, buy: 6800, rent: 620, life: 60 },
  { name: 'Prop Supports', icon: '🔩', perSqm: 0.4, buy: 2800, rent: 180, life: 80 },
  { name: 'Beam Clamps',   icon: '🔧', perSqm: 0.3, buy: 1400, rent: 120, life: 100 },
  { name: 'Corner Pieces', icon: '📐', perSqm: 0.2, buy: 950,  rent: 85,  life: 120 },
  { name: 'Tie Rods',      icon: '📏', perSqm: 0.5, buy: 650,  rent: 55,  life: 150 },
];

const CHANGE_EVENTS = [
  { id: 'panel_damage',    icon: '💥', label: 'Panel Damage',      desc: 'X% of panels damaged on site',         param: 'damagePct',   default: 20  },
  { id: 'schedule_delay',  icon: '⏰', label: 'Schedule Delay',    desc: 'Project delayed by X weeks',            param: 'delayWeeks',  default: 4   },
  { id: 'budget_cut',      icon: '✂️', label: 'Budget Cut',        desc: 'Procurement budget reduced by X%',      param: 'budgetCut',   default: 15  },
  { id: 'scope_increase',  icon: '📈', label: 'Scope Increase',    desc: 'X additional floors added',             param: 'extraFloors', default: 3   },
  { id: 'material_short',  icon: '📦', label: 'Material Shortage', desc: 'Key component stock reduced by X%',     param: 'shortage',    default: 30  },
  { id: 'design_change',   icon: '📐', label: 'Design Revision',   desc: 'Floor area changed by X%',             param: 'areaChange',  default: 10  },
];

function runScenario(baseParams, event, eventValue) {
  let { floors, zones, area } = baseParams;

  // Apply event impact
  let damageMultiplier = 1;
  let costMultiplier   = 1;
  let extraWeeks       = 0;

  switch (event.id) {
    case 'panel_damage':
      damageMultiplier = 1 + (eventValue / 100) * 0.4;
      break;
    case 'schedule_delay':
      extraWeeks     = eventValue;
      costMultiplier = 1 + (eventValue / 52) * 0.15;
      break;
    case 'budget_cut':
      costMultiplier = 1 - eventValue / 100;
      break;
    case 'scope_increase':
      floors = floors + eventValue;
      break;
    case 'material_short':
      damageMultiplier = 1 + (eventValue / 100) * 0.3;
      break;
    case 'design_change':
      area = Math.round(area * (1 + eventValue / 100));
      break;
    default:
      break;
  }

  const results = BASE_COMPONENTS.map(c => {
    const qty     = Math.ceil(c.perSqm * area / zones) * damageMultiplier;
    const lp      = lpOptimize(qty, floors, c.buy * costMultiplier, c.rent * costMultiplier, c.life);
    return { ...c, qty: Math.ceil(qty), ...lp };
  });

  const totalOptimized    = results.reduce((s, r) => s + r.optimizedCost, 0);
  const totalTraditional  = results.reduce((s, r) => s + r.traditionalCost, 0);
  const totalSaving       = totalTraditional - totalOptimized;
  const reuseRate         = Math.round(results.reduce((s, r) => s + (r.decision === 'Buy' ? 70 : 40), 0) / results.length);
  const totalWeeks        = floors * 2 + extraWeeks;

  return { results, totalOptimized, totalTraditional, totalSaving, reuseRate, totalWeeks, floors, area };
}

const fmt = n => `₹${(n / 100000).toFixed(2)}L`;

export default function ScenarioSimulator() {
  const [baseParams, setBaseParams] = useState({ floors: 8, zones: 3, area: 1200 });
  const [selectedEvent, setSelectedEvent] = useState(CHANGE_EVENTS[0]);
  const [eventValue,    setEventValue]    = useState(CHANGE_EVENTS[0].default);
  const [generated,     setGenerated]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [scenarioA,     setScenarioA]     = useState(null);
  const [scenarioB,     setScenarioB]     = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const runSimulation = () => {
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      const a = runScenario(baseParams, { id: 'none' }, 0);
      const b = runScenario(baseParams, selectedEvent, eventValue);
      setScenarioA(a);
      setScenarioB(b);
      setGenerated(true);
      setLoading(false);
      showToast('✅ Scenario simulation complete!');
    }, 1600);
  };

  const exportPDF = () => {
    if (!generated) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KitIQ — Scenario Simulation Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Event: ${selectedEvent.label} (${eventValue}${selectedEvent.id === 'budget_cut' || selectedEvent.id === 'panel_damage' ? '%' : selectedEvent.id === 'schedule_delay' ? ' weeks' : selectedEvent.id === 'scope_increase' ? ' floors' : ''})`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 37);
    if (scenarioA && scenarioB) {
      autoTable(doc, {
        head: [['Metric', 'Scenario A (Original)', 'Scenario B (After Event)', 'Impact']],
        body: [
          ['Total Cost',    fmt(scenarioA.totalOptimized), fmt(scenarioB.totalOptimized), `${((scenarioB.totalOptimized - scenarioA.totalOptimized) / scenarioA.totalOptimized * 100).toFixed(1)}%`],
          ['Cost Saving',   fmt(scenarioA.totalSaving),   fmt(scenarioB.totalSaving),   `${fmt(scenarioB.totalSaving - scenarioA.totalSaving)}`],
          ['Reuse Rate',    `${scenarioA.reuseRate}%`,    `${scenarioB.reuseRate}%`,    `${scenarioB.reuseRate - scenarioA.reuseRate}%`],
          ['Total Weeks',   scenarioA.totalWeeks,          scenarioB.totalWeeks,          `+${scenarioB.totalWeeks - scenarioA.totalWeeks} weeks`],
          ['Floors',        scenarioA.floors,              scenarioB.floors,              `+${scenarioB.floors - scenarioA.floors}`],
        ],
        startY: 44,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
    }
    doc.save(`KitIQ_Scenario_${selectedEvent.id}.pdf`);
    showToast('📄 PDF exported!');
  };

  const barData = generated && scenarioA && scenarioB
    ? BASE_COMPONENTS.map((c, i) => ({
        name: c.name.split(' ')[0],
        'Scenario A': Math.round(scenarioA.results[i].optimizedCost / 1000),
        'Scenario B': Math.round(scenarioB.results[i].optimizedCost / 1000),
      }))
    : [];

  const radarData = generated && scenarioA && scenarioB
    ? [
        { metric: 'Cost Efficiency', A: 100, B: Math.round((scenarioA.totalOptimized / scenarioB.totalOptimized) * 100) },
        { metric: 'Reuse Rate',      A: scenarioA.reuseRate, B: scenarioB.reuseRate },
        { metric: 'Timeline',        A: 100, B: Math.round((scenarioA.totalWeeks / scenarioB.totalWeeks) * 100) },
        { metric: 'Savings',         A: Math.round((scenarioA.totalSaving / scenarioA.totalTraditional) * 100), B: Math.round((scenarioB.totalSaving / scenarioB.totalTraditional) * 100) },
        { metric: 'Scope',           A: Math.round((baseParams.floors / scenarioB.floors) * 100), B: 100 },
      ]
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ backgroundColor: '#1e2a38', border: '1px solid #6366f133', borderRadius: '10px', padding: '12px 16px' }}>
        <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, fontSize: '13px' }}>{p.name}: ₹{p.value}K</div>)}
      </div>
    );
    return null;
  };

  const impactColor = (a, b, higher = false) => {
    if (higher) return b > a ? '#4ade80' : '#ef4444';
    return b < a ? '#4ade80' : '#ef4444';
  };

  const impactIcon = (a, b, higher = false) => {
    if (higher) return b > a ? '↑' : '↓';
    return b < a ? '↓' : '↑';
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", position: 'relative' }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#0f2d1f' : '#2d1515',
          border: `1px solid ${toast.type === 'success' ? '#2dd4bf' : '#ef4444'}`,
          borderRadius: '12px', padding: '14px 20px',
          color: toast.type === 'success' ? '#2dd4bf' : '#ef4444',
          fontWeight: '700', fontSize: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'fadeSlideIn 0.3s ease forwards',
        }}>{toast.msg}</div>
      )}

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0d1117 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎯</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0 }}>Scenario Simulator</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Adaptive Scenario Intelligence · What-If Analysis · Real-time Re-optimization · Side-by-side Comparison
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['🏢', baseParams.floors, 'Floors'], ['🔲', baseParams.zones, 'Zones'], ['📐', `${baseParams.area}m²`, 'Area']].map(([icon, val, label]) => (
            <div key={label} style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SETUP CARD */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#6366f1, #8b5cf6)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Scenario A — Original Plan</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
          {[
            ['🏢', 'Floors', 'floors', 1, 50],
            ['🔲', 'Zones/Floor', 'zones', 1, 10],
            ['📐', 'Floor Area (sqm)', 'area', 100, 5000],
          ].map(([icon, label, key, min, max]) => (
            <div key={key} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>{icon} {label}</div>
              <input type="number" value={baseParams[key]} min={min} max={max}
                onChange={e => { setBaseParams(prev => ({ ...prev, [key]: Number(e.target.value) })); setGenerated(false); }}
                style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '20px', fontWeight: '800', outline: 'none', boxSizing: 'border-box', color: '#0f172a', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
        </div>

        {/* CHANGE EVENT SELECTOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#ef4444, #dc2626)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Scenario B — Change Event</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {CHANGE_EVENTS.map(event => (
            <button key={event.id} onClick={() => { setSelectedEvent(event); setEventValue(event.default); setGenerated(false); }} style={{
              padding: '16px', borderRadius: '12px', border: `2px solid ${selectedEvent.id === event.id ? '#6366f1' : '#e5e7eb'}`,
              backgroundColor: selectedEvent.id === event.id ? '#f0f0ff' : '#f8fafc',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{event.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: selectedEvent.id === event.id ? '#6366f1' : '#0f172a', marginBottom: '3px' }}>{event.label}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{event.desc}</div>
            </button>
          ))}
        </div>

        {/* EVENT VALUE SLIDER */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              {selectedEvent.icon} {selectedEvent.label} Magnitude
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#6366f1' }}>
              {eventValue}{selectedEvent.id === 'budget_cut' || selectedEvent.id === 'panel_damage' || selectedEvent.id === 'material_short' || selectedEvent.id === 'design_change' ? '%' : selectedEvent.id === 'schedule_delay' ? ' weeks' : ' floors'}
            </div>
          </div>
          <input type="range" min={1} max={selectedEvent.id === 'budget_cut' ? 50 : selectedEvent.id === 'scope_increase' ? 20 : selectedEvent.id === 'schedule_delay' ? 26 : 60}
            value={eventValue} onChange={e => { setEventValue(Number(e.target.value)); setGenerated(false); }}
            style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Low Impact</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>High Impact</span>
          </div>
        </div>

        <button onClick={runSimulation} disabled={loading} style={{
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '10px',
          fontWeight: '800', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >{loading ? '⏳ Running Simulation...' : '🎯 Run Scenario Simulation'}</button>
      </div>

      {generated && scenarioA && scenarioB && (
        <div>
          {/* IMPACT BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b, #0d1117)',
            borderRadius: '16px', padding: '20px 28px', marginBottom: '24px',
            border: '1px solid #6366f133', display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ fontSize: '28px' }}>{selectedEvent.icon}</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                {selectedEvent.label} Impact Analysis — {eventValue}{selectedEvent.id === 'budget_cut' || selectedEvent.id === 'panel_damage' || selectedEvent.id === 'material_short' || selectedEvent.id === 'design_change' ? '%' : selectedEvent.id === 'schedule_delay' ? ' weeks' : ' floors'}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                KitIQ has re-optimized your formwork plan using Linear Programming. Here's the impact vs your original plan.
              </div>
            </div>
            <button onClick={exportPDF} style={{
              marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', padding: '10px 20px',
              borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>📄 Export PDF</button>
          </div>

          {/* SIDE BY SIDE COMPARISON */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* SCENARIO A */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '2px solid #2dd4bf', boxShadow: '0 2px 12px rgba(45,212,191,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#0d1117', fontSize: '14px' }}>A</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Original Plan</div>
                <span style={{ marginLeft: 'auto', backgroundColor: '#f0fdfa', color: '#0d9488', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Baseline</span>
              </div>
              {[
                ['Total Cost', fmt(scenarioA.totalOptimized), '#2dd4bf'],
                ['Cost Savings', fmt(scenarioA.totalSaving), '#4ade80'],
                ['Reuse Rate', `${scenarioA.reuseRate}%`, '#818cf8'],
                ['Total Weeks', scenarioA.totalWeeks, '#fb923c'],
                ['Floors', scenarioA.floors, '#60a5fa'],
                ['Floor Area', `${baseParams.area} m²`, '#f472b6'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color }}>{val}</span>
                </div>
              ))}
            </div>

            {/* SCENARIO B */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '2px solid #6366f1', boxShadow: '0 2px 12px rgba(99,102,241,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '14px' }}>B</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>After {selectedEvent.label}</div>
                <span style={{ marginLeft: 'auto', backgroundColor: '#f0f0ff', color: '#6366f1', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Re-Optimized</span>
              </div>
              {[
                ['Total Cost',  fmt(scenarioB.totalOptimized), scenarioB.totalOptimized > scenarioA.totalOptimized ? '#ef4444' : '#4ade80', scenarioA.totalOptimized, scenarioB.totalOptimized, false],
                ['Cost Savings', fmt(scenarioB.totalSaving), scenarioB.totalSaving < scenarioA.totalSaving ? '#ef4444' : '#4ade80', scenarioA.totalSaving, scenarioB.totalSaving, true],
                ['Reuse Rate', `${scenarioB.reuseRate}%`, scenarioB.reuseRate < scenarioA.reuseRate ? '#ef4444' : '#4ade80', scenarioA.reuseRate, scenarioB.reuseRate, true],
                ['Total Weeks', scenarioB.totalWeeks, scenarioB.totalWeeks > scenarioA.totalWeeks ? '#ef4444' : '#4ade80', scenarioA.totalWeeks, scenarioB.totalWeeks, false],
                ['Floors', scenarioB.floors, '#60a5fa', scenarioA.floors, scenarioB.floors, true],
                ['Floor Area', `${scenarioB.area} m²`, '#f472b6', baseParams.area, scenarioB.area, true],
              ].map(([label, val, color, a, b, higher]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color }}>{val}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: impactColor(a, b, higher) }}>
                      {impactIcon(a, b, higher)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IMPACT SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              ['Cost Impact', fmt(Math.abs(scenarioB.totalOptimized - scenarioA.totalOptimized)), scenarioB.totalOptimized > scenarioA.totalOptimized ? '#ef4444' : '#4ade80', scenarioB.totalOptimized > scenarioA.totalOptimized ? '📈 Increased' : '📉 Reduced', '💰'],
              ['Saving Change', fmt(Math.abs(scenarioB.totalSaving - scenarioA.totalSaving)), scenarioB.totalSaving < scenarioA.totalSaving ? '#ef4444' : '#4ade80', scenarioB.totalSaving < scenarioA.totalSaving ? '📉 Reduced' : '📈 Increased', '💡'],
              ['Timeline', `+${scenarioB.totalWeeks - scenarioA.totalWeeks} wks`, scenarioB.totalWeeks > scenarioA.totalWeeks ? '#ef4444' : '#4ade80', scenarioB.totalWeeks > scenarioA.totalWeeks ? '⏰ Delayed' : '✅ On Track', '📅'],
              ['Reuse Impact', `${Math.abs(scenarioB.reuseRate - scenarioA.reuseRate)}%`, scenarioB.reuseRate < scenarioA.reuseRate ? '#ef4444' : '#4ade80', scenarioB.reuseRate < scenarioA.reuseRate ? '📉 Reduced' : '📈 Improved', '🔁'],
            ].map(([label, val, color, sub, icon]) => (
              <div key={label} style={{
                backgroundColor: '#fff', borderRadius: '14px', padding: '20px',
                border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</div>
                  <span style={{ fontSize: '20px' }}>{icon}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', color, marginBottom: '4px' }}>{val}</div>
                <div style={{ fontSize: '12px', color, fontWeight: '600' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* BAR CHART */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '4px', height: '20px', background: 'linear-gradient(#6366f1, #8b5cf6)', borderRadius: '4px' }} />
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Cost Comparison (₹K)</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="K" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Scenario A" fill="#2dd4bf" radius={[4,4,0,0]} />
                  <Bar dataKey="Scenario B" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* RADAR CHART */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '4px', height: '20px', background: 'linear-gradient(#6366f1, #8b5cf6)', borderRadius: '4px' }} />
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Performance Radar</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Radar name="Scenario A" dataKey="A" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.3} />
                  <Radar name="Scenario B" dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECOMMENDATIONS */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#6366f1, #8b5cf6)', borderRadius: '4px' }} />
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>🤖 KitIQ Recommendations</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  icon: '🔄',
                  title: 'Revised Kit Rotation',
                  desc: `Due to ${selectedEvent.label}, redistribute formwork kits across ${scenarioB.floors} floors with ${baseParams.zones} zones. Prioritize Wall Panels and Prop Supports for early procurement.`,
                  color: '#2dd4bf',
                },
                {
                  icon: '📦',
                  title: 'Updated Inventory Requirement',
                  desc: `Total inventory need has ${scenarioB.totalOptimized > scenarioA.totalOptimized ? 'increased' : 'decreased'} by ${fmt(Math.abs(scenarioB.totalOptimized - scenarioA.totalOptimized))}. ${scenarioB.totalOptimized > scenarioA.totalOptimized ? 'Initiate emergency procurement for critical components.' : 'Opportunity to reduce rental period for cost savings.'}`,
                  color: '#818cf8',
                },
                {
                  icon: '💡',
                  title: 'Optimal Response Strategy',
                  desc: selectedEvent.id === 'panel_damage'
                    ? 'Replace damaged panels immediately. Consider renting replacement units to avoid project delays. Review supplier backup options.'
                    : selectedEvent.id === 'schedule_delay'
                    ? 'Extend rental agreements for affected weeks. Re-sequence zone assignments to maintain reuse efficiency despite delay.'
                    : selectedEvent.id === 'budget_cut'
                    ? 'Maximize rent-over-buy decisions. Increase reuse cycles by extending component life through better maintenance.'
                    : selectedEvent.id === 'scope_increase'
                    ? 'Procure additional kits for new floors. Maintain existing reuse clusters — extend Kit Set Alpha to new floors.'
                    : 'Re-optimize procurement order. Substitute affected components with available alternatives from inventory.',
                  color: '#4ade80',
                },
              ].map((r, i) => (
                <div key={i} style={{
                  backgroundColor: '#f8fafc', borderRadius: '12px', padding: '18px 20px',
                  border: '1px solid #e5e7eb', borderLeft: `4px solid ${r.color}`,
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{r.title}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}