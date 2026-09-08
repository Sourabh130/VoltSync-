import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'Unknown';
  
  const [history, setHistory] = useState([]);
  const [hostActiveBookings, setHostActiveBookings] = useState([]);
  const [userData, setUserData] = useState(null);
  
  const [showStopModal, setShowStopModal] = useState(null); 
  const [stopReasonType, setStopReasonType] = useState('Hardware Failure / Power Outage');
  const [customReason, setCustomReason] = useState('');

  const [liveVoltage, setLiveVoltage] = useState(230);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchProfileData();
    fetchHistory();
    if (role === 'host') fetchHostActiveBookings();

    // AUTO-SYNC every 5 seconds for a seamless demo
    const pollInterval = setInterval(() => {
      fetchHistory();
      if (role === 'host') fetchHostActiveBookings();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [role]);

  // LIVE TELEMETRY: Clock ticks every 1 second, Voltage bounces every 3 seconds
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000); 
    const voltageInterval = setInterval(() => {
      setLiveVoltage(Math.floor(Math.random() * 12) + 230);
    }, 3000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(voltageInterval);
    };
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` }});
      setUserData(res.data);
    } catch (err) { }
  };

  const fetchHistory = () => {
    if (role === 'driver') {
      const token = localStorage.getItem('token');
      axios.get('http://localhost:5000/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${token}` }})
        .then(res => setHistory(res.data)).catch(err => {});
    }
  };

  const fetchHostActiveBookings = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/bookings/host-active', { headers: { Authorization: `Bearer ${token}` }})
      .then(res => setHostActiveBookings(res.data)).catch(err => {});
  };

  const handleCancelBooking = async (bookingId) => {
    if(!window.confirm("Are you sure you want to cancel? Full refund applies if >30 mins from start.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/bookings/cancel', { bookingId }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`✅ ${res.data.message}`);
      fetchHistory(); 
    } catch (err) {
      alert(`❌ ${err.response?.data?.message || "Error cancelling"}`);
    }
  };

  const handleStopCharging = async (bookingId, stoppedBy) => {
    const token = localStorage.getItem('token');
    
    if (stoppedBy === 'user') {
      if(!window.confirm("WARNING: Stopping early forfeits your remaining slot time. No refund will be issued. Proceed?")) return;
      try {
        const res = await axios.post('http://localhost:5000/api/bookings/stop-charge', 
          { bookingId, stoppedBy: 'user' }, { headers: { Authorization: `Bearer ${token}` } });
        alert(`✅ Session Ended.\nTotal Bill: ₹${res.data.bill}\nRefund: ₹${res.data.refund}`);
        fetchHistory();
      } catch (err) { alert("Error stopping charge."); }
    } 
    else if (stoppedBy === 'host') {
      const finalReason = stopReasonType === 'Other' ? customReason : stopReasonType;
      try {
        const res = await axios.post('http://localhost:5000/api/bookings/stop-charge', 
          { bookingId, stoppedBy: 'host', reason: finalReason }, { headers: { Authorization: `Bearer ${token}` } });
        alert(`✅ Host Override Successful.\nCustomer Billed: ₹${res.data.bill}\nCustomer Refund: ₹${res.data.refund}`);
        setShowStopModal(null);
        fetchHostActiveBookings();
      } catch (err) { alert("Error stopping charge."); }
    }
  };

  if (!userData) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Profile...</div>;
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name.replace(' ', '')}&backgroundColor=c0aede`;

  return (
    <div style={{ minHeight: '80vh', padding: '40px 20px', backgroundColor: '#f4f7f6', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        
        {/* PROFILE HEADER */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img src={avatarUrl} alt="Avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid #18bc9c' }} />
          <div>
            <h1 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '26px' }}>{userData.name}</h1>
            <span style={{ padding: '4px 10px', backgroundColor: '#18bc9c', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{role === 'host' ? 'Station Host' : 'EV Driver'}</span>
          </div>
        </div>

        {/* HOST DASHBOARD */}
        {role === 'host' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '30px' }}>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>Live Station Traffic</h3>
            
            {hostActiveBookings.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>No active vehicles charging at your stations.</p>
            ) : (
              hostActiveBookings.map(item => (
                <div key={item._id} style={{ padding: '15px', border: '1px solid #dfe6e9', borderRadius: '8px', marginBottom: '15px', background: item.status === 'charging' ? '#e8f8f5' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>Date: {item.date} ({item.timeSlot})</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Status: {item.status.toUpperCase()}</p>
                    </div>
                    {item.status === 'charging' && (
                      <button onClick={() => setShowStopModal(item._id)} style={{...actionBtnStyle, backgroundColor: '#e74c3c'}}>⚠️ Emergency Stop</button>
                    )}
                  </div>

                  {/* HOST STOP REASON MODAL */}
                  {showStopModal === item._id && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#fef9e7', borderRadius: '8px', border: '1px solid #f1c40f' }}>
                      <strong style={{ display: 'block', marginBottom: '10px' }}>Select Reason for Eviction (Will prorate refund to driver)</strong>
                      <select value={stopReasonType} onChange={e => setStopReasonType(e.target.value)} style={{ padding: '8px', width: '100%', marginBottom: '10px', borderRadius: '4px' }}>
                        <option>Hardware Failure / Power Outage</option>
                        <option>Station Maintenance Required</option>
                        <option>Emergency Access Needed</option>
                        <option>Other</option>
                      </select>
                      {stopReasonType === 'Other' && (
                         <input type="text" placeholder="Type custom reason..." value={customReason} onChange={e => setCustomReason(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }} />
                      )}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleStopCharging(item._id, 'host')} style={{ padding: '8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Confirm Stop & Refund</button>
                        <button onClick={() => setShowStopModal(null)} style={{ padding: '8px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <button onClick={() => navigate('/register-station')} style={{ padding: '12px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>+ Register New Station</button>
          </div>
        )}

        {/* DRIVER DASHBOARD */}
        {role === 'driver' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>My Charging History</h3>
            
            {history.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>No bookings yet.</p>
            ) : (
              history.map(item => {
                
                // SECONDS TIMER CALCULATION
                let timerDisplay = "00:00";
                if (item.chargingStartTime) {
                  const diffSeconds = Math.max(0, Math.floor((currentTime - new Date(item.chargingStartTime)) / 1000));
                  const mins = Math.floor(diffSeconds / 60);
                  const secs = diffSeconds % 60;
                  timerDisplay = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
                }

                return (
                  <div key={item._id} style={{ padding: '20px', marginBottom: '15px', borderRadius: '8px', border: item.status === 'charging' ? '2px solid #18bc9c' : '1px solid #dfe6e9', backgroundColor: item.status === 'charging' ? '#f4fbf9' : '#fff' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{item.stationName || "VoltSync Station"}</h4>
                        <strong style={{ color: '#7f8c8d' }}>{item.date} | {item.timeSlot}</strong>
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#95a5a6' }}>Escrow: ₹{item.escrowAmount || 265}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span style={{ padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '11px', backgroundColor: item.status === 'charging' ? '#18bc9c' : item.status === 'completed' ? '#95a5a6' : item.status === 'cancelled' ? '#e74c3c' : '#f39c12', color: 'white' }}>
                          {item.status.toUpperCase()}
                        </span>
                        
                        {item.status === 'confirmed' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => navigate('/verify-arrival', { state: { bookingId: item._id } })} style={actionBtnStyle}>📷 Scan QR</button>
                            <button onClick={() => handleCancelBooking(item._id)} style={{...actionBtnStyle, backgroundColor: '#e74c3c'}}>❌ Cancel</button>
                          </div>
                        )}

                        {item.status === 'charging' && (
                          <button onClick={() => handleStopCharging(item._id, 'user')} style={{...actionBtnStyle, backgroundColor: '#e74c3c'}}>🛑 Stop Charge (No Refund)</button>
                        )}
                      </div>
                    </div>

                    {item.status === 'charging' && (
                      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2c3e50', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#18bc9c', fontWeight: 'bold' }}>⚡ LIVE TELEMETRY</span>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}>{liveVoltage} <span style={{fontSize: '14px', color:'#bdc3c7'}}>Volts</span></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', color: '#bdc3c7' }}>Time Elapsed</span>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12', fontFamily: 'monospace' }}>
                            {timerDisplay} <span style={{fontSize: '14px'}}>min:sec</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {(item.status === 'completed' || item.status === 'cancelled') && (
                      <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#fdf2e9', border: '1px solid #fad7a1', borderRadius: '5px', fontSize: '14px' }}>
                        {item.status === 'completed' && <div style={{ marginBottom: '5px', color: '#2c3e50' }}><strong>Final Bill: ₹{item.finalBill}</strong> | Refunded: ₹{item.refundAmount}</div>}
                        {item.status === 'cancelled' && <div style={{ marginBottom: '5px', color: '#2c3e50' }}><strong>Refunded: ₹{item.refundAmount}</strong></div>}
                        
                        {item.stopReason && (
                          <div style={{ color: '#c0392b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>⚠️ Message from Host:</span> <span>{item.stopReason}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const actionBtnStyle = { padding: '8px 12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
export default ProfilePage;