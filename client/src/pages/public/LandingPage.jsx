import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import LanguageLogo from '../../components/LanguageLogo';
import { FiAward, FiCheckCircle, FiClock, FiFileText, FiMoon, FiShield, FiTarget, FiTrendingUp, FiZap } from 'react-icons/fi';

const features = [
  { icon: <FiClock />, title: 'Timed Assessments', desc: '30 seconds per question with animated circular countdown and sound effects.' },
  { icon: <FiTarget />, title: 'Random Questions', desc: 'Every learner gets a unique set of 10 questions from a large question bank.' },
  { icon: <FiTrendingUp />, title: 'Live Leaderboard', desc: 'Compare performance across your community with rankings updated in real time.' },
  { icon: <FiAward />, title: 'PDF Certificates', desc: 'Earn and download beautiful certificates upon successful completion.' },
  { icon: <FiShield />, title: 'Assessment Integrity', desc: 'Fullscreen enforcement and tab-switch detection keep assessments fair.' },
  { icon: <FiMoon />, title: 'Dark Mode', desc: 'Easy on the eyes — choose your preferred theme anytime.' },
];

const languages = [
  { key: 'java', name: 'Java', color: '#f89820', desc: 'OOP & Enterprise' },
  { key: 'python', name: 'Python', color: '#3776ab', desc: 'Scripting & AI' },
  { key: 'c', name: 'C', color: '#a8b9cc', desc: 'Systems & Embedded' },
  { key: 'cpp', name: 'C++', color: '#00599c', desc: 'OOP & Performance' },
  { key: 'javascript', name: 'JavaScript', color: '#f7df1e', desc: 'Web & Full-Stack' },
];

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const revealRefs = useRef([]);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addReveal = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  return (
    <>
      {/* ——— HERO ——— */}
      <section className="hero-section">
        {/* Particles */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${-Math.random() * 15}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 2 === 0 ? 'rgba(108,99,255,0.7)' : 'rgba(0,212,170,0.7)',
            }} />
          ))}
        </div>

        <Container style={{ position: 'relative', zIndex: 1 }}>
          <Row className="align-items-center g-5">
            <Col lg={6} className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: 20, padding: '4px 16px', fontSize: '0.8rem', color: '#a8a0ff', fontWeight: 600, letterSpacing: 1 }}>
                  <FiZap /> PROGRAMMING ASSESSMENT PLATFORM
                </span>
              </div>
              <h1 className="hero-title">
                Test Your<br />
                <span className="gradient-text">Programming</span><br />
                Skills Today
              </h1>
              <p className="hero-subtitle" style={{ marginTop: 20, marginBottom: 36 }}>
                Techiz is a next-gen technical assessment platform for building and validating programming skills. Take timed coding assessments, climb the leaderboard, and earn verified certificates.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn-techiz" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                  <FiTarget /> Start Assessment
                </Link>
                <Link to="/leaderboard" className="btn-outline-techiz" style={{ fontSize: '1rem', padding: '14px 32px', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                  <FiAward /> View Leaderboard
                </Link>
              </div>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap' }}>
                {[['5K+', 'Learners'], ['75+', 'Questions'], ['5', 'Languages'], ['100%', 'Free']].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{n}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </Col>

            {/* Floating cards */}
            <Col lg={6} className="d-none d-lg-flex flex-column gap-3">
              {[
                { key: 'java', lang: 'Java', q: 'What is JVM?', type: 'MCQ', score: '8/10' },
                { key: 'python', lang: 'Python', q: 'Output of x[::-1]?', type: 'Output', score: '10/10' },
                { key: 'javascript', lang: 'JavaScript', q: 'typeof null?', type: 'MCQ', score: '9/10' },
              ].map((card, i) => (
                <div key={i} className="floating-card glass-card" style={{ padding: '20px 24px', maxWidth: 380, marginLeft: i % 2 === 0 ? 'auto' : 60 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#fff' }}><LanguageLogo language={card.key} size="sm" style={{ '--language-color': '#fff' }} /> {card.lang}</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(108,99,255,0.3)', padding: '2px 10px', borderRadius: 10, color: '#a8a0ff' }}>{card.type}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0 }}>{card.q}</p>
                  <div style={{ marginTop: 10, color: '#00d4aa', fontWeight: 700, fontSize: '0.9rem' }}><FiCheckCircle /> Score: {card.score}</div>
                </div>
              ))}
            </Col>
          </Row>
        </Container>
      </section>

      {/* ——— FEATURES ——— */}
      <section style={{ padding: '80px 0', background: 'var(--bg-primary)' }}>
        <Container>
          <div ref={addReveal} className="reveal text-center mb-5">
            <h2 className="section-title">Why Choose <span className="gradient-text">Techiz?</span></h2>
            <div className="divider" />
            <p className="section-subtitle mt-3">Everything you need to ace your technical interviews and college assessments.</p>
          </div>
          <Row className="g-4">
            {features.map((f, i) => (
              <Col key={i} md={6} lg={4}>
                <div ref={addReveal} className="reveal techiz-card" style={{ padding: '28px', animationDelay: `${i * 0.1}s` }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{f.icon}</div>
                  <h5 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{f.title}</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ——— LANGUAGES ——— */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <Container>
          <div ref={addReveal} className="reveal text-center mb-5">
            <h2 className="section-title">5 Programming <span className="gradient-text">Languages</span></h2>
            <div className="divider" />
            <p className="section-subtitle mt-3">Choose your language and prove your skills with curated assessments.</p>
          </div>
          <Row className="g-4 justify-content-center">
            {languages.map((lang, i) => (
              <Col key={i} xs={6} sm={4} md={3} lg={2}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <div ref={addReveal} className="reveal lang-card">
                    <LanguageLogo language={lang.key} size="lg" style={{ '--language-color': lang.color }} />
                    <div className="lang-name">{lang.name}</div>
                    <div className="lang-badge">{lang.desc}</div>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ——— CTA ——— */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #6c63ff, #00d4aa)' }}>
        <Container className="text-center">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>Ready to Get Started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: 32 }}>Join thousands of learners already using Techiz.</p>
          <Link to="/register" className="btn-techiz" style={{ background: '#fff', color: '#6c63ff', fontSize: '1.1rem', padding: '14px 36px' }}>
            Create Free Account
          </Link>
        </Container>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="techiz-footer">
        <Container>
          <Row className="g-4 mb-4">
            <Col md={4}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>Techiz</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Next-gen programming assessment platform for building practical skills.</p>
            </Col>
            <Col md={2}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Platform</div>
              {[['Home', '/']].map(([l, h]) => (
                <div key={l}><Link to={h} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'block', marginBottom: 6 }}>{l}</Link></div>
              ))}
            </Col>
            <Col md={2}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Languages</div>
              {['Java', 'Python', 'C', 'C++', 'JavaScript'].map((l) => (
                <div key={l} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 6 }}>{l}</div>
              ))}
            </Col>
            <Col md={4}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Get Started</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn-techiz" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Register</Link>
                <Link to="/login" className="btn-outline-techiz" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Login</Link>
              </div>
            </Col>
          </Row>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} Techiz. Built for people who build with code.
          </div>
        </Container>
      </footer>
    </>
  );
};

export default LandingPage;
