import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterStation = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', address: '', lat: '23.2599', lng: '77.4126', plugType: 'CCS2', powerOutput: '50', hourlyRate: '250',
    totalPorts: 2
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      alert("Please login first to register a charging station.");
      navigate('/login');
    } else if (role !== 'host' && role !== 'admin') {
      alert("Station registration is reserved for Station Hosts and Administrators. Please switch your account role or sign up as a Host.");
      navigate('/profile');
    }
  }, [navigate]);

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({ 
            ...formData, 
            lat: position.coords.latitude.toFixed(6), 
            lng: position.coords.longitude.toFixed(6) 
          });
          alert("📍 Location captured successfully!");
        }, 
        () => alert("Could not fetch GPS automatically. Demo coordinates set.")
      );
    } else {
      alert("Geolocation not supported on this device.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submissionData = { 
        ...formData, 
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        powerOutput: Number(formData.powerOutput),
        hourlyRate: Number(formData.hourlyRate),
        totalPorts: Number(formData.totalPorts),
        availablePorts: Number(formData.totalPorts) 
      };
      
      const res = await axios.post('http://localhost:5000/api/stations/register', submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      setStep(3); 
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering station.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '520px' }}>
        
        {/* STEP PROGRESS BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
          <div style={{ height: '4px', background: '#eee', position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 1 }}></div>
          <div style={{ height: '4px', background: '#18bc9c', position: 'absolute', top: '50%', left: 0, width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', zIndex: 2, transition: '0.4s' }}></div>
          {[1, 2, 3].map(num => (
            <div key={num} style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= num ? '#18bc9c' : '#eee', color: step >= num ? 'white' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 3 }}>
              {num}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Step 1: Station Location</h2>
            <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '0 0 20px 0' }}>Provide the physical address where EV drivers will plug in.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Station Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., MP Nagar Fast Charger Hub" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Street Address</label>
                <input 
                  type="text" 
                  placeholder="e.g., Zone-II, MP Nagar, Bhopal" 
                  required 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Latitude</label>
                  <input type="number" step="any" placeholder="Latitude" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Longitude</label>
                  <input type="number" step="any" placeholder="Longitude" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleGetLocation} 
                style={{ padding: '11px', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                📍 Auto-detect GPS Coordinates
              </button>

              <button 
                onClick={() => {
                  if (!formData.name || !formData.address) {
                    return alert("Please enter station name and address.");
                  }
                  setStep(2);
                }} 
                style={btnStyle}
              >
                Next: Hardware & Tariff ➔
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Step 2: Hardware & Pricing</h2>
            <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '0 0 20px 0' }}>Set connector standard, capacity, and hourly tariff.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Plug Standard</label>
                <select value={formData.plugType} onChange={(e) => setFormData({ ...formData, plugType: e.target.value })} style={inputStyle}>
                  <option value="CCS2">CCS2 (DC Fast Charger)</option>
                  <option value="Type 2">Type 2 (AC Normal)</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="15 Amp Socket">Standard 15 Amp Socket</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Power Output (kW)</label>
                  <input type="number" required min="3" max="350" value={formData.powerOutput} onChange={(e) => setFormData({ ...formData, powerOutput: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Number of Ports</label>
                  <input type="number" required min="1" max="20" value={formData.totalPorts} onChange={(e) => setFormData({ ...formData, totalPorts: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Hourly Rate (₹/hr)</label>
                <input type="number" required min="20" max="2000" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} style={inputStyle} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ ...btnStyle, background: '#95a5a6', flex: 1 }}>Back</button>
                <button type="submit" disabled={loading} style={{ ...btnStyle, flex: 2 }}>
                  {loading ? 'Submitting...' : 'Submit Station Registration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>🛡️</div>
            <h2 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Submission Received!</h2>
            <div style={{ color: '#f39c12', fontWeight: 'bold', padding: '10px 15px', backgroundColor: '#fcf3cf', borderRadius: '8px', display: 'inline-block', marginBottom: '15px' }}>
              Status: Pending Verification
            </div>
            <p style={{ color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6', margin: '0 0 25px 0' }}>
              {message || 'Our administrator team will review your station specifications to verify compliance with the Madhya Pradesh EV Policy 2025. Once approved, your station will go live instantly on the VoltSync map.'}
            </p>
            <button onClick={() => navigate('/profile')} style={btnStyle}>
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const inputStyle = { 
  width: '100%', 
  padding: '12px', 
  borderRadius: '8px', 
  border: '1px solid #dfe6e9', 
  fontSize: '14px', 
  outline: 'none', 
  boxSizing: 'border-box' 
};

const btnStyle = { 
  width: '100%',
  padding: '13px', 
  backgroundColor: '#18bc9c', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  fontSize: '15px', 
  fontWeight: 'bold', 
  cursor: 'pointer' 
};

export default RegisterStation;
