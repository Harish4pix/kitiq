import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (email === 'admin@kitiq.in' && password === 'kitiq123') {
      localStorage.setItem('kitiq_auth', 'true');
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Try admin@kitiq.in / kitiq123');
    }
  };

  const handleDemo = () => {
    localStorage.setItem('kitiq_auth', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="page-animate" style={{
      minHeight: '100vh', backgroundColor: '#0d1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      background: 'radial-gradient(ellipse at 50% 50%, #0a2a2a 0%, #0d1117 70%)',
    }}>
      <div style={{
        backgroundColor: '#111827', borderRadius: '20px', padding: '16px',
        width: '100%', maxWidth: '440px', border: '1px solid #1e2a38',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        margin: '20px',
      }}>

        {/* CLOSE BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: '22px', cursor: 'pointer', lineHeight: 1,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#ffffff'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >✕</button>
        </div>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
            borderRadius: '14px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '900', color: '#0d1117',
            fontSize: '26px', margin: '0 auto 14px',
          }}>K</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>
            Kit<span style={{ color: '#2dd4bf' }}>IQ</span>
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #1e2a38', marginBottom: '28px'
        }}>
          {['signin', 'register'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '12px', background: 'none', border: 'none',
              color: activeTab === tab ? '#2dd4bf' : '#64748b',
              fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #2dd4bf' : '2px solid transparent',
              transition: 'color 0.2s',
            }}>
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            backgroundColor: '#2d1515', border: '1px solid #ef444444',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
            color: '#f87171', fontSize: '14px',
          }}>{error}</div>
        )}

        {/* EMAIL */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</div>
          <input
            type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', backgroundColor: '#1e2a38',
              border: '1px solid #2a3a4a', borderRadius: '10px', color: '#ffffff',
              fontSize: '15px', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#2dd4bf'}
            onBlur={e => e.target.style.borderColor = '#2a3a4a'}
          />
        </div>

        {/* PASSWORD */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password</div>
          <input
            type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '14px 16px', backgroundColor: '#1e2a38',
              border: '1px solid #2a3a4a', borderRadius: '10px', color: '#ffffff',
              fontSize: '15px', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#2dd4bf'}
            onBlur={e => e.target.style.borderColor = '#2a3a4a'}
          />
        </div>

        {/* FORGOT */}
        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <span style={{ color: '#2dd4bf', fontSize: '14px', cursor: 'pointer' }}>Forgot password?</span>
        </div>

        {/* SIGN IN BUTTON */}
        <button onClick={handleLogin} style={{
          width: '100%', padding: '15px',
          background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
          color: '#0d1117', border: 'none', borderRadius: '10px',
          fontWeight: '800', fontSize: '16px', cursor: 'pointer',
          marginBottom: '12px', transition: 'opacity 0.2s, transform 0.2s',
          letterSpacing: '0.3px',
        }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >Sign In</button>

        {/* DEMO BUTTON */}
        <button onClick={handleDemo} style={{
          width: '100%', padding: '15px',
          backgroundColor: '#1e2a38',
          color: '#ffffff', border: '1px solid #2a3a4a',
          borderRadius: '10px', fontWeight: '700', fontSize: '16px',
          cursor: 'pointer', marginBottom: '24px', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.target.style.backgroundColor = '#2a3a4a'}
          onMouseLeave={e => e.target.style.backgroundColor = '#1e2a38'}
        >Continue in Demo Mode</button>

        {/* BOTTOM LINK */}
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Don't have an account?{' '}
          <span onClick={() => setActiveTab('register')} style={{ color: '#2dd4bf', cursor: 'pointer', fontWeight: '600' }}>
            Create one
          </span>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: '28px', color: '#334155', fontSize: '12px' }}>
          Developed by Team Titan
        </div>
      </div>
    </div>
  );
}

export default LoginPage;