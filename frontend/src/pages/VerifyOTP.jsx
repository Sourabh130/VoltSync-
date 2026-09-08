import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify', { email, otp });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Verify Your Email</h2>
      <p>We sent a 6-digit code to <strong>{email}</strong></p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input type="text" placeholder="Enter OTP" required maxLength="6"
          onChange={(e) => setOtp(e.target.value)} 
          style={{ padding: '10px', textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '5px' }}>
          Verify Account
        </button>
      </form>
      {message && <p style={{ color: message.includes('success') ? 'green' : 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
};

export default VerifyOTP;