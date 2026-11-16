import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem('role') || 'driver');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Driver states
  const [history, setHistory] = useState([]);

  // Host states
  const [hostActiveBookings, setHostActiveBookings] = useState([]);
  const [myStations, setMyStations] = useState([]);

  // Admin stats
  const [adminStats, setAdminStats] = useState(null);

  // Modals & forms
  const [showStopModal, setShowStopModal] = useState(null); 
  const [stopReasonType, setStopReasonType] = useState('Hardware Failure / Power Outage');
  const [customReason, setCustomReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '', evCount: 1 });

  // Live Telemetry
  const [liveVoltage, setLiveVoltage] = useState(230);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfileData();

    // Auto-sync for active sessions
    const pollInterval = setInterval(() => {
      if (role === 'driver') fetchHistory();
      if (role === 'host') fetchHostActiveBookings();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [role]);

  // Live telemetry clock and voltage fluctuations
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
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
      setRole(res.data.role);
      localStorage.setItem('role', res.data.role);
      setEditForm({
        name: res.data.name || '',
        city: res.data.city || 'Bhopal, MP',
        evCount: res.data.evCount || 1
      });

      if (res.data.role === 'driver') {
        fetchHistory();
      } else if (res.data.role === 'host') {
        fetchHostActiveBookings();
        fetchMyStations();
      } else if (res.data.role === 'admin') {
        fetchAdminOverview();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  };

  const fetchHostActiveBookings = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/bookings/host-active', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHostActiveBookings(res.data))
      .catch(err => console.error(err));
  };

  const fetchMyStations = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/stations/my-stations', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMyStations(res.data))
      .catch(err => console.error(err));
  };

  const fetchAdminOverview = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/stations/all', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAdminStats(res.data.stats))
      .catch(err => console.error(err));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/auth/update', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? Full escrow refund applies if cancelled more than 30 mins before start time.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/bookings/cancel', { bookingId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${res.data.message}`);
      fetchHistory(); 
    } catch (err) {
      alert(`❌ ${err.response?.data?.message || "Error cancelling booking"}`);
    }
  };

  const handleStopCharging = async (bookingId, stoppedBy) => {
    const token = localStorage.getItem('token');
    
    if (stoppedBy === 'user') {
      if (!window.confirm("WARNING: Stopping early ends your charging session. No refund will be issued for remaining time. Proceed?")) return;
      try {
        const res = await axios.post('http://localhost:5000/api/bookings/stop-charge', 
          { bookingId, stoppedBy: 'user' }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`✅ Session Ended.\nTotal Bill: ₹${res.data.bill}\nRefund: ₹${res.data.refund}`);
        fetchHistory();
      } catch (err) { 
        alert("Error stopping charge."); 
      }
    } else if (stoppedBy === 'host') {
      const finalReason = stopReasonType === 'Other' ? customReason : stopReasonType;
      try {
        const res = await axios.post('http://localhost:5000/api/bookings/stop-charge', 
          { bookingId, stoppedBy: 'host', reason: finalReason }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`✅ Host Emergency Stop Successful.\nCustomer Billed: ₹${res.data.bill}\nCustomer Refunded: ₹${res.data.refund}`);
        setShowStopModal(null);
        fetchHostActiveBookings();
      } catch (err) { 
        alert("Error stopping charge."); 
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#7f8c8d' }}>
        ⚡ Loading VoltSync Profile...
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h3>Unable to load profile.</h3>
        <button onClick={() => navigate('/login')} style={{ ...actionBtnStyle, backgroundColor: '#18bc9c', marginTop: '15px' }}>
          Back to Login
        </button>
      </div>
    );
  }

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name || 'User')}&backgroundColor=c0aede`;
  const roleBadgeColor = role === 'admin' ? '#e74c3c' : role === 'host' ? '#3498db' : '#18bc9c';
  const roleLabel = role === 'admin' ? 'System Administrator' : role === 'host' ? 'Station Host' : 'EV Driver';

  return (
    <div style={{ minHeight: '85vh', padding: '40px 20px', backgroundColor: '#f4f7f6', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '850px' }}>
        
        {/* PROFILE HEADER WITH LOGOUT */}
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '16px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)', 
          marginBottom: '25px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img src={avatarUrl} alt="Avatar" style={{ width: '85px', height: '85px', borderRadius: '50%', border: `4px solid ${roleBadgeColor}` }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>{userData.name}</h1>
                <span style={{ 
                  padding: '4px 12px', 
                  backgroundColor: roleBadgeColor, 
                  color: 'white', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: 'bold' 
                }}>
                  {roleLabel}
                </span>
              </div>
              <p style={{ margin: '0 0 4px 0', color: '#7f8c8d', fontSize: '14px' }}>✉️ {userData.email}</p>
              <p style={{ margin: 0, color: '#95a5a6', fontSize: '13px' }}>📍 {userData.city || 'Bhopal, MP'} • {userData.evCount || 1} EV Registered</p>
            </div>
          </div>

          {/* ACTIONS: EDIT PROFILE & LOGOUT */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '9px 16px',
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ✏️ {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>

            <button 
              onClick={handleLogout}
              style={{
                padding: '9px 18px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* EDIT PROFILE DRAWER */}
        {isEditing && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Edit Profile Information</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                  style={inputStyle} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>City / State</label>
                  <input 
                    type="text" 
                    value={editForm.city} 
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })} 
                    style={inputStyle} 
                    required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>EV Count</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={editForm.evCount} 
                    onChange={e => setEditForm({ ...editForm, evCount: Number(e.target.value) })} 
                    style={inputStyle} 
                    required 
                  />
                </div>
              </div>
              <button type="submit" style={{ ...actionBtnStyle, backgroundColor: '#18bc9c', padding: '12px', fontSize: '14px', marginTop: '5px' }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

        {/* 1. ADMIN DASHBOARD VIEW */}
        {role === 'admin' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>🛡️ Administrator Overview</h3>
                <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Full access to review stations, configure tariffs, and monitor grid health.</p>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Go to Admin Control Center ➔
              </button>
            </div>

            {adminStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#f8f9fa', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #2c3e50' }}>
                  <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Total Stations</span>
                  <h2 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>{adminStats.total}</h2>
                </div>
                <div style={{ background: '#fef9e7', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #f39c12' }}>
                  <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Pending Approvals</span>
                  <h2 style={{ margin: '5px 0 0 0', color: '#f39c12' }}>{adminStats.pending}</h2>
                </div>
                <div style={{ background: '#e8f8f5', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #18bc9c' }}>
                  <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Live & Verified</span>
                  <h2 style={{ margin: '5px 0 0 0', color: '#18bc9c' }}>{adminStats.approved}</h2>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. HOST DASHBOARD */}
        {role === 'host' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ecf0f1', paddingBottom: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>⚡ Live Station Traffic & Sessions</h3>
                <p style={{ margin: '4px 0 0 0', color: '#7f8c8d', fontSize: '13px' }}>Monitor drivers currently charging at your registered stations.</p>
              </div>
              <button 
                onClick={() => navigate('/register-station')} 
                style={{ padding: '10px 18px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                + Register New Station
              </button>
            </div>
            
            {hostActiveBookings.length === 0 ? (
              <div style={{ padding: '25px', backgroundColor: '#f8f9fa', borderRadius: '10px', textAlign: 'center', color: '#7f8c8d' }}>
                No active charging sessions right now. All ports are available for incoming drivers.
              </div>
            ) : (
              hostActiveBookings.map(item => (
                <div key={item._id} style={{ padding: '18px', border: '1px solid #dfe6e9', borderRadius: '10px', marginBottom: '15px', background: item.status === 'charging' ? '#e8f8f5' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{item.stationName}</strong>
                      <p style={{ margin: '4px 0', color: '#7f8c8d', fontSize: '14px' }}>
                        📅 Date: <strong>{item.date}</strong> | ⏰ Slot: <strong>{item.timeSlot}</strong>
                      </p>
                      <p style={{ margin: 0, color: '#95a5a6', fontSize: '13px' }}>
                        Driver: <strong>{item.driverName}</strong> ({item.driverEmail})
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        backgroundColor: item.status === 'charging' ? '#18bc9c' : '#f39c12', 
                        color: 'white' 
                      }}>
                        {item.status === 'charging' ? '⚡ LIVE CHARGING' : 'CONFIRMED'}
                      </span>

                      {item.status === 'charging' && (
                        <button 
                          onClick={() => setShowStopModal(item._id)} 
                          style={{ ...actionBtnStyle, backgroundColor: '#e74c3c' }}
                        >
                          ⚠️ Emergency Eviction
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HOST STOP REASON MODAL */}
                  {showStopModal === item._id && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#fef9e7', borderRadius: '8px', border: '1px solid #f1c40f' }}>
                      <strong style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>Select Reason for Station Eviction (Driver will be prorated & refunded):</strong>
                      <select value={stopReasonType} onChange={e => setStopReasonType(e.target.value)} style={{ padding: '10px', width: '100%', marginBottom: '10px', borderRadius: '6px', border: '1px solid #dcdde1' }}>
                        <option>Hardware Failure / Power Outage</option>
                        <option>Station Maintenance Required</option>
                        <option>Emergency Access Needed</option>
                        <option>Other</option>
                      </select>
                      {stopReasonType === 'Other' && (
                         <input type="text" placeholder="Specify custom reason..." value={customReason} onChange={e => setCustomReason(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #dcdde1' }} />
                      )}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleStopCharging(item._id, 'host')} style={{ padding: '9px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Confirm Stop & Prorated Refund
                        </button>
                        <button onClick={() => setShowStopModal(null)} style={{ padding: '9px 15px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* MY REGISTERED STATIONS */}
            {myStations.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>My Listed Stations ({myStations.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {myStations.map(station => (
                    <div key={station._id} style={{ padding: '12px 15px', backgroundColor: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{station.name}</strong>
                        <p style={{ margin: '2px 0 0 0', color: '#7f8c8d', fontSize: '13px' }}>{station.address} • {station.plugType} ({station.powerOutput} kW)</p>
                      </div>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: station.isVerified ? '#e8f8f5' : '#fef9e7',
                        color: station.isVerified ? '#18bc9c' : '#f39c12'
                      }}>
                        {station.isVerified ? '✓ Approved' : '⏳ Pending Review'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. DRIVER DASHBOARD */}
        {role === 'driver' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ecf0f1', paddingBottom: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>🚗 My EV Charging Sessions</h3>
                <p style={{ margin: '4px 0 0 0', color: '#7f8c8d', fontSize: '13px' }}>Track upcoming slots, live sessions, and receipt history.</p>
              </div>
              <button 
                onClick={() => navigate('/')} 
                style={{ padding: '9px 18px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                🗺️ Book New Slot
              </button>
            </div>
            
            {history.length === 0 ? (
              <div style={{ padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '10px', textAlign: 'center', color: '#7f8c8d' }}>
                <p style={{ margin: 0 }}>You have no bookings yet. Find a charging station on the map to get started!</p>
                <button onClick={() => navigate('/')} style={{ ...actionBtnStyle, backgroundColor: '#18bc9c', marginTop: '15px' }}>
                  View Live Map
                </button>
              </div>
            ) : (
              history.map(item => {
                let timerDisplay = "00:00";
                if (item.chargingStartTime) {
                  const diffSeconds = Math.max(0, Math.floor((currentTime - new Date(item.chargingStartTime)) / 1000));
                  const mins = Math.floor(diffSeconds / 60);
                  const secs = diffSeconds % 60;
                  timerDisplay = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
                }

                return (
                  <div key={item._id} style={{ 
                    padding: '20px', 
                    marginBottom: '15px', 
                    borderRadius: '10px', 
                    border: item.status === 'charging' ? '2px solid #18bc9c' : '1px solid #dfe6e9', 
                    backgroundColor: item.status === 'charging' ? '#f4fbf9' : '#fff' 
                  }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '18px' }}>
                          ⚡ {item.stationName || "VoltSync Charging Hub"}
                        </h4>
                        <p style={{ margin: '0 0 5px 0', color: '#7f8c8d', fontSize: '14px' }}>
                          📅 <strong>{item.date}</strong> | ⏰ <strong>{item.timeSlot}</strong>
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#95a5a6' }}>
                          Escrow Hold: <strong>₹{item.escrowAmount || 265}</strong>
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span style={{ 
                          padding: '5px 12px', 
                          borderRadius: '6px', 
                          fontWeight: 'bold', 
                          fontSize: '12px', 
                          backgroundColor: item.status === 'charging' ? '#18bc9c' : item.status === 'completed' ? '#95a5a6' : item.status === 'cancelled' ? '#e74c3c' : '#f39c12', 
                          color: 'white' 
                        }}>
                          {item.status.toUpperCase()}
                        </span>
                        
                        {item.status === 'confirmed' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => navigate('/verify-arrival', { state: { bookingId: item._id } })} 
                              style={{ ...actionBtnStyle, backgroundColor: '#18bc9c' }}
                            >
                              📷 Scan Station QR
                            </button>
                            <button 
                              onClick={() => handleCancelBooking(item._id)} 
                              style={{ ...actionBtnStyle, backgroundColor: '#e74c3c' }}
                            >
                              ❌ Cancel Slot
                            </button>
                          </div>
                        )}

                        {item.status === 'charging' && (
                          <button 
                            onClick={() => handleStopCharging(item._id, 'user')} 
                            style={{ ...actionBtnStyle, backgroundColor: '#e74c3c' }}
                          >
                            🛑 Stop Session
                          </button>
                        )}
                      </div>
                    </div>

                    {/* LIVE CHARGING TELEMETRY MONITOR */}
                    {item.status === 'charging' && (
                      <div style={{ marginTop: '18px', padding: '16px', backgroundColor: '#2c3e50', borderRadius: '10px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#18bc9c', fontWeight: 'bold', letterSpacing: '1px' }}>⚡ LIVE TELEMETRY</span>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {liveVoltage} <span style={{ fontSize: '14px', color: '#bdc3c7' }}>Volts</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: '#bdc3c7', letterSpacing: '1px' }}>SESSION DURATION</span>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12', fontFamily: 'monospace' }}>
                            {timerDisplay} <span style={{ fontSize: '14px' }}>min:sec</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RECEIPT & SETTLEMENT */}
                    {(item.status === 'completed' || item.status === 'cancelled') && (
                      <div style={{ marginTop: '12px', padding: '12px 15px', backgroundColor: '#fdf2e9', border: '1px solid #fad7a1', borderRadius: '8px', fontSize: '14px' }}>
                        {item.status === 'completed' && (
                          <div style={{ color: '#2c3e50' }}>
                            <strong>Final Charge: ₹{item.finalBill}</strong> | Refund Released: <strong>₹{item.refundAmount}</strong>
                          </div>
                        )}
                        {item.status === 'cancelled' && (
                          <div style={{ color: '#2c3e50' }}>
                            Full Escrow Refunded: <strong>₹{item.refundAmount || 265}</strong>
                          </div>
                        )}
                        {item.stopReason && (
                          <div style={{ marginTop: '5px', color: '#c0392b', fontSize: '13px' }}>
                            <strong>Notice:</strong> {item.stopReason}
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

const actionBtnStyle = { 
  padding: '8px 14px', 
  backgroundColor: '#2c3e50', 
  color: 'white', 
  border: 'none', 
  borderRadius: '6px', 
  fontWeight: 'bold', 
  cursor: 'pointer', 
  fontSize: '12px',
  transition: '0.2s'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #dfe6e9',
  fontSize: '14px',
  boxSizing: 'border-box'
};

export default ProfilePage;
