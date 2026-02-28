import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── IS CODE 456:2000 STANDARD PANEL SIZES ───────────────────────
const PANEL_SIZES = {
  'Wall Panel (0.9×1.8m)':  { width: 0.9,  height: 1.8, area: 1.62,  type: 'wall' },
  'Wall Panel (1.2×2.4m)':  { width: 1.2,  height: 2.4, area: 2.88,  type: 'wall' },
  'Slab Panel (0.9×1.8m)':  { width: 0.9,  height: 1.8, area: 1.62,  type: 'slab' },
  'Slab Panel (1.2×2.4m)':  { width: 1.2,  height: 2.4, area: 2.88,  type: 'slab' },
};

const PROP_SPACING = 1.2; // IS Code standard: 1 prop per 1.2m × 1.2m
const WASTAGE_FACTOR = 1.05; // 5% wastage allowance

const PIE_COLORS = ['#2dd4bf','#818cf8','#fb923c','#4ade80','#f472b6','#60a5fa','#facc15','#a78bfa'];

// ─── REAL KITTING ENGINE (IS Code Based) ─────────────────────────
function calculateKit(params) {
  const {
    wallHeight, wallLength, wallThickness,
    columnSize, columnCount,
    slabThickness, slabArea,
    beamWidth, beamDepth, beamLength,
    floors, zones,
    panelType,
  } = params;

  const panel = PANEL_SIZES[panelType];

  // WALL PANELS: (wall height × wall length) / panel area × 2 sides
  const wallFormworkArea = wallHeight * wallLength * 2;
  const wallPanels = Math.ceil((wallFormworkArea / panel.area) * WASTAGE_FACTOR);

  // COLUMN BOXES: 4 sides × column perimeter × height / panel width
  const columnPerimeter = 4 * (columnSize / 1000); // mm to m
  const columnFormworkArea = columnPerimeter * wallHeight * columnCount;
  const columnPanels = Math.ceil((columnFormworkArea / panel.area) * WASTAGE_FACTOR);

  // SLAB PROPS: slab area / prop spacing² (IS Code 456:2000)
  const propSpacing2 = PROP_SPACING * PROP_SPACING; // 1.44 sqm per prop
  const slabProps = Math.ceil((slabArea / propSpacing2) * WASTAGE_FACTOR);

  // BEAM SIDES: 2 sides × beam depth × beam length / panel height
  const beamFormworkArea = 2 * (beamDepth / 1000) * beamLength;
  const beamPanels = Math.ceil((beamFormworkArea / panel.area) * WASTAGE_FACTOR);

  // ACCESSORIES (industry standard ratios)
  const totalPanels = wallPanels + columnPanels + beamPanels;
  const tieRods     = Math.ceil(totalPanels * 0.4);
  const wingNuts    = tieRods * 2;
  const clamps      = Math.ceil(totalPanels * 0.3);
  const cornerPieces = Math.ceil(totalPanels * 0.15);
  const walingBeams  = Math.ceil(totalPanels * 0.25);
  const basePlates   = Math.ceil(slabProps * 0.8);

  const perZone = {
    wallPanels:    Math.ceil(wallPanels   / zones),
    columnPanels:  Math.ceil(columnPanels / zones),
    slabProps:     Math.ceil(slabProps    / zones),
    beamPanels:    Math.ceil(beamPanels   / zones),
    tieRods:       Math.ceil(tieRods      / zones),
    wingNuts:      Math.ceil(wingNuts     / zones),
    clamps:        Math.ceil(clamps       / zones),
    cornerPieces:  Math.ceil(cornerPieces / zones),
    walingBeams:   Math.ceil(walingBeams  / zones),
    basePlates:    Math.ceil(basePlates   / zones),
  };

  return {
    perZone,
    perFloor: {
      wallPanels, columnPanels, slabProps, beamPanels,
      tieRods, wingNuts, clamps, cornerPieces, walingBeams, basePlates,
    },
    total: {
      wallPanels:   wallPanels   * floors,
      columnPanels: columnPanels * floors,
      slabProps:    slabProps    * floors,
      beamPanels:   beamPanels   * floors,
      tieRods:      tieRods      * floors,
      wingNuts:     wingNuts     * floors,
      clamps:       clamps       * floors,
      cornerPieces: cornerPieces * floors,
      walingBeams:  walingBeams  * floors,
      basePlates:   basePlates   * floors,
    },
    formworkAreas: { wallFormworkArea, columnFormworkArea, slabArea, beamFormworkArea },
  };
}

export default function Kitting() {
  const [params, setParams] = useState({
    floors: 5, zones: 3,
    wallHeight: 3.0, wallLength: 120, wallThickness: 200,
    columnSize: 450, columnCount: 20,
    slabThickness: 150, slabArea: 1200,
    beamWidth: 300, beamDepth: 600, beamLength: 80,
    panelType: 'Wall Panel (1.2×2.4m)',
  });
  const [generated, setGenerated]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [kitResult, setKitResult]   = useState(null);
  const [activeTab, setActiveTab]   = useState('wall');
  const [activeChart, setActiveChart] = useState('bar');
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (key, val) => {
    setParams(prev => ({ ...prev, [key]: val }));
    setGenerated(false);
  };

  const generate = () => {
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
  const result = calculateKit(params);
  setKitResult(result);
  setGenerated(true);
  setLoading(false);
  showToast('✅ Kit list generated successfully!');
  localStorage.setItem('kitiq_kitting', JSON.stringify({
    floors: params.floors,
    zones: params.zones,
    area: params.slabArea,
    totalPanels: result.total.wallPanels + result.total.columnPanels,
    timestamp: new Date().toLocaleDateString('en-IN'),
  }));
}, 1200);
};

  // PDF Export
  const exportPDF = () => {
    if (!kitResult) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(13, 17, 23);
    doc.text('KitIQ — Formwork Kit List', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Project: ${params.floors} Floors × ${params.zones} Zones | Panel: ${params.panelType}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | IS Code 456:2000`, 14, 37);

    const rows = Object.entries(kitResult.total).map(([key, val]) => {
      const labels = {
        wallPanels: 'Wall Panels', columnPanels: 'Column Panels',
        slabProps: 'Slab Props', beamPanels: 'Beam Panels',
        tieRods: 'Tie Rods', wingNuts: 'Wing Nuts',
        clamps: 'Beam Clamps', cornerPieces: 'Corner Pieces',
        walingBeams: 'Waling Beams', basePlates: 'Base Plates',
      };
      return [
        labels[key], 'nos',
        kitResult.perZone[key],
        kitResult.perFloor[key],
        val,
        val > 500 ? 'High' : val > 200 ? 'Medium' : 'Low',
      ];
    });

    autoTable(doc, {
      head: [['Component', 'Unit', 'Qty/Zone', 'Qty/Floor', 'Total Qty', 'Demand']],
      body: rows,
      startY: 44,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [13, 145, 178], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`KitIQ_KitList_${params.floors}F_${params.zones}Z.pdf`);
    showToast('📄 PDF exported successfully!');
  };

  const kitRows = kitResult ? [
    { name: 'Wall Panels',    icon: '🧱', perZone: kitResult.perZone.wallPanels,   perFloor: kitResult.perFloor.wallPanels,   total: kitResult.total.wallPanels,   type: 'wall' },
    { name: 'Column Panels',  icon: '🏛️', perZone: kitResult.perZone.columnPanels, perFloor: kitResult.perFloor.columnPanels, total: kitResult.total.columnPanels, type: 'column' },
    { name: 'Slab Props',     icon: '🔩', perZone: kitResult.perZone.slabProps,    perFloor: kitResult.perFloor.slabProps,    total: kitResult.total.slabProps,    type: 'slab' },
    { name: 'Beam Panels',    icon: '📐', perZone: kitResult.perZone.beamPanels,   perFloor: kitResult.perFloor.beamPanels,   total: kitResult.total.beamPanels,   type: 'beam' },
    { name: 'Tie Rods',       icon: '📏', perZone: kitResult.perZone.tieRods,      perFloor: kitResult.perFloor.tieRods,      total: kitResult.total.tieRods,      type: 'acc' },
    { name: 'Wing Nuts',      icon: '🔧', perZone: kitResult.perZone.wingNuts,     perFloor: kitResult.perFloor.wingNuts,     total: kitResult.total.wingNuts,     type: 'acc' },
    { name: 'Beam Clamps',    icon: '🔗', perZone: kitResult.perZone.clamps,       perFloor: kitResult.perFloor.clamps,       total: kitResult.total.clamps,       type: 'acc' },
    { name: 'Corner Pieces',  icon: '📌', perZone: kitResult.perZone.cornerPieces, perFloor: kitResult.perFloor.cornerPieces, total: kitResult.total.cornerPieces, type: 'acc' },
    { name: 'Waling Beams',   icon: '🪵', perZone: kitResult.perZone.walingBeams,  perFloor: kitResult.perFloor.walingBeams,  total: kitResult.total.walingBeams,  type: 'acc' },
    { name: 'Base Plates',    icon: '🔲', perZone: kitResult.perZone.basePlates,   perFloor: kitResult.perFloor.basePlates,   total: kitResult.total.basePlates,   type: 'acc' },
  ] : [];

  const barData = kitRows.map(r => ({ name: r.name.split(' ')[0], 'Per Floor': r.perFloor, 'Total': r.total }));
  const pieData = kitRows.map(r => ({ name: r.name.split(' ')[0], value: r.total }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ backgroundColor: '#1e2a38', border: '1px solid #2dd4bf33', borderRadius: '10px', padding: '12px 16px' }}>
        <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, fontSize: '13px' }}>{p.name}: {p.value}</div>)}
      </div>
    );
    return null;
  };

  const inputGroups = {
    wall: [
      ['Wall Height (m)', 'wallHeight', 0.1, 6, 0.1],
      ['Wall Length (m)', 'wallLength', 10, 500, 1],
      ['Wall Thickness (mm)', 'wallThickness', 100, 400, 50],
    ],
    column: [
      ['Column Size (mm)', 'columnSize', 200, 900, 50],
      ['Column Count/Floor', 'columnCount', 1, 100, 1],
    ],
    slab: [
      ['Slab Thickness (mm)', 'slabThickness', 100, 300, 25],
      ['Slab Area (sqm)', 'slabArea', 100, 5000, 50],
    ],
    beam: [
      ['Beam Width (mm)', 'beamWidth', 150, 600, 50],
      ['Beam Depth (mm)', 'beamDepth', 300, 900, 50],
      ['Beam Length (m)', 'beamLength', 10, 300, 5],
    ],
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
        background: 'linear-gradient(135deg, #0f2d1f 0%, #0d1117 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #2dd4bf, #0891b2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0 }}>Formwork Kitting</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            IS Code 456:2000 Standard · Wall / Column / Slab / Beam calculations · Real panel sizes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['🏢', params.floors, 'Floors'], ['🔲', params.zones, 'Zones'], ['📐', `${params.slabArea}m²`, 'Area']].map(([icon, val, label]) => (
            <div key={label} style={{ backgroundColor: 'rgba(45,212,191,0.1)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', border: '1px solid rgba(45,212,191,0.2)' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#2dd4bf' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* INPUT CARD */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#2dd4bf, #0891b2)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Project Dimensions</div>
        </div>

        {/* PROJECT BASICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[['🏢', 'Floors', 'floors', 1, 50], ['🔲', 'Zones', 'zones', 1, 10]].map(([icon, label, key, min, max]) => (
            <div key={key} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>{icon} {label}</div>
              <input type="number" value={params[key]} min={min} max={max}
                onChange={e => update(key, Number(e.target.value))}
                style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '20px', fontWeight: '800', outline: 'none', boxSizing: 'border-box', color: '#0f172a', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2dd4bf'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', gridColumn: 'span 2' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>🏗️ Panel Type (IS Code Standard)</div>
            <select value={params.panelType} onChange={e => update('panelType', e.target.value)}
              style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '700', outline: 'none', backgroundColor: '#fff', color: '#0f172a', cursor: 'pointer' }}>
              {Object.keys(PANEL_SIZES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* FORMWORK TYPE TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0' }}>
          {[['wall', '🧱 Walls'], ['column', '🏛️ Columns'], ['slab', '⬜ Slabs'], ['beam', '📐 Beams']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '10px 20px', border: 'none', background: 'none',
              color: activeTab === id ? '#2dd4bf' : '#94a3b8',
              fontWeight: activeTab === id ? '700' : '500', fontSize: '14px',
              cursor: 'pointer', borderBottom: activeTab === id ? '2px solid #2dd4bf' : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {/* INPUT FIELDS FOR ACTIVE TAB */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {inputGroups[activeTab].map(([label, key, min, max, step]) => (
            <div key={key} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>{label}</div>
              <input type="number" value={params[key]} min={min} max={max} step={step}
                onChange={e => update(key, Number(e.target.value))}
                style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '20px', fontWeight: '800', outline: 'none', boxSizing: 'border-box', color: '#0f172a', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2dd4bf'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
        </div>

        {/* IS CODE NOTE */}
        <div style={{ backgroundColor: '#f0fdfa', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #2dd4bf33' }}>
          <div style={{ fontSize: '13px', color: '#0f766e', fontWeight: '600' }}>
            📖 IS Code 456:2000 — Prop spacing: {PROP_SPACING}m × {PROP_SPACING}m · Wastage factor: {((WASTAGE_FACTOR - 1) * 100).toFixed(0)}% · Panel: {params.panelType}
          </div>
        </div>

        <button onClick={generate} disabled={loading} style={{
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2dd4bf, #0891b2)',
          color: '#0d1117', border: 'none', padding: '15px 40px',
          borderRadius: '10px', fontWeight: '800', fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(45,212,191,0.35)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          {loading ? '⏳ Calculating...' : '⚡ Generate Kit List'}
        </button>
      </div>

      {/* RESULTS */}
      {generated && kitResult && (
        <div>
          {/* FORMWORK AREA SUMMARY */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              ['Wall Formwork', `${kitResult.formworkAreas.wallFormworkArea.toFixed(1)} m²`, '#2dd4bf', '🧱'],
              ['Column Formwork', `${kitResult.formworkAreas.columnFormworkArea.toFixed(1)} m²`, '#818cf8', '🏛️'],
              ['Slab Area', `${kitResult.formworkAreas.slabArea} m²`, '#fb923c', '⬜'],
              ['Beam Formwork', `${kitResult.formworkAreas.beamFormworkArea.toFixed(1)} m²`, '#4ade80', '📐'],
            ].map(([label, val, color, icon]) => (
              <div key={label} style={{
                backgroundColor: '#fff', borderRadius: '14px', padding: '20px',
                border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color }}>{val}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CHARTS */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#2dd4bf, #0891b2)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Component Quantity Charts</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['bar', '📊 Bar'], ['pie', '🥧 Pie']].map(([id, label]) => (
                  <button key={id} onClick={() => setActiveChart(id)} style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: activeChart === id ? '#2dd4bf' : '#f1f5f9',
                    color: activeChart === id ? '#0d1117' : '#64748b',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {activeChart === 'bar' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Per Floor" fill="#2dd4bf" radius={[6,6,0,0]} />
                  <Bar dataKey="Total" fill="#0891b2" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'pie' && (
              <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [val, 'Total Qty']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {pieData.map((item, i) => (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.value} nos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* KIT TABLE */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc, #fff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#2dd4bf, #0891b2)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Complete Kit List — IS Code 456:2000</div>
              </div>
              <button onClick={exportPDF} style={{
                background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
                color: '#0d1117', border: 'none', padding: '10px 20px',
                borderRadius: '8px', fontWeight: '700', fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                📄 Export PDF
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    {['#', 'Component', 'Type', 'Unit', 'Qty/Zone', 'Qty/Floor', 'Total Project', 'Demand'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb', letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kitRows.map((r, i) => {
                    const demand = r.total > 500 ? 'High' : r.total > 200 ? 'Medium' : 'Low';
                    const ds = { High: { bg: '#fef2f2', color: '#ef4444' }, Medium: { bg: '#fef3c7', color: '#d97706' }, Low: { bg: '#f0fdf4', color: '#16a34a' } }[demand];
                    const typeLabel = { wall: 'Wall', column: 'Column', slab: 'Slab', beam: 'Beam', acc: 'Accessory' }[r.type];
                    const typeColor = { wall: '#2dd4bf', column: '#818cf8', slab: '#fb923c', beam: '#4ade80', acc: '#94a3b8' }[r.type];
                    return (
                      <tr key={r.name} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}
                      >
                        <td style={{ padding: '13px 16px', fontSize: '12px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>{i + 1}</td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{r.icon}</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ backgroundColor: `${typeColor}18`, color: typeColor, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{typeLabel}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>nos</td>
                        <td style={{ padding: '13px 16px', fontSize: '16px', fontWeight: '800', color: '#2dd4bf', borderBottom: '1px solid #f1f5f9' }}>{r.perZone}</td>
                        <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{r.perFloor}</td>
                        <td style={{ padding: '13px 16px', fontSize: '15px', fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{r.total}</td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ backgroundColor: ds.bg, color: ds.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{demand}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FLOOR GRID */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#2dd4bf, #0891b2)', borderRadius: '4px' }} />
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Floor-wise Schedule</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {Array.from({ length: Math.min(params.floors, 12) }, (_, i) => {
                const totalPerFloor = kitRows.reduce((sum, r) => sum + r.perFloor, 0);
                return (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, #0f2d1f, #0d2818)',
                    borderRadius: '12px', padding: '16px', textAlign: 'center',
                    border: '1px solid #2dd4bf22', transition: 'transform 0.2s', cursor: 'default',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#2dd4bf', marginBottom: '6px', letterSpacing: '1px' }}>FLOOR {i + 1}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{params.zones} Zones</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', borderTop: '1px solid #2dd4bf22', paddingTop: '8px', marginTop: '6px' }}>{totalPerFloor}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>total pcs</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}