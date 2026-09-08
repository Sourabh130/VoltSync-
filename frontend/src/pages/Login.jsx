import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      // Force a window reload to update the Navbar state instantly
      window.location.href = '/'; 
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging in');
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Welcome Back</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Sign in to access VoltSync</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="email" placeholder="Email Address" required 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px', outline: 'none' }} />
            
          <input type="password" placeholder="Password" required 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px', outline: 'none' }} />
            
          <button type="submit" style={{ padding: '15px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            Login
          </button>
        </form>
        
        {error && <p style={{ color: '#e74c3c', marginTop: '15px', fontWeight: '500' }}>{error}</p>}
        <p style={{ marginTop: '25px', color: '#7f8c8d' }}>Don't have an account? <Link to="/signup" style={{ color: '#2c3e50', fontWeight: 'bold', textDecoration: 'none' }}>Sign up here</Link></p>
      </div>
    </div>
  );
};

export default Login;