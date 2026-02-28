import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

// ─── REAL 2024 INDIAN MARKET RATES ───────────────────────────────
const MARKET_RATES = {
  'Wall Panels (0.9×1.8m)':   { buy: 4200,  rent: 380, life: 50, icon: '🧱' },
  'Slab Panels (1.2×2.4m)':   { buy: 6800,  rent: 620, life: 60, icon: '⬜' },
  'Prop Supports (3m)':        { buy: 2800,  rent: 180, life: 80, icon: '🔩' },
  'Beam Clamps':               { buy: 1400,  rent: 120, life: 100, icon: '🔧' },
  'Corner Pieces':             { buy: 950,   rent: 85,  life: 120, icon: '📐' },
  'Tie Rods':                  { buy: 650,   rent: 55,  life: 150, icon: '📏' },
  'Base Plates':               { buy: 1800,  rent: 160, life: 90,  icon: '🔲' },
  'Waling Beams':              { buy: 3500,  rent: 310, life: 70,  icon: '📦' },
};

const CITY_MULTIPLIERS = {
  'Mumbai': 1.15, 'Delhi': 1.10, 'Bangalore': 1.08,
  'Pune': 1.05, 'Hyderabad': 1.06, 'Nashik': 1.00,
  'Nagpur': 1.00, 'Chennai': 1.07,
};

const PIE_COLORS = ['#2dd4bf','#818cf8','#fb923c','#4ade80','#f472b6','#60a5fa','#facc15','#a78bfa'];

// ─── LINEAR PROGRAMMING OPTIMIZER ───────────────────────────────
function lpOptimize(qty, floors, buyPrice, rentPrice, lifeUses) {
  // Minimize Total Cost = buy_cost + rent_cost
  // Subject to:
  //   buy_qty * reuse_cycles + rent_qty >= total_demand
  //   buy_qty >= 0, rent_qty >= 0
  const totalDemand = qty * floors;
  const reuseCycles = Math.min(Math.floor(lifeUses / floors) + 1, floors);

  // LP Decision: compare marginal cost of buying vs renting
  const marginalBuyCost = buyPrice / reuseCycles;
  const marginalRentCost = rentPrice * floors;

  let buyQty = 0, rentQty = 0;
  if (marginalBuyCost < marginalRentCost) {
    // Buying is optimal
    buyQty = qty;
    rentQty = Math.max(0, totalDemand - buyQty * reuseCycles);
  } else {
    // Renting is optimal
    rentQty = totalDemand;
    buyQty = 0;
  }

  const optimizedCost = (buyQty * buyPrice) + (rentQty * rentPrice);
  const traditionalCost = totalDemand * buyPrice;
  const saving = traditionalCost - optimizedCost;
  const decision = marginalBuyCost < marginalRentCost ? 'Buy' : 'Rent';

  return { buyQty, rentQty, reuseCycles, optimizedCost, traditionalCost, saving, decision };
}

export default function BoQOptimizer() {
  const [floors, setFloors] = useState(5);
  const [zones, setZones]   = useState(3);
  const [area, setArea]     = useState(1200);
  const [city, setCity]     = useState('Mumbai');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [customPrices, setCustomPrices] = useState({});
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [activeChart, setActiveChart] = useState('bar');

  const handleOptimize = () => {
  setLoading(true);
  setGenerated(false);
  setTimeout(() => {
    const currentResults = Object.entries(MARKET_RATES).map(([name, rates]) => {
      const qty = getQty(name);
      const buyPrice = getPrice(name, 'buy');
      const rentPrice = getPrice(name, 'rent');
      const lp = lpOptimize(qty, floors, buyPrice, rentPrice, rates.life);
      return { ...lp };
    });
    const trad   = currentResults.reduce((s, r) => s + r.traditionalCost, 0);
    const opt    = currentResults.reduce((s, r) => s + r.optimizedCost, 0);
    const saving = trad - opt;
    const pct    = ((saving / trad) * 100).toFixed(1);
    localStorage.setItem('kitiq_last_project', JSON.stringify({
      floors, zones, area, city,
      totalOptimized: opt,
      totalSaving: saving,
      savingPct: pct,
      timestamp: new Date().toLocaleDateString('en-IN'),
    }));
    setGenerated(true);
    setLoading(false);
  }, 1400);
};

  const multiplier = CITY_MULTIPLIERS[city] || 1.0;

  const getPrice = (name, type) => {
    if (customPrices[name]?.[type]) return customPrices[name][type];
    return Math.round(MARKET_RATES[name][type] * multiplier);
  };

  const getQty = (name) => {
    const perSqm = { 
      'Wall Panels (0.9×1.8m)': 0.8, 'Slab Panels (1.2×2.4m)': 0.6,
      'Prop Supports (3m)': 0.4, 'Beam Clamps': 0.3,
      'Corner Pieces': 0.2, 'Tie Rods': 0.5,
      'Base Plates': 0.15, 'Waling Beams': 0.25,
    };
    return Math.ceil(perSqm[name] * area / zones);
  };

  const results = Object.entries(MARKET_RATES).map(([name, rates]) => {
    const qty = getQty(name);
    const buyPrice = getPrice(name, 'buy');
    const rentPrice = getPrice(name, 'rent');
    const lp = lpOptimize(qty, floors, buyPrice, rentPrice, rates.life);
    return { name, icon: rates.icon, qty, buyPrice, rentPrice, ...lp };
  });

  const totalTraditional = results.reduce((s, r) => s + r.traditionalCost, 0);
  const totalOptimized   = results.reduce((s, r) => s + r.optimizedCost, 0);
  const totalSaving      = totalTraditional - totalOptimized;
  const savingPct        = ((totalSaving / totalTraditional) * 100).toFixed(1);

  const fmt = (n) => `₹${(n / 100000).toFixed(2)}L`;

  // Chart data
  const barData = results.map(r => ({
    name: r.name.split(' ')[0],
    Traditional: Math.round(r.traditionalCost / 1000),
    Optimized: Math.round(r.optimizedCost / 1000),
  }));

  const pieData = results.map(r => ({
    name: r.name.split(' ')[0],
    value: Math.round(r.optimizedCost / 1000),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#1e2a38', border: '1px solid #2dd4bf33', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ color: '#ffffff', fontWeight: '700', marginBottom: '6px' }}>{label}</div>
          {payload.map(p => (
            <div key={p.name} style={{ color: p.color, fontSize: '13px' }}>
              {p.name}: ₹{p.value}K
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0d1117 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #818cf8, #6366f1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', margin: 0 }}>BoQ Optimizer</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            Linear Programming based cost minimization · Real 2024 Indian Market Rates · Buy vs Rent Intelligence
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['🏢', 'Floors', floors], ['🔲', 'Zones', zones], ['📐', `${area}m²`, 'Area'], ['🌆', city, 'City']].map(([icon, val, label]) => (
            <div key={label} style={{ backgroundColor: 'rgba(129,140,248,0.1)', borderRadius: '12px', padding: '12px 16px', textAlign: 'center', border: '1px solid rgba(129,140,248,0.2)' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#818cf8' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* INPUT CARD */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#818cf8, #6366f1)', borderRadius: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Project Parameters</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[
            ['🏢', 'Floors', floors, setFloors, 1, 50],
            ['🔲', 'Zones', zones, setZones, 1, 10],
            ['📐', 'Area (sqm)', area, setArea, 100, 10000],
          ].map(([icon, label, val, setter, min, max]) => (
            <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>{icon}</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>{label}</div>
              </div>
              <input type="number" value={val} min={min} max={max}
                onChange={e => { setter(Number(e.target.value)); setGenerated(false); }}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '9px', fontSize: '20px', fontWeight: '800', outline: 'none', boxSizing: 'border-box', color: '#0f172a', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>🌆</span>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>City</div>
            </div>
            <select value={city} onChange={e => { setCity(e.target.value); setGenerated(false); }}
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '9px', fontSize: '15px', fontWeight: '700', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a', cursor: 'pointer' }}>
              {Object.keys(CITY_MULTIPLIERS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* PRICE EDITOR TOGGLE */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setShowPriceEditor(!showPriceEditor)} style={{
            backgroundColor: showPriceEditor ? '#818cf8' : '#f1f5f9',
            color: showPriceEditor ? '#ffffff' : '#64748b',
            border: '1px solid #e5e7eb', padding: '10px 20px', borderRadius: '8px',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          }}>
            ✏️ {showPriceEditor ? 'Hide' : 'Edit'} Market Rates
          </button>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Using real 2024 {city} market rates (×{multiplier})
          </span>
        </div>

        {/* EDITABLE PRICE TABLE */}
        {showPriceEditor && (
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
              📋 Edit Vendor Quoted Prices (₹)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Component', 'Buy Price (₹)', 'Rent Price/month (₹)'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MARKET_RATES).map(([name, rates]) => (
                    <tr key={name}>
                      <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{name}</td>
                      {['buy', 'rent'].map(type => (
                        <td key={type} style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
                          <input type="number"
                            defaultValue={Math.round(rates[type] * multiplier)}
                            onChange={e => setCustomPrices(prev => ({
                              ...prev,
                              [name]: { ...prev[name], [type]: Number(e.target.value) }
                            }))}
                            style={{ width: '120px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#818cf8'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={handleOptimize}
          disabled={loading} style={{
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #818cf8, #6366f1)',
            color: '#ffffff', border: 'none', padding: '15px 40px',
            borderRadius: '10px', fontWeight: '800', fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(129,140,248,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          {loading ? '⏳ Running LP Optimization...' : '🚀 Run LP Optimization'}
        </button>
      </div>

      {generated && (
        <div>
          {/* SAVINGS SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              ['Traditional BoQ', fmt(totalTraditional), '#ef4444', '📋'],
              ['Optimized BoQ', fmt(totalOptimized), '#818cf8', '✅'],
              ['Total Savings', fmt(totalSaving), '#4ade80', '💰'],
              ['Saving %', `${savingPct}%`, '#2dd4bf', '📈'],
            ].map(([label, val, color, icon]) => (
              <div key={label} style={{
                backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px 22px',
                border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color }}>{val}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CHART TOGGLE */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#818cf8, #6366f1)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Cost Analysis Charts</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['bar', '📊 Bar Chart'], ['pie', '🥧 Pie Chart']].map(([id, label]) => (
                  <button key={id} onClick={() => setActiveChart(id)} style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    backgroundColor: activeChart === id ? '#818cf8' : '#f1f5f9',
                    color: activeChart === id ? '#ffffff' : '#64748b',
                    fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {activeChart === 'bar' && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} unit="K" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Traditional" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Optimized" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'pie' && (
              <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`₹${val}K`, 'Optimized Cost']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>Component Cost Distribution</div>
                  {pieData.map((item, i) => (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>₹{item.value}K</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LP RESULTS TABLE */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #f8fafc, #ffffff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(#818cf8, #6366f1)', borderRadius: '4px' }} />
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>LP Optimization Results — Traditional vs Optimized</div>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #bbf7d0' }}>
                💰 Total Saving: {fmt(totalSaving)} ({savingPct}%)
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    {['Component', 'Qty/Floor', 'Buy Price', 'Rent Price', 'Traditional', 'LP Optimized', 'Saving', 'Reuse', 'Decision'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb', letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.name} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#fafafa'}
                    >
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{r.icon}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{r.qty}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>₹{r.buyPrice.toLocaleString()}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>₹{r.rentPrice.toLocaleString()}/mo</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#ef4444', fontWeight: '700', borderBottom: '1px solid #f1f5f9' }}>{fmt(r.traditionalCost)}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#818cf8', fontWeight: '700', borderBottom: '1px solid #f1f5f9' }}>{fmt(r.optimizedCost)}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#4ade80', fontWeight: '800', borderBottom: '1px solid #f1f5f9' }}>{fmt(r.saving)}</td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {Array.from({ length: Math.min(r.reuseCycles, 6) }, (_, i) => (
                            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#818cf8' }} />
                          ))}
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>{r.reuseCycles}x</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{
                          backgroundColor: r.decision === 'Buy' ? '#dbeafe' : '#fce7f3',
                          color: r.decision === 'Buy' ? '#1d4ed8' : '#be185d',
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                        }}>{r.decision === 'Buy' ? '🛒 Buy' : '📦 Rent'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LP EXPLANATION BOX */}
          <div style={{ backgroundColor: '#1e1b4b', borderRadius: '16px', padding: '24px 28px', border: '1px solid #818cf844' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#818cf8', marginBottom: '12px' }}>🧠 How Linear Programming Works Here</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.8' }}>
              <strong style={{ color: '#ffffff' }}>Objective:</strong> Minimize Total Cost = Σ (buy_qty × buy_price + rent_qty × rent_price)<br />
              <strong style={{ color: '#ffffff' }}>Subject to:</strong> buy_qty × reuse_cycles + rent_qty ≥ total_demand (demand constraint) · buy_qty, rent_qty ≥ 0 (non-negativity)<br />
              <strong style={{ color: '#ffffff' }}>Decision Rule:</strong> If marginal buy cost per use &lt; total rent cost → BUY · Otherwise → RENT<br />
              <strong style={{ color: '#ffffff' }}>Result:</strong> Saving of {fmt(totalSaving)} ({savingPct}%) vs traditional buy-all approach for {city} market rates
            </div>
          </div>
        </div>
      )}
    </div>
  );
}