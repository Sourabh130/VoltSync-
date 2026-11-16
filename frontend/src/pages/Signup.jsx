import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'driver', city: 'Bhopal, MP' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      setMessage(res.data.message);
      
      setTimeout(() => {
        navigate('/verify', { state: { email: formData.email } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚡</div>
        <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Join VoltSync</h2>
        <p style={{ color: '#7f8c8d', margin: '0 0 20px 0', fontSize: '14px' }}>Smart EV Charging & Decentralized Power Hub</p>
        
        {/* ROLE SELECTOR */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#f1f2f6', padding: '4px', borderRadius: '10px' }}>
          <button 
            type="button" 
            onClick={() => setFormData({ ...formData, role: 'driver' })}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '13px',
              backgroundColor: formData.role === 'driver' ? '#fff' : 'transparent', 
              color: formData.role === 'driver' ? '#2c3e50' : '#7f8c8d', 
              boxShadow: formData.role === 'driver' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' 
            }}
          >
            🚗 EV Driver
          </button>
          <button 
            type="button" 
            onClick={() => setFormData({ ...formData, role: 'host' })}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '13px',
              backgroundColor: formData.role === 'host' ? '#fff' : 'transparent', 
              color: formData.role === 'host' ? '#2c3e50' : '#7f8c8d', 
              boxShadow: formData.role === 'host' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' 
            }}
          >
            🔌 Station Host
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            style={inputStyle} 
          />
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
            placeholder="Create Password" 
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
              backgroundColor: '#2c3e50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '15px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        {message && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f8f5', color: '#18bc9c', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fde8e8', color: '#e74c3c', borderRadius: '8px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <p style={{ marginTop: '20px', color: '#7f8c8d', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: '#18bc9c', fontWeight: 'bold', textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle = { 
  padding: '13px', 
  borderRadius: '8px', 
  border: '1px solid #dfe6e9', 
  fontSize: '15px', 
  outline: 'none',
  boxSizing: 'border-box'
};

export default Signup;
