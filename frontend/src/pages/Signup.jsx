import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'driver' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      setMessage(res.data.message);
      setTimeout(() => navigate('/verify', { state: { email: formData.email } }), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error signing up');
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Join VoltSync</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Create an account to get started.</p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', backgroundColor: '#f1f2f6', padding: '5px', borderRadius: '10px' }}>
          <button type="button" onClick={() => setFormData({...formData, role: 'driver'})}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
            backgroundColor: formData.role === 'driver' ? '#fff' : 'transparent', color: formData.role === 'driver' ? '#2c3e50' : '#7f8c8d', boxShadow: formData.role === 'driver' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none' }}>
            EV Driver
          </button>
          <button type="button" onClick={() => setFormData({...formData, role: 'host'})}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
            backgroundColor: formData.role === 'host' ? '#fff' : 'transparent', color: formData.role === 'host' ? '#2c3e50' : '#7f8c8d', boxShadow: formData.role === 'host' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none' }}>
            Station Host
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="email" placeholder="Email Address" required 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px', outline: 'none' }} />
          <input type="password" placeholder="Create Password" required 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px', outline: 'none' }} />
          <button type="submit" style={{ padding: '15px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Create Account
          </button>
        </form>
        
        {message && <p style={{ color: '#18bc9c', marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
        <p style={{ marginTop: '25px', color: '#7f8c8d' }}>Already have an account? <Link to="/login" style={{ color: '#18bc9c', fontWeight: 'bold', textDecoration: 'none' }}>Login here</Link></p>
      </div>
    </div>
  );
};

export default Signup;