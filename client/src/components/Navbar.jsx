import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiUser, FiMenu } from 'react-icons/fi';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const goHome = () => {
    navigate(user.role === 'admin' ? '/admin' : '/coordinator');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={goHome}>
          <img src="/header-1.png" alt="SAHE" className="navbar-logo" />
          <div className="navbar-brand-text">
            <span className="navbar-title">Report Generator</span>
            <span className="navbar-subtitle">Literary Club</span>
          </div>
        </div>

        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <FiMenu />
        </button>

        <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/shared')} style={{ marginRight: 16 }}>
            Code Entry
          </button>
          <div className="navbar-user">
            <div className="navbar-avatar">
              <FiUser />
            </div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.fullName}</span>
              <span className={`badge badge-${user?.role === 'admin' ? 'approved' : 'pending'}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} id="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
