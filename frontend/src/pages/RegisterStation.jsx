import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterStation = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', address: '', lat: '', lng: '', plugType: 'CCS2', powerOutput: '', hourlyRate: '',
    totalPorts: 2 // NEW: Default to 2 ports
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setFormData({ ...formData, lat: position.coords.latitude, lng: position.coords.longitude });
    }, () => alert("Could not fetch location. Please enter manually."));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Pass totalPorts, and set availablePorts equal to totalPorts initially!
      const submissionData = { ...formData, availablePorts: formData.totalPorts };
      
      const res = await axios.post('http://localhost:5000/api/stations/register', submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      setStep(3); 
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering station');
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '500px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
          <div style={{ height: '4px', background: '#eee', position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 1 }}></div>
          <div style={{ height: '4px', background: '#18bc9c', position: 'absolute', top: '50%', left: 0, width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', zIndex: 2, transition: '0.4s' }}></div>
          {[1, 2, 3].map(num => (
            <div key={num} style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= num ? '#18bc9c' : '#eee', color: step >= num ? 'white' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 3 }}>
              {num}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>Location Details</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Where is your charger located?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Station Name (e.g., My Home Driveway)" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Full Street Address" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="Latitude" value={formData.lat} onChange={(e) => setFormData({...formData, lat: e.target.value})} style={{...inputStyle, flex: 1}} />
                <input type="number" placeholder="Longitude" value={formData.lng} onChange={(e) => setFormData({...formData, lng: e.target.value})} style={{...inputStyle, flex: 1}} />
              </div>
              <button type="button" onClick={handleGetLocation} style={{ padding: '10px', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📍 Auto-detect GPS Coordinates</button>
              <button onClick={() => setStep(2)} style={btnStyle}>Next: Charger Details ➔</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>Hardware & Pricing</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Set your plug specs and hourly rate.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <select value={formData.plugType} onChange={(e) => setFormData({...formData, plugType: e.target.value})} style={inputStyle}>
                <option value="CCS2">CCS2 (DC Fast)</option>
                <option value="Type 2">Type 2 (AC)</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="15 Amp Socket">Standard 15 Amp Socket</option>
              </select>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="Power (kW)" required value={formData.powerOutput} onChange={(e) => setFormData({...formData, powerOutput: e.target.value})} style={{...inputStyle, flex: 1}} />
                {/* NEW: Number of Ports Input */}
                <input type="number" placeholder="Total Ports" required min="1" max="20" value={formData.totalPorts} onChange={(e) => setFormData({...formData, totalPorts: parseInt(e.target.value)})} style={{...inputStyle, flex: 1}} />
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '15px', color: '#7f8c8d', fontWeight: 'bold' }}>₹</span>
                <input type="number" placeholder="Hourly Rate" required value={formData.hourlyRate} onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})} style={{...inputStyle, paddingLeft: '35px', width: '100%'}} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ ...btnStyle, background: '#95a5a6', flex: 1 }}>Back</button>
                <button type="submit" style={{ ...btnStyle, flex: 2 }}>Submit for Review</button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>🛡️</div>
            <h2 style={{ color: '#2c3e50' }}>Submission Received!</h2>
            <p style={{ color: '#f39c12', fontWeight: 'bold', padding: '10px', backgroundColor: '#fcf3cf', borderRadius: '8px', display: 'inline-block' }}>Status: Pending Verification</p>
            <p style={{ color: '#7f8c8d', marginTop: '15px', lineHeight: '1.6' }}>Our admin team will review your station details to ensure it meets the Madhya Pradesh EV Policy 2025 standards. You will be notified once it is live on the VoltSync map.</p>
            <button onClick={() => navigate('/profile')} style={{ ...btnStyle, marginTop: '25px' }}>Return to Dashboard</button>
          </div>
        )}

      </div>
    </div>
  );
};

const inputStyle = { padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px', outline: 'none', boxSizing: 'border-box' };
const btnStyle = { padding: '15px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };

export default RegisterStation;