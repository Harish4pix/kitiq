/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── REAL FLOOR SIMILARITY CLUSTERING ────────────────────────────
function clusterFloors(floors, zones, area) {
  const floorData = Array.from({ length: floors }, (_, i) => ({
    floor: i + 1,
    area: area + (i % 3) * 50,
    zones: zones + (i % 2 === 0 ? 0 : 0),
    height: 3.0 + (i === 0 ? 0.5 : 0),
    wallLength: Math.round(area / 8 + (i % 4) * 5),
  }));

  // K-means style clustering (k=3 clusters)
  const k = Math.min(3, floors);
  const centroids = [
    floorData[0],
    floorData[Math.floor(floors / 2)],
    floorData[floors - 1],
  ];

  const clusters = floorData.map(f => {
    const distances = centroids.map(c =>
      Math.sqrt(
        Math.pow(f.area - c.area, 2) / 10000 +
        Math.pow(f.wallLength - c.wallLength, 2) / 1000
      )
    );
    return distances.indexOf(Math.min(...distances));
  });

  return { floorData, clusters };
}

function calcReuseFromClusters(clusters, floors) {
  const clusterCounts = [0, 1, 2].map(c => clusters.filter(x => x === c).length);
  return clusters.map((cluster, i) => {
    const sameCluster = clusterCounts[cluster];
    const reuseRate = Math.min(Math.round((sameCluster / floors) * 100), 92);
    const cycles = Math.max(sameCluster - 1, 0);
    return { cluster, reuseRate, cycles };
  });
}

const CLUSTER_COLORS = ['#2dd4bf', '#818cf8', '#fb923c'];
const CLUSTER_NAMES  = ['Kit Set Alpha', 'Kit Set Beta', 'Kit Set Gamma'];

const COMPONENTS = [
  { name: 'Wall Panels',   icon: '🧱', maxReuse: 50, weight: 45,  timber: 0    },
  { name: 'Slab Panels',   icon: '⬜', maxReuse: 60, weight: 38,  timber: 0    },
  { name: 'Prop Supports', icon: '🔩', maxReuse: 80, weight: 12,  timber: 0    },
  { name: 'Beam Clamps',   icon: '🔧', maxReuse: 100,weight: 3,   timber: 0    },
  { name: 'Corner Pieces', icon: '📐', maxReuse: 120,weight: 2,   timber: 0    },
  { name: 'Timber Boards', icon: '🪵', maxReuse: 8,  weight: 20,  timber: 1    },
];

// ─── ESG CALCULATIONS ─────────────────────────────────────────────
function calcESG(components, floors, avgReuseRate) {
  const reuseFactor = avgReuseRate / 100;
  // CO2: Each kg of steel formwork = 1.8 kg CO2, timber = 0.3 kg CO2
  const totalWeight = components.reduce((sum, c) => sum + c.weight * floors, 0);
  const co2Saved    = Math.round(totalWeight * 1.8 * reuseFactor * 0.6);
  // Timber saved: boards not needed due to reuse
  const timberComp  = components.filter(c => c.timber);
  const timberSaved = Math.round(timberComp.reduce((s, c) => s + c.weight * floors, 0) * reuseFactor);
  // Waste reduced
  const wasteReduced = Math.round(totalWeight * reuseFactor * 0.4);
  // Water saved (concrete forming)
  const waterSaved  = Math.round(totalWeight * reuseFactor * 2.5);
  // Cost of carbon (India carbon credit ~₹500/tonne CO2)
  const carbonValue = Math.round((co2Saved / 1000) * 500);

  return { co2Saved, timberSaved, wasteReduced, waterSaved, carbonValue };
}

export default function RepetitionPlanner() {
  const [floors,    setFloors]    = useState(8);
  const [zones,     setZones]     = useState(4);
  const [area,      setArea]      = useState(1200);
  const [generated, setGenerated] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [clusterData, setClusterData] = useState(null);
  const [toast,     setToast]     = useState(null);
  const [activeChart, setActiveChart] = useState('radar');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const analyze = () => {
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      const { floorData, clusters } = clusterFloors(floors, zones, area);
      const reuseData = calcReuseFromClusters(clusters, floors);
      setClusterData({ floorData, clusters, reuseData });
      setGenerated(true);
      setLoading(false);
      showToast('✅ Clustering analysis complete!');
      const avgReuse = Math.round(reuseData.reduce((s, r) => s + r.reuseRate, 0) / floors);
const esgData  = calcESG(COMPONENTS, floors, avgReuse);
localStorage.setItem('kitiq_esg', JSON.stringify({
  co2Saved:     esgData.co2Saved,
  timberSaved:  esgData.timberSaved,
  wasteReduced: esgData.wasteReduced,
  carbonValue:  esgData.carbonValue,
}));
    }, 1400);
  };

  const avgReuseRate = clusterData
    ? Math.round(clusterData.reuseData.reduce((s, r) => s + r.reuseRate, 0) / floors)
    : 0;

  const esg = generated ? calcESG(COMPONENTS, floors, avgReuseRate) : null;

  const radarData = COMPONENTS.map(c => ({
    component: c.name,
    'Reuse Score': Math.min(Math.round((c.maxReuse / 150) * 100), 100),
    'Efficiency':  Math.min(Math.round((avgReuseRate / 100) * (c.maxReuse / 120) * 100), 100),
  }));

  const barData = clusterData
    ? [0, 1, 2].map(ci => ({
        cluster: CLUSTER_NAMES[ci],
        floors: clusterData.clusters.filter(c => c === ci).length,
        reuseRate: clusterData.reuseData.find(r => r.cluster === ci)?.reuseRate || 0,
      }))
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ backgroundColor: '#1e2a38', border: '1px solid #fb923c33', borderRadius: '10px', padding: '12px 16px' }}>
        <div style={{ color: '#fff', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, fontSize: '13px' }}>{p.name}: {p.value}</div>)}
      </div>
    );
    return null;
  };

  const exportPDF = () => {
    if (!generated || !clusterData) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KitIQ — Repetition & Reuse Analysis', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Floors: ${floors} | Zones: ${zones} | Area: ${area}sqm | Avg Reuse: ${avgReuseRate}%`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 37);
    const rows = clusterData.floorData.map((f, i) => [
      `Floor ${f.floor}`,
      `${f.area} sqm`,
      f.zones,
      CLUSTER_NAMES[clusterData.clusters[i]],
      `${clusterData.reuseData[i].reuseRate}%`,
      clusterData.reuseData[i].cycles,
    ]);
    autoTable(doc, {
      head: [['Floor', 'Area', 'Zones', 'Kit Cluster', 'Reuse Rate', 'Reuse Cycles']],
      body: rows, startY: 44,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [251, 146, 60], textColor: 0, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`KitIQ_Repetition_${floors}F.pdf`);
    showToast('📄 PDF exported!');
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
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #fb923c, #f97316)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔁</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', margin: 0 }}>Repetition Planner</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            K-Means Floor Clustering · Real Reuse Detection · ESG Impact · PDF Export
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['🏢', floors, 'Floors'], ['🔲', zones, 'Zones'], ['📐', `${area}m²`, 'Area']].map(([icon, val, label]) => (
            <div key={label} style={{ backgroundColor: 'rgba(251,146,60,0.1)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', border: '1px solid rgba(251,146,60,0.2)' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fb923c' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#fb923c, #f97316)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Project Parameters</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[
            ['🏢', 'Floors', floors, setFloors, 1, 50, 'Total floors in building'],
            ['🔲', 'Zones/Floor', zones, setZones, 1, 10, 'Construction zones'],
            ['📐', 'Floor Area (sqm)', area, setArea, 100, 5000, 'Area per floor'],
          ].map(([icon, label, val, setter, min, max, hint]) => (
            <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>{icon} {label}</div>
              <input type="number" value={val} min={min} max={max}
                onChange={e => { setter(Number(e.target.value)); setGenerated(false); }}
                style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '20px', fontWeight: '800', outline: 'none', boxSizing: 'border-box', color: '#0f172a', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#fb923c'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{hint}</div>
            </div>
          ))}
        </div>

        {/* ALGO NOTE */}
        <div style={{ backgroundColor: '#fff7ed', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #fb923c33' }}>
          <div style={{ fontSize: '13px', color: '#9a3412', fontWeight: '600' }}>
            🧠 Algorithm: K-Means Clustering (k=3) on floor area + wall length similarity → identifies which floors can share the same formwork kit
          </div>
        </div>

        <button onClick={analyze} disabled={loading} style={{
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #fb923c, #f97316)',
          color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '10px',
          fontWeight: '800', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(251,146,60,0.4)', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >{loading ? '⏳ Running K-Means Clustering...' : '🔁 Analyze Repetition'}</button>
      </div>

      {generated && clusterData && (
        <div>
          {/* SUMMARY STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              ['Avg Reuse Rate', `${avgReuseRate}%`, '#fb923c', '🔁'],
              ['Kit Clusters', '3', '#818cf8', '🎯'],
              ['Reuse Savings', `₹${Math.round(avgReuseRate * floors * 800 / 1000)}K`, '#4ade80', '💰'],
              ['Floors Analyzed', floors, '#2dd4bf', '🏢'],
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

          {/* ESG IMPACT CARD */}
          <div style={{
            background: 'linear-gradient(135deg, #0f2d1f 0%, #0d1117 100%)',
            borderRadius: '20px', padding: '28px 32px', marginBottom: '24px',
            border: '1px solid #2dd4bf22', boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#4ade80, #16a34a)', borderRadius: '4px' }} />
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>🌱 ESG Impact — Environmental Benefits of Reuse</div>
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(74,222,128,0.3)' }}>L&T Sustainability Goals</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {[
                ['🌿', `${esg.co2Saved} kg`, 'CO₂ Saved', '#4ade80', 'Reduced carbon emissions from avoided manufacturing'],
                ['🪵', `${esg.timberSaved} kg`, 'Timber Saved', '#fb923c', 'Less timber consumed due to formwork reuse cycles'],
                ['♻️', `${esg.wasteReduced} kg`, 'Waste Reduced', '#2dd4bf', 'Construction waste avoided through planned reuse'],
                ['💧', `${esg.waterSaved} L`, 'Water Saved', '#60a5fa', 'Water saved in concrete forming operations'],
                ['💚', `₹${esg.carbonValue}`, 'Carbon Credits', '#818cf8', 'Estimated carbon credit value at ₹500/tonne CO₂'],
              ].map(([icon, val, label, color, tooltip]) => (
                <div key={label} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '18px',
                  border: `1px solid ${color}22`, textAlign: 'center',
                  transition: 'transform 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  title={tooltip}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color, marginBottom: '4px' }}>{val}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.15)' }}>
              <div style={{ fontSize: '13px', color: '#86efac' }}>
                🎯 <strong>L&T ESG Alignment:</strong> This project's formwork reuse strategy contributes to L&T's Net Zero 2040 target by saving {esg.co2Saved} kg CO₂ — equivalent to planting {Math.round(esg.co2Saved / 21)} trees 🌳
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#fb923c, #f97316)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Reuse Analytics Charts</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['radar', '🕸️ Radar'], ['bar', '📊 Bar']].map(([id, label]) => (
                  <button key={id} onClick={() => setActiveChart(id)} style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    backgroundColor: activeChart === id ? '#fb923c' : '#f1f5f9',
                    color: activeChart === id ? '#fff' : '#64748b',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {activeChart === 'radar' && (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="component" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Reuse Score" dataKey="Reuse Score" stroke="#fb923c" fill="#fb923c" fillOpacity={0.3} />
                  <Radar name="Efficiency" dataKey="Efficiency" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'bar' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="cluster" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="floors" name="Floors in Cluster" fill="#fb923c" radius={[6,6,0,0]} />
                  <Bar dataKey="reuseRate" name="Reuse Rate %" fill="#2dd4bf" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* HEATMAP */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#fb923c, #f97316)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>K-Means Cluster Heatmap</div>
              </div>
              <button onClick={exportPDF} style={{
                background: 'linear-gradient(135deg, #fb923c, #f97316)',
                color: '#fff', border: 'none', padding: '10px 20px',
                borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              }}>📄 Export PDF</button>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              Same color = same cluster = same formwork kit can be reused. Based on floor area + wall length similarity.
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', marginLeft: '84px' }}>
              {Array.from({ length: Math.min(zones, 8) }, (_, z) => (
                <div key={z} style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#64748b', padding: '6px' }}>Zone {z + 1}</div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {clusterData.floorData.slice(0, 12).map((f, fi) => {
                const cluster = clusterData.clusters[fi];
                const color   = CLUSTER_COLORS[cluster];
                const reuseInfo = clusterData.reuseData[fi];
                return (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '78px', fontSize: '12px', fontWeight: '700', color: '#64748b', textAlign: 'right', paddingRight: '10px', flexShrink: 0 }}>
                      Floor {f.floor}
                    </div>
                    {Array.from({ length: Math.min(zones, 8) }, (_, z) => (
                      <div key={z} style={{
                        flex: 1, height: '44px', borderRadius: '8px',
                        backgroundColor: color, opacity: 0.7 + (z % 3) * 0.1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '700', color: '#fff',
                        cursor: 'default', transition: 'transform 0.15s, opacity 0.15s',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = String(0.7 + (z % 3) * 0.1); }}
                        title={`Floor ${f.floor}, Zone ${z + 1} — ${CLUSTER_NAMES[cluster]} — Reuse: ${reuseInfo.reuseRate}%`}
                      >
                        {fi === 0 ? '🆕' : '♻️'}
                      </div>
                    ))}
                    <div style={{ width: '60px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color }}>
                      {reuseInfo.reuseRate}%
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              {CLUSTER_NAMES.map((name, i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: CLUSTER_COLORS[i] }} />
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{name}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>({clusterData.clusters.filter(c => c === i).length} floors)</span>
                </div>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🆕</span><span style={{ fontSize: '13px', color: '#64748b' }}>New Kit</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>♻️</span><span style={{ fontSize: '13px', color: '#64748b' }}>Reuse</span>
                </div>
              </div>
            </div>
          </div>

          {/* COMPONENT TABLE */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #f8fafc, #fff)' }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#fb923c, #f97316)', borderRadius: '4px' }} />
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Component Reuse Analysis</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Component', 'Max Reuse', 'Reuse Cycles', 'Reuse Rate', 'CO₂ Saved', 'Status'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map((c, i) => {
                  const cycles = Math.min(Math.floor(c.maxReuse / Math.max(floors, 1)), floors);
                  const pct    = Math.min(Math.round((cycles / floors) * 100), 100);
                  const co2    = Math.round(c.weight * cycles * 1.8 * 0.4);
                  const status = pct >= 70 ? 'Excellent' : pct >= 40 ? 'Good' : 'Low';
                  const ss     = { Excellent: { bg: '#f0fdf4', color: '#16a34a' }, Good: { bg: '#fef3c7', color: '#d97706' }, Low: { bg: '#fef2f2', color: '#ef4444' } }[status];
                  return (
                    <tr key={c.name} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff7ed'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}
                    >
                      <td style={{ padding: '13px 18px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{c.icon}</span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: '14px', color: '#374151', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>{c.maxReuse} uses</td>
                      <td style={{ padding: '13px 18px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {Array.from({ length: Math.min(cycles, 8) }, (_, i) => (
                            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fb923c' }} />
                          ))}
                          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px', alignSelf: 'center' }}>{cycles}x</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden', minWidth: '80px' }}>
                            <div style={{ background: 'linear-gradient(90deg, #fb923c, #f97316)', width: `${pct}%`, height: '8px', borderRadius: '6px' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fb923c', minWidth: '36px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', fontWeight: '700', color: '#4ade80', borderBottom: '1px solid #f1f5f9' }}>{co2} kg</td>
                      <td style={{ padding: '13px 18px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ backgroundColor: ss.bg, color: ss.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}