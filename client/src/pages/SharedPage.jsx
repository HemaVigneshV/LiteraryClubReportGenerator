import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiLink } from 'react-icons/fi';

export default function SharedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code') || '';
  const [code, setCode] = useState(codeFromUrl);
  const [error, setError] = useState('');

  // If code came from URL, redirect immediately to editor in shared mode
  if (codeFromUrl) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div className="card" style={{ maxWidth: 400, padding: 32, textAlign: 'center' }}>
          <FiLink style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)', marginBottom: 8 }}>Opening Shared Report</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Redirecting to the report editor...</p>
          <button className="btn btn-primary" onClick={() => navigate(`/report/new?share=${codeFromUrl}`)}>
            Open Report <FiArrowRight />
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter a share code'); return; }
    navigate(`/report/new?share=${code.trim()}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
      <div className="card" style={{ maxWidth: 420, padding: 40, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <FiLink style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: 12 }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)', fontSize: '1.5rem', marginBottom: 6 }}>Access Shared Report</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter the share code to view and edit a report</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="login-error">{error}</div>}
          <input className="form-input" placeholder="Enter share code (e.g. A1B2C3D4)"
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: 3, fontFamily: 'monospace', fontWeight: 700 }} />
          <button type="submit" className="btn btn-primary btn-lg">
            <FiArrowRight /> Open Report
          </button>
        </form>
      </div>
    </div>
  );
}
