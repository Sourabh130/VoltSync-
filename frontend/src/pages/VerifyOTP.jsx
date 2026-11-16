import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify', { email, otp });
      setMessage(res.data.message || 'Email verified successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📧</div>
        <h2 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Verify Your Email</h2>
        <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '25px' }}>
          Enter the 6-digit verification code sent to your email<br/>
          <strong style={{ color: '#2c3e50' }}>{email || 'your registered address'}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            required 
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)} 
            style={{ 
              padding: '14px', 
              textAlign: 'center', 
              letterSpacing: '6px', 
              fontSize: '22px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '1px solid #dfe6e9',
              outline: 'none',
              color: '#2c3e50'
            }} 
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
              fontSize: '15px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Verifying...' : 'Verify Account'}
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
      </div>
    </div>
  );
};

export default VerifyOTP;
