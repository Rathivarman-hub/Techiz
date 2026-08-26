import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
    <div style={{ fontSize: '6rem', marginBottom: 16 }}>404</div>
    <h1 style={{ fontSize: '4rem', fontWeight: 900, background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
    <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 12 }}>Page Not Found</h2>
    <p style={{ color: 'var(--text-muted)', marginBottom: 32, maxWidth: 400 }}>The page you are looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn-techiz" style={{ fontSize: '1rem', padding: '12px 28px' }}>Back to Home</Link>
  </div>
);

export default NotFoundPage;
