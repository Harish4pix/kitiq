import React, { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */

const DEFAULT_COMPONENTS = [
  { name: 'Wall Panels (Type A)',  icon: '🧱', qty: 120, unit: 'nos', dailyUse: 8  },
  { name: 'Slab Panels (Type B)', icon: '⬜', qty: 90,  unit: 'nos', dailyUse: 6  },
  { name: 'Prop Supports (3m)',   icon: '🔩', qty: 160, unit: 'nos', dailyUse: 10 },
  { name: 'Beam Clamps',          icon: '🔧', qty: 145, unit: 'nos', dailyUse: 7  },
  { name: 'Corner Pieces',        icon: '📐', qty: 130, unit: 'nos', dailyUse: 5  },
  { name: 'Tie Rods',             icon: '📏', qty: 175, unit: 'nos', dailyUse: 9  },
];

function predictStockout(qty, dailyUse, week) {
  const consumed = dailyUse * 7 * week;
  const reused   = Math.floor(consumed * 0.65);
  const net      = Math.max(qty - (consumed - reused), Math.round(qty * 0.1));
  const daysLeft = Math.floor(net / dailyUse);
  return { level: net, daysLeft };
}

function getPhase(week, totalWeeks) {
  if (week <= Math.floor(totalWeeks / 3))       return { label: 'Foundation', color: '#2dd4bf' };
  if (week <= Math.floor(totalWeeks * 2 / 3))   return { label: 'Structure',  color: '#818cf8' };
  return                                                { label: 'Finishing',  color: '#fb923c' };
}

function detectConflicts(components, floors, zones, totalWeeks) {
  const conflicts = [];
  components.forEach(c => {
    for (let w = 1; w <= totalWeeks; w++) {
      const { level, daysLeft } = predictStockout(c.qty, c.dailyUse, w);
      const pct = level / c.qty;
      if (pct < 0.15) {
        conflicts.push({ week: w, component: c.name, issue: `Critical stock — only ${level} units left (${daysLeft} days until stockout)`, severity: 'Critical' });
        break;
      } else if (pct < 0.30 && w % 3 === 0) {
        conflicts.push({ week: w, component: c.name, issue: `Low stock warning — ${level} units remaining, reorder recommended`, severity: 'Warning' });
        break;
      }
    }
  });
  return conflicts;
}

export default function ScheduleDashboard() {
  // eslint-disable-next-line
  const [floors,    setFloors]    = useState(6);
  const [zones,     setZones]     = useState(3);
  const [startWeek, setStartWeek] = useState(1);
  const [generated, setGenerated] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [components, setComponents] = useState(DEFAULT_COMPONENTS);
  const [toast,     setToast]     = useState(null);
  const [activeChart, setActiveChart] = useState('area');
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);

  const totalWeeks = floors * 2;
  
   const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleGenerate = () => {
  setLoading(true);
  setGenerated(false);
  setTimeout(() => {
    setGenerated(true);
    setLoading(false);
    showToast('✅ Schedule generated successfully!');
    localStorage.setItem('kitiq_inventory', JSON.stringify(
      components.map(c => {
        const level = Math.max(
          c.qty - Math.floor(c.dailyUse * 7 * 2 * 0.35),
          Math.round(c.qty * 0.1)
        );
        const pct = level / c.qty;
        return {
          name: c.name,
          icon: c.icon,
          stock: level,
          total: c.qty,
          status: pct < 0.15 ? 'Critical' : pct < 0.30 ? 'Low' : 'Good',
        };
      })
    ));
  }, 1400);
};

  // ── CSV UPLOAD ──────────────────────────────────────────────────
  const handleCSV = (file) => {
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = results.data.map(row => ({
            name:     row['Component']  || row['name']     || 'Unknown',
            icon:     row['Icon']       || row['icon']     || '📦',
            qty:      Number(row['Qty'] || row['qty']      || 100),
            unit:     row['Unit']       || row['unit']     || 'nos',
            dailyUse: Number(row['DailyUse'] || row['dailyUse'] || 5),
          }));
          if (parsed.length > 0) {
            setComponents(parsed);
            setCsvUploaded(true);
            setGenerated(false);
            showToast(`✅ CSV loaded — ${parsed.length} components imported!`);
          }
        } catch {
          showToast('❌ CSV format error. Check column names.', 'error');
        }
      },
      error: () => showToast('❌ Failed to parse CSV file.', 'error'),
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleCSV(file);
    else showToast('❌ Please upload a .csv file only', 'error');
  }, []);

  const exportPDF = () => {
    if (!generated) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KitIQ — Schedule & Inventory Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Floors: ${floors} | Zones: ${zones} | Total Weeks: ${totalWeeks} | Start Week: ${startWeek}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 37);
    const rows = components.map(c => {
      const { level, daysLeft } = predictStockout(c.qty, c.dailyUse, Math.floor(totalWeeks / 2));
      return [c.name, c.qty, c.dailyUse, level, daysLeft > 7 ? 'OK' : daysLeft > 3 ? 'Low' : 'Critical'];
    });
    autoTable(doc, {
      head: [['Component', 'Total Qty', 'Daily Use', 'Mid-Project Stock', 'Status']],
      body: rows, startY: 44,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [74, 222, 128], textColor: 0, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`KitIQ_Schedule_${floors}F_${zones}Z.pdf`);
    showToast('📄 PDF exported successfully!');
  };

  // ── CHART DATA ──────────────────────────────────────────────────
  const lineData = Array.from({ length: Math.min(totalWeeks, 14) }, (_, w) => {
    const entry = { week: `Wk ${startWeek + w}` };
    components.slice(0, 4).forEach(c => {
      entry[c.name.split(' ')[0]] = predictStockout(c.qty, c.dailyUse, w + 1).level;
    });
    return entry;
  });

  const barData = components.map(c => ({
    name: c.name.split(' ')[0],
    Initial: c.qty,
    'Mid-Project': predictStockout(c.qty, c.dailyUse, Math.floor(totalWeeks / 2)).level,
    Final: predictStockout(c.qty, c.dailyUse, totalWeeks).level,
  }));

  const conflicts = detectConflicts(components, floors, zones, totalWeeks);

  const LINE_COLORS = ['#2dd4bf', '#818cf8', '#fb923c', '#4ade80'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ backgroundColor: '#1e2a38', border: '1px solid #2dd4bf33', borderRadius: '10px', padding: '12px 16px' }}>
        <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, fontSize: '13px' }}>{p.name}: {p.value} units</div>)}
      </div>
    );
    return null;
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
        background: 'linear-gradient(135deg, #0c1a2e 0%, #0d1117 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #4ade80, #16a34a)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📅</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0 }}>Schedule & Inventory</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Predictive Inventory Analytics · Dynamic Conflict Detection · CSV Import · PDF Export
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['🏢', floors, 'Floors'], ['🔲', zones, 'Zones'], ['📅', totalWeeks, 'Weeks']].map(([icon, val, label]) => (
            <div key={label} style={{ backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CSV UPLOAD */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px 28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#4ade80, #16a34a)', borderRadius: '4px' }} />
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>📂 Import Project Schedule (CSV)</div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? '#4ade80' : csvUploaded ? '#2dd4bf' : '#e5e7eb'}`,
            borderRadius: '12px', padding: '28px', textAlign: 'center',
            backgroundColor: dragOver ? '#f0fdf4' : csvUploaded ? '#f0fdfa' : '#f8fafc',
            transition: 'all 0.2s', marginBottom: '16px', cursor: 'pointer',
          }}
          onClick={() => document.getElementById('csv-input').click()}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{csvUploaded ? '✅' : '📂'}</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: csvUploaded ? '#2dd4bf' : '#374151', marginBottom: '4px' }}>
            {csvUploaded ? `CSV Loaded — ${components.length} components imported` : 'Drop CSV file here or click to upload'}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            {csvUploaded ? 'Click to replace with another file' : 'Columns: Component, Qty, DailyUse, Unit, Icon'}
          </div>
          <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => handleCSV(e.target.files[0])} />
        </div>

        {/* CSV FORMAT GUIDE */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px 18px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>📋 Expected CSV Format:</div>
          <code style={{ fontSize: '12px', color: '#64748b', display: 'block', lineHeight: '1.8' }}>
            Component,Qty,DailyUse,Unit,Icon<br />
            Wall Panels (Type A),120,8,nos,🧱<br />
            Slab Panels (Type B),90,6,nos,⬜<br />
            Prop Supports (3m),160,10,nos,🔩
          </code>
        </div>
      </div>

      {/* INPUT CARD */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#4ade80, #16a34a)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Schedule Parameters</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[
            ['🏢', 'Floors', floors, setFloors, 1, 30],
            ['🔲', 'Zones/Floor', zones, setZones, 1, 10],
            ['📅', 'Start Week', startWeek, setStartWeek, 1, 52],
          ].map(([icon, label, val, setter, min, max]) => (
            <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>{icon} {label}</div>
              <input type="number" value={val} min={min} max={max}
                onChange={e => { setter(Number(e.target.value)); setGenerated(false); }}
                style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '20px', fontWeight: '800', outline: 'none', boxSizing: 'border-box', color: '#0f172a', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#4ade80'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
        </div>
        <button onClick={handleGenerate}
          disabled={loading} style={{
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4ade80, #16a34a)',
            color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '10px',
            fontWeight: '800', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(74,222,128,0.4)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >{loading ? '⏳ Building Schedule...' : '📅 Generate Schedule'}</button>
      </div>

      {generated && (
        <div>
          {/* SUMMARY STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              ['Total Weeks', totalWeeks, '#4ade80', '📅'],
              ['Components', components.length, '#2dd4bf', '📦'],
              ['Conflicts', conflicts.length, conflicts.length > 0 ? '#ef4444' : '#4ade80', '⚠️'],
              ['CSV Source', csvUploaded ? 'Imported' : 'Default', '#818cf8', '📂'],
            ].map(([label, val, color, icon]) => (
              <div key={label} style={{
                backgroundColor: '#fff', borderRadius: '14px', padding: '20px',
                border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color }}>{val}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CHARTS */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#4ade80, #16a34a)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Predictive Inventory Charts</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['area', '📈 Area'], ['line', '📉 Line'], ['bar', '📊 Bar']].map(([id, label]) => (
                  <button key={id} onClick={() => setActiveChart(id)} style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    backgroundColor: activeChart === id ? '#4ade80' : '#f1f5f9',
                    color: activeChart === id ? '#0d1117' : '#64748b',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {activeChart === 'area' && (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    {LINE_COLORS.map((color, i) => (
                      <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {components.slice(0, 4).map((c, i) => (
                    <Area key={c.name} type="monotone" dataKey={c.name.split(' ')[0]}
                      stroke={LINE_COLORS[i]} fill={`url(#grad${i})`} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'line' && (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {components.slice(0, 4).map((c, i) => (
                    <Line key={c.name} type="monotone" dataKey={c.name.split(' ')[0]}
                      stroke={LINE_COLORS[i]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'bar' && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Initial"      fill="#4ade80" radius={[4,4,0,0]} />
                  <Bar dataKey="Mid-Project"  fill="#2dd4bf" radius={[4,4,0,0]} />
                  <Bar dataKey="Final"        fill="#818cf8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* WEEKLY TIMELINE */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#4ade80, #16a34a)', borderRadius: '4px' }} />
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Weekly Timeline</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
              {Array.from({ length: Math.min(totalWeeks, 16) }, (_, w) => {
                const phase = getPhase(w + 1, totalWeeks);
                return (
                  <div key={w} style={{ width: '80px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${phase.color}33`, flexShrink: 0, transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ backgroundColor: phase.color, padding: '8px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: '700' }}>Wk {startWeek + w}</div>
                    <div style={{ backgroundColor: `${phase.color}18`, padding: '10px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: phase.color }}>{phase.label}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Flr {Math.floor(w / 2) + 1}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Zn {(w % zones) + 1}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              {[['#2dd4bf', 'Foundation'], ['#818cf8', 'Structure'], ['#fb923c', 'Finishing']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{label} Phase</span>
                </div>
              ))}
            </div>
          </div>

          {/* PREDICTIVE INVENTORY TABLE */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc, #fff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#4ade80, #16a34a)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Predictive Inventory Levels</div>
              </div>
              <button onClick={exportPDF} style={{
                background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                color: '#0d1117', border: 'none', padding: '10px 20px',
                borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              }}>📄 Export PDF</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '13px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb', letterSpacing: '0.8px' }}>COMPONENT</th>
                    <th style={{ padding: '13px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>TOTAL QTY</th>
                    <th style={{ padding: '13px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>DAILY USE</th>
                    {Array.from({ length: Math.min(totalWeeks, 8) }, (_, w) => (
                      <th key={w} style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>Wk {startWeek + w}</th>
                    ))}
                    <th style={{ padding: '13px 18px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>STOCKOUT</th>
                    <th style={{ padding: '13px 18px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c, i) => {
                    const weekLevels = Array.from({ length: Math.min(totalWeeks, 8) }, (_, w) => predictStockout(c.qty, c.dailyUse, w + 1));
                    const finalLevel = predictStockout(c.qty, c.dailyUse, totalWeeks);
                    const isLow = finalLevel.level < c.qty * 0.3;
                    const isCritical = finalLevel.level < c.qty * 0.15;
                    return (
                      <tr key={c.name} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}
                      >
                        <td style={{ padding: '13px 18px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{c.icon}</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 10px', textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#4ade80', borderBottom: '1px solid #f1f5f9' }}>{c.qty}</td>
                        <td style={{ padding: '13px 10px', textAlign: 'center', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{c.dailyUse}/day</td>
                        {weekLevels.map(({ level }, w) => {
                          const pct = level / c.qty;
                          const cellColor = pct > 0.6 ? '#4ade80' : pct > 0.3 ? '#f59e0b' : '#ef4444';
                          return (
                            <td key={w} style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: cellColor }}>{level}</div>
                              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '3px', height: '3px', marginTop: '3px', overflow: 'hidden' }}>
                                <div style={{ backgroundColor: cellColor, width: `${pct * 100}%`, height: '3px' }} />
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '13px 10px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: finalLevel.daysLeft > 7 ? '#4ade80' : '#ef4444', borderBottom: '1px solid #f1f5f9' }}>
                          {finalLevel.daysLeft}d
                        </td>
                        <td style={{ padding: '13px 18px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{
                            backgroundColor: isCritical ? '#fef2f2' : isLow ? '#fef3c7' : '#f0fdf4',
                            color: isCritical ? '#ef4444' : isLow ? '#d97706' : '#16a34a',
                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                            border: `1px solid ${isCritical ? '#fecaca' : isLow ? '#fde68a' : '#bbf7d0'}`,
                          }}>{isCritical ? '🔴 Critical' : isLow ? '🟡 Low' : '🟢 OK'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CONFLICT ALERTS */}
          {conflicts.length > 0 && (
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #fecaca', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#ef4444, #dc2626)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>⚠️ Predictive Conflict Alerts ({conflicts.length})</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {conflicts.map((c, i) => (
                  <div key={i} style={{
                    backgroundColor: c.severity === 'Critical' ? '#fef2f2' : '#fef3c7',
                    borderRadius: '12px', padding: '16px 20px',
                    border: `1px solid ${c.severity === 'Critical' ? '#fecaca' : '#fde68a'}`,
                    borderLeft: `4px solid ${c.severity === 'Critical' ? '#ef4444' : '#f59e0b'}`,
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <span style={{ fontSize: '20px' }}>{c.severity === 'Critical' ? '🔴' : '🟡'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: c.severity === 'Critical' ? '#ef4444' : '#d97706' }}>Week {c.week}</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{c.component}</span>
                        <span style={{ backgroundColor: c.severity === 'Critical' ? '#fef2f2' : '#fef3c7', color: c.severity === 'Critical' ? '#ef4444' : '#d97706', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{c.severity}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{c.issue}</div>
                    </div>
                    <span style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>Resolve →</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}