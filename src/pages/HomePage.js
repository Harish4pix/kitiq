import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Scroll animation hook
function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    setTimeout(() => {
      document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    }, 300);
    return () => observer.disconnect();
  }, []);
}

function HomePage() {
  const navigate = useNavigate();
  useScrollAnimation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="page-animate" style={{ fontFamily: "'Segoe UI', sans-serif", overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0 24px' : '0 150px', height: '72px',
        backgroundColor: scrolled ? 'rgba(13,17,23,0.97)' : '#0d1117',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        borderBottom: '1px solid #1e2a38', backdropFilter: 'blur(12px)',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
            borderRadius: '9px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '900', color: '#0d1117', fontSize: '20px'
          }}>K</div>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
            Kit<span style={{ color: '#2dd4bf' }}>IQ</span>
          </span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '40px' }}>
            {['Features', 'How it Works', 'Solution', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} style={{
                color: '#94a3b8', textDecoration: 'none', fontSize: '16px', fontWeight: '500',
              }}
                onMouseEnter={e => e.target.style.color = '#2dd4bf'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{item}</a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
            color: '#0d1117', border: 'none', padding: '11px 28px',
            borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '16px',
          }}>Sign In</button>
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: 'none', border: 'none', color: '#fff', fontSize: '26px', cursor: 'pointer'
            }}>☰</button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: '72px', left: 0, right: 0, zIndex: 999,
          backgroundColor: '#111827', borderBottom: '1px solid #1e2a38',
          padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          {['Features', 'How it Works', 'Solution', 'Contact'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMenuOpen(false)}
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '17px', fontWeight: '500' }}
            >{item}</a>
          ))}
        </div>
      )}

      {/* HERO */}
      <section style={{
        background: 'radial-gradient(ellipse at 70% 50%, #0a2a2a 0%, #0d1117 60%)',
        padding: isMobile ? '130px 24px 90px' : '150px 64px 110px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '20px', minHeight: '100vh', flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        <div style={{ maxWidth: '790px', flex: 1, paddingLeft: isMobile ? '0px' : '60px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#0a2a2a', color: '#2dd4bf',
            padding: '9px 18px', borderRadius: '24px', fontSize: '14px',
            fontWeight: '600', marginBottom: '30px', border: '1px solid #2dd4bf44',
          }}>
            <span style={{ width: '8px', height: '8px', background: '#2dd4bf', borderRadius: '50%', display: 'inline-block' }} />
            AI-Powered Formwork Intelligence
          </div>
          <h1 style={{
            fontSize: isMobile ? '40px' : '58px', fontWeight: '900', lineHeight: '1.1',
            marginBottom: '24px', color: '#ffffff', letterSpacing: '-1.5px'
          }}>
            Automate Formwork<br />
            <span style={{ color: '#2dd4bf' }}>Kitting & BoQ</span><br />
            Optimization
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.8', marginBottom: '40px' }}>
            Eliminate inventory waste and cost overruns. Our data-driven platform automates
            formwork kitting, optimizes Bill of Quantities, and maximizes repetition cycles
            for construction projects.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{
              background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
              color: '#0d1117', border: 'none', padding: '16px 38px',
              borderRadius: '9px', fontWeight: '800', cursor: 'pointer', fontSize: '17px',
              boxShadow: '0 4px 24px rgba(45,212,191,0.3)', transition: 'transform 0.2s',
            }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >Get Started →</button>
            <button style={{
              backgroundColor: 'transparent', color: '#ffffff',
              border: '2px solid #2dd4bf55', padding: '16px 38px',
              borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '17px',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.target.style.borderColor = '#2dd4bf'}
              onMouseLeave={e => e.target.style.borderColor = '#2dd4bf55'}
            >Learn More</button>
          </div>
          <div style={{ display: 'flex', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
            {[['✅', '30% Cost Reduction'], ['⚡', 'Real-time Analytics'], ['🔁', 'Max Reuse Cycles']].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <span style={{ fontSize: '17px' }}>{icon}</span>
                <span style={{ color: '#94a3b8' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {!isMobile && (
          <div style={{
            backgroundColor: '#111827', borderRadius: '20px', padding: '30px',
            width: '340px', flexShrink: 0, border: '1px solid #1e2a38',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <div style={{ display: 'flex', gap: '7px', marginBottom: '22px' }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c }} />
              ))}
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #0a2a2a, #0d1117)',
              borderRadius: '12px', padding: '22px', marginBottom: '18px',
              border: '1px solid #2dd4bf22'
            }}>
              <div style={{ color: '#64748b', fontSize: '11px', letterSpacing: '2px', marginBottom: '10px' }}>OPTIMIZATION RESULT</div>
              <div style={{ color: '#2dd4bf', fontSize: '38px', fontWeight: '900' }}>₹24.5L</div>
              <div style={{ color: '#4ade80', fontSize: '14px', marginTop: '6px' }}>↑ Cost Saved This Project</div>
            </div>
            {[['Panels Reused', '87%', '#2dd4bf'], ['BoQ Accuracy', '96%', '#818cf8'], ['Inventory Reduced', '34%', '#fb923c']].map(([label, val, color]) => (
              <div key={label} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>{label}</span>
                  <span style={{ color, fontSize: '14px', fontWeight: '700' }}>{val}</span>
                </div>
                <div style={{ backgroundColor: '#1e2a38', borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
                  <div style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, width: val, height: '7px', borderRadius: '6px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CHALLENGES */}
      <section style={{ backgroundColor: '#f8fafc', padding: isMobile ? '70px 24px' : '100px 64px', textAlign: 'center' }}>
        <div style={{ color: '#e879a0', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', marginBottom: '16px' }}>CHALLENGES</div>
        <h2 style={{ fontSize: isMobile ? '36px' : '50px', fontWeight: '900', color: '#0f2d1f', marginBottom: '20px', letterSpacing: '-1px' }}>
          THE COMPLEXITY<br />OF FORMWORK
        </h2>
        <p style={{ color: '#64748b', fontSize: '18px', maxWidth: '600px', margin: '0 auto 60px', lineHeight: '1.75' }}>
          Formwork contributes 7–10% of total construction cost. Inefficiencies in kitting,
          repetition planning, and BoQ lead to excess inventory and cost overruns.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '22px', flexWrap: 'wrap' }}>
          {[['💰', 'Cost Overruns'], ['📦', 'Excess Inventory'], ['🔄', 'Poor Repetition'], ['📋', 'Manual BoQ'], ['⏱️', 'Schedule Delays'], ['📊', 'No Analytics']].map(([icon, label]) => (
            <div key={label} style={{
              backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 22px',
              width: '155px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'center',
              border: '1px solid #f1f5f9', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.13)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
<section id="features" className="scroll-animate" style={{ backgroundColor: '#f1f5f9', padding: isMobile ? '70px 24px' : '100px 64px', textAlign: 'center' }}>
  <div style={{ color: '#e879a0', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', marginBottom: '16px' }}>PLATFORM FEATURES</div>
  <h2 style={{ fontSize: isMobile ? '36px' : '50px', fontWeight: '900', color: '#0f2d1f', marginBottom: '56px', letterSpacing: '-1px' }}>
    EVERYTHING YOU NEED<br />TO OPTIMIZE
  </h2>
  <div style={{ display: 'flex', justifyContent: 'center', gap: '26px', flexWrap: 'wrap' }}>
    {[
      ['📋', 'Automated Kitting', 'Auto-generate formwork kit lists per floor and zone instantly.'],
      ['📊', 'BoQ Optimization', 'Minimize procurement costs with AI-powered Bill of Quantities.'],
      ['🔁', 'Repetition Planner', 'Maximize formwork reuse across floors to cut inventory costs.'],
      ['📅', 'Schedule Dashboard', 'Link formwork needs to project timelines in real-time.'],
    ].map(([icon, title, desc], i) => (
      <div key={title}
        className={`scroll-animate scroll-animate-d${i + 1}`}
        style={{
          backgroundColor: '#ffffff', borderRadius: '18px', padding: '36px 28px',
          width: '240px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'left',
          border: '1px solid #f1f5f9', cursor: 'default',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
      >
        <div style={{ fontSize: '38px', marginBottom: '18px' }}>{icon}</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>{title}</div>
        <div style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7' }}>{desc}</div>
      </div>
    ))}
  </div>
</section>

{/* HOW IT WORKS */}
<section id="how-it-works" className="scroll-animate" style={{ backgroundColor: '#0f2d1f', padding: isMobile ? '70px 24px' : '100px 64px', textAlign: 'center' }}>
  <div style={{ color: '#2dd4bf', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', marginBottom: '16px' }}>OUR PROCESS</div>
  <h2 style={{ fontSize: isMobile ? '36px' : '50px', fontWeight: '900', color: '#ffffff', marginBottom: '56px', letterSpacing: '-1px' }}>
    FOUR STEPS<br />TO EFFICIENCY
  </h2>
  <div style={{ display: 'flex', justifyContent: 'center', gap: '26px', flexWrap: 'wrap' }}>
    {[
      ['1', 'Input Project Data', 'Enter floors, zones, area dimensions and project schedule.'],
      ['2', 'AI Analysis', 'Our engine analyzes layout patterns and identifies reuse opportunities.'],
      ['3', 'Get Optimized BoQ', 'Receive a detailed kit list and optimized Bill of Quantities.'],
      ['4', 'Track & Save', 'Monitor inventory in real-time and track cost savings live.'],
    ].map(([num, title, desc], i) => (
      <div key={num}
        className={`scroll-animate scroll-animate-d${i + 1}`}
        style={{
          backgroundColor: '#1a3d2b', borderRadius: '18px', padding: '36px 28px',
          width: '230px', textAlign: 'left', border: '1px solid #2dd4bf22',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#2dd4bf66'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#2dd4bf22'; }}
      >
        <div style={{
          backgroundColor: '#2dd4bf', color: '#0d1117', width: '40px', height: '40px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '18px', marginBottom: '18px'
        }}>{num}</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '10px' }}>{title}</div>
        <div style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.7' }}>{desc}</div>
      </div>
    ))}
  </div>
</section>

{/* SOLUTION */}
<section id="solution" className="scroll-animate" style={{ backgroundColor: '#f8fafc', padding: isMobile ? '70px 24px' : '100px 64px', textAlign: 'center' }}>
  <div style={{ color: '#e879a0', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', marginBottom: '16px' }}>THE SOLUTION</div>
  <h2 style={{ fontSize: isMobile ? '36px' : '50px', fontWeight: '900', color: '#0f2d1f', marginBottom: '56px', letterSpacing: '-1px' }}>
    UNLOCK TANGIBLE<br />BUSINESS VALUE
  </h2>
  <div style={{ display: 'flex', justifyContent: 'center', gap: '26px', flexWrap: 'wrap' }}>
    {[
      ['💰', 'Minimize Costs', 'Prevent over-stocking and leverage smart procurement insights.'],
      ['✅', 'Avoid Wastage', 'Ensure formwork is available when needed, eliminating delays.'],
      ['⚡', 'Improve Efficiency', 'Streamline your formwork supply chain and reduce manual planning.'],
      ['📈', 'Enhance Decisions', 'Make strategic choices with confidence, backed by reliable data.'],
    ].map(([icon, title, desc], i) => (
      <div key={title}
        className={`scroll-animate scroll-animate-d${i + 1}`}
        style={{
          backgroundColor: '#ffffff', borderRadius: '18px', padding: '36px 28px',
          width: '230px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'left',
          border: '1px solid #f1f5f9',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
      >
        <div style={{
          width: '50px', height: '50px', backgroundColor: '#f0fdf4',
          borderRadius: '14px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '26px', marginBottom: '18px'
        }}>{icon}</div>
        <div style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>{title}</div>
        <div style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7' }}>{desc}</div>
      </div>
    ))}
  </div>
</section>

{/* CONTACT */}
<section id="contact" className="scroll-animate" style={{ backgroundColor: '#f8fafc', padding: isMobile ? '70px 24px' : '100px 64px' }}>
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    maxWidth: '960px', margin: '0 auto', gap: '56px',
    flexDirection: isMobile ? 'column' : 'row'
  }}>
    <div style={{ flex: 1 }} className="scroll-animate scroll-animate-d1">
      <div style={{ color: '#e879a0', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', marginBottom: '16px' }}>GET IN TOUCH</div>
      <h2 style={{ fontSize: isMobile ? '30px' : '40px', fontWeight: '900', color: '#0f2d1f', marginBottom: '18px', letterSpacing: '-0.5px' }}>
        READY TO OPTIMIZE<br />YOUR PROJECTS?
      </h2>
      <p style={{ color: '#64748b', fontSize: '17px', lineHeight: '1.75', marginBottom: '36px' }}>
        Contact our team to schedule a demo or learn more about how KitIQ is transforming formwork planning.
      </p>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
        <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '18px', fontSize: '17px' }}>Contact Information</div>
        <div style={{ color: '#64748b', fontSize: '15px', marginBottom: '12px' }}>📍 L&T CreaTech Hackathon, India</div>
        <div style={{ color: '#64748b', fontSize: '15px' }}>✉️ team.titan@kitiq.in</div>
      </div>
    </div>
    <div className="scroll-animate scroll-animate-d2" style={{ backgroundColor: '#0f2d1f', borderRadius: '18px', padding: '36px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '18px', flexDirection: isMobile ? 'column' : 'row' }}>
        {[['FIRST NAME', 'John'], ['LAST NAME', 'Devis']].map(([label, ph]) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '7px', letterSpacing: '1px' }}>{label}</div>
            <input placeholder={ph} style={{
              width: '100%', padding: '13px 15px', backgroundColor: '#1a3d2b',
              border: '1px solid #2dd4bf22', borderRadius: '8px', color: '#ffffff',
              fontSize: '15px', outline: 'none', boxSizing: 'border-box',
            }}
              onFocus={e => e.target.style.borderColor = '#2dd4bf88'}
              onBlur={e => e.target.style.borderColor = '#2dd4bf22'}
            />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '7px', letterSpacing: '1px' }}>WORK EMAIL</div>
        <input placeholder="jd@company.com" style={{
          width: '100%', padding: '13px 15px', backgroundColor: '#1a3d2b',
          border: '1px solid #2dd4bf22', borderRadius: '8px', color: '#ffffff',
          fontSize: '15px', outline: 'none', boxSizing: 'border-box',
        }}
          onFocus={e => e.target.style.borderColor = '#2dd4bf88'}
          onBlur={e => e.target.style.borderColor = '#2dd4bf22'}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '7px', letterSpacing: '1px' }}>MESSAGE</div>
        <textarea placeholder="Tell us about your project..." rows={4} style={{
          width: '100%', padding: '13px 15px', backgroundColor: '#1a3d2b',
          border: '1px solid #2dd4bf22', borderRadius: '8px', color: '#ffffff',
          fontSize: '15px', outline: 'none', boxSizing: 'border-box',
          resize: 'vertical', fontFamily: 'inherit',
        }}
          onFocus={e => e.target.style.borderColor = '#2dd4bf88'}
          onBlur={e => e.target.style.borderColor = '#2dd4bf22'}
        />
      </div>
      <button style={{
        backgroundColor: '#e879a0', color: '#ffffff', border: 'none',
        padding: '15px', width: '100%', borderRadius: '9px',
        fontWeight: '700', cursor: 'pointer', fontSize: '16px', letterSpacing: '1px',
      }}
        onMouseEnter={e => e.target.style.backgroundColor = '#db2777'}
        onMouseLeave={e => e.target.style.backgroundColor = '#e879a0'}
      >SEND MESSAGE</button>
    </div>
  </div>
</section>

      {/* FOOTER */}
      <footer style={{
        backgroundColor: '#0d1117', padding: isMobile ? '28px 24px' : '32px 64px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid #1e2a38', flexWrap: 'wrap', gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '30px', height: '30px', background: 'linear-gradient(135deg, #2dd4bf, #0891b2)',
              borderRadius: '7px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '900', color: '#0d1117', fontSize: '15px'
            }}>K</div>
            <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '20px' }}>
              Kit<span style={{ color: '#2dd4bf' }}>IQ</span>
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>AI-Powered Formwork Kitting & BoQ Optimizer</div>
        </div>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Developed by Team Titan</div>
      </footer>

       <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

    </div>
  );
}

export default HomePage;