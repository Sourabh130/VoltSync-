import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  // Sync state whenever the route changes or storage event fires
  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
  }, [location]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of VoltSync?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setToken(null);
      setRole(null);
      navigate('/login');
    }
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '12px 30px', 
      backgroundColor: '#2c3e50', 
      color: 'white', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h2 style={{ margin: 0 }}>
          <Link to="/" style={{ color: '#18bc9c', textDecoration: 'none', fontWeight: '800', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> VoltSync
          </Link>
        </h2>
        <span style={{ fontSize: '11px', backgroundColor: 'rgba(24, 188, 156, 0.2)', color: '#18bc9c', padding: '3px 8px', borderRadius: '12px', border: '1px solid #18bc9c' }}>
          EV Smart Grid
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontWeight: '500', fontSize: '15px' }}>
        <Link to="/" style={{ color: '#ecf0f1', textDecoration: 'none', transition: '0.2s' }}>
          🗺️ Live Map
        </Link>
        
        <Link to="/verify-arrival" style={{ color: '#ecf0f1', textDecoration: 'none', transition: '0.2s' }}>
          📷 QR Scanner
        </Link>

        {role === 'host' && (
          <Link to="/register-station" style={{ color: '#ecf0f1', textDecoration: 'none', transition: '0.2s' }}>
            ➕ Add Station
          </Link>
        )}

        {role === 'admin' && (
          <Link to="/admin" style={{ 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            textDecoration: 'none', 
            fontWeight: 'bold', 
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(231, 76, 60, 0.4)'
          }}>
            🛡️ Admin Panel
          </Link>
        )}
        
        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/profile" style={{ 
              backgroundColor: '#18bc9c', 
              color: 'white', 
              padding: '7px 18px', 
              borderRadius: '20px', 
              textDecoration: 'none', 
              fontWeight: 'bold', 
              fontSize: '14px',
              boxShadow: '0 4px 8px rgba(24, 188, 156, 0.3)' 
            }}>
              👤 {role === 'admin' ? 'Admin Profile' : role === 'host' ? 'Host Dashboard' : 'My Profile'}
            </Link>

            <button 
              onClick={handleLogout}
              title="Log out of account"
              style={{
                backgroundColor: 'transparent',
                color: '#e74c3c',
                border: '1px solid #e74c3c',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: '0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e74c3c'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#e74c3c'; }}
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/login" style={{ color: '#ecf0f1', textDecoration: 'none', padding: '6px 12px' }}>
              Login
            </Link>
            <Link to="/signup" style={{ 
              backgroundColor: '#18bc9c', 
              color: 'white', 
              padding: '7px 18px', 
              borderRadius: '20px', 
              textDecoration: 'none', 
              fontWeight: 'bold', 
              fontSize: '14px',
              boxShadow: '0 4px 8px rgba(24, 188, 156, 0.3)' 
            }}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
