import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiLogIn, FiShield, FiUsers } from 'react-icons/fi';
import './LoginPage.css';

export default function LoginPage() {
  const [role, setRole] = useState('coordinator');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (role === 'admin' && user.role !== 'admin') {
        setError('This account does not have admin privileges');
        setLoading(false);
        return;
      }
      navigate(user.role === 'admin' ? '/admin' : '/coordinator');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel — Hero Image (no text overlay) */}
      <div className="login-hero">
        <img src="/literaryclub.png" alt="Literary Club" className="login-hero-image" />
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="login-brand-icon">
              <img src="/header-1.png" alt="SAHE" />
            </div>
            <h2 className="login-form-title">Welcome Back</h2>
            <p className="login-form-subtitle">Sign in to the Report Generator</p>
          </div>

          {/* Role Tabs */}
          <div className="login-role-tabs">
            <button
              className={`login-role-tab ${role === 'coordinator' ? 'active' : ''}`}
              onClick={() => { setRole('coordinator'); setError(''); }}
              id="tab-coordinator"
            >
              <FiUsers />
              <span>Coordinator</span>
            </button>
            <button
              className={`login-role-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); setError(''); }}
              id="tab-admin"
            >
              <FiShield />
              <span>Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error animate-fade-in">{error}</div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input id="username" type="text" className="form-input"
                  placeholder="Enter your username" value={username}
                  onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input id="password" type="password" className="form-input"
                  placeholder="Enter your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading} id="login-btn">
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Signing in...</>
              ) : (
                <><FiLogIn /> Sign In as {role === 'admin' ? 'Admin' : 'Coordinator'}</>
              )}
            </button>
          </form>

          <div className="login-footer">
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/shared')} style={{ width: '100%', marginBottom: 12 }}>
              <FiUsers style={{ marginRight: 8 }} /> Have a share code? Access Report
            </button>
            <p>Report Generator for Literary Club Events</p>
          </div>
        </div>
      </div>
    </div>
  );
}
