import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      // Dispatch storage event so navbar updates reactively
      window.dispatchEvent(new Event('storage'));

      // Role-based destination
      if (res.data.role === 'admin') {
        navigate('/admin');
      } else if (res.data.role === 'host') {
        navigate('/profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging into VoltSync.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setFormData({ email: 'admin@voltsync.com', password: 'admin123' });
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚡</div>
        <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Welcome to VoltSync</h2>
        <p style={{ color: '#7f8c8d', margin: '0 0 25px 0', fontSize: '14px' }}>Sign in to access your EV Dashboard or Admin Sector</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            style={inputStyle} 
          />
            
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            style={inputStyle} 
          />
            
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '14px', 
              backgroundColor: '#18bc9c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              boxShadow: '0 4px 10px rgba(24, 188, 156, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        {error && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fde8e8', color: '#e74c3c', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* ADMIN SHORTCUT FOR JURY / DEMO */}
        <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
          <span style={{ fontSize: '12px', color: '#95a5a6', display: 'block', marginBottom: '8px' }}>
            Testing Admin Control Center?
          </span>
          <button 
            type="button" 
            onClick={handleQuickFillAdmin}
            style={{ 
              padding: '8px 14px', 
              backgroundColor: '#f8f9fa', 
              color: '#e74c3c', 
              border: '1px solid #f5c6cb', 
              borderRadius: '6px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            🛡️ Fill Default Admin Credentials
          </button>
        </div>

        <p style={{ marginTop: '20px', color: '#7f8c8d', fontSize: '14px' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#18bc9c', fontWeight: 'bold', textDecoration: 'none' }}>Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle = { 
  padding: '14px', 
  borderRadius: '8px', 
  border: '1px solid #dfe6e9', 
  fontSize: '15px', 
  outline: 'none',
  boxSizing: 'border-box'
};

export default Login;
