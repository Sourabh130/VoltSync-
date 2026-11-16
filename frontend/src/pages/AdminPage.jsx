import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const AdminPage = () => {
  const [pendingStations, setPendingStations] = useState([]);
  const [approvedStations, setApprovedStations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Strict Admin Access Control
    if (!token || role !== 'admin') {
      setAuthError("Unauthorized: This sector requires Administrator credentials.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get('http://localhost:5000/api/stations/all', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const all = res.data.stations || [];
      setPendingStations(all.filter(s => !s.isVerified));
      setApprovedStations(all.filter(s => s.isVerified));
      setStats(res.data.stats || { total: all.length, pending: 0, approved: 0 });
      setAuthError(null);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setAuthError(err.response?.data?.message || "Forbidden: Admin privileges required.");
      } else {
        setAuthError("Error loading admin records. Make sure the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (stationId, stationName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/stations/approve/${stationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${res.data.message || `Station '${stationName}' Approved!`}`);
      checkAdminAndFetch();
    } catch (err) {
      alert(err.response?.data?.message || "Error approving station");
    }
  };

  const handleReject = async (stationId, stationName) => {
    if (!window.confirm(`Are you sure you want to reject and remove '${stationName}'?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/stations/reject/${stationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`🗑️ ${res.data.message || "Station rejected."}`);
      checkAdminAndFetch();
    } catch (err) {
      alert(err.response?.data?.message || "Error rejecting station");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Log out of Admin session?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    }
  };

  // If unauthorized or external visitor trying to access /admin
  if (authError) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>🔒</div>
          <h2 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>Restricted Admin Sector</h2>
          <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '25px' }}>
            {authError}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link to="/login" style={{ padding: '12px 24px', backgroundColor: '#e74c3c', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              🔑 Admin Login
            </Link>
            <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#2c3e50', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#7f8c8d' }}>
        🛡️ Verifying Admin Credentials...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', padding: '40px 20px', backgroundColor: '#f4f7f6', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        
        {/* HEADER BAR */}
        <div style={{ 
          background: 'white', 
          padding: '25px 30px', 
          borderRadius: '16px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)', 
          marginBottom: '25px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '38px', backgroundColor: '#fdf2e9', padding: '10px', borderRadius: '12px' }}>🛡️</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0, fontSize: '22px' }}>Admin Control Center</h2>
                <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  ROOT ACCESS
                </span>
              </div>
              <p style={{ color: '#7f8c8d', margin: '4px 0 0 0', fontSize: '14px' }}>
                Verify host submissions, manage tariffs, and enforce MP EV Policy 2025.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/register-station')} 
              style={{ padding: '9px 16px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              ➕ Add Official Station
            </button>
            <button 
              onClick={handleLogout} 
              style={{ padding: '9px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              🚪 Admin Logout
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', borderLeft: '5px solid #2c3e50' }}>
            <span style={{ color: '#7f8c8d', fontSize: '13px', fontWeight: 'bold' }}>TOTAL STATIONS</span>
            <h2 style={{ margin: '8px 0 0 0', color: '#2c3e50', fontSize: '28px' }}>{stats.total}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', borderLeft: '5px solid #f39c12' }}>
            <span style={{ color: '#7f8c8d', fontSize: '13px', fontWeight: 'bold' }}>PENDING VERIFICATIONS</span>
            <h2 style={{ margin: '8px 0 0 0', color: '#f39c12', fontSize: '28px' }}>{pendingStations.length}</h2>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', borderLeft: '5px solid #18bc9c' }}>
            <span style={{ color: '#7f8c8d', fontSize: '13px', fontWeight: 'bold' }}>LIVE ON MAP</span>
            <h2 style={{ margin: '8px 0 0 0', color: '#18bc9c', fontSize: '28px' }}>{approvedStations.length}</h2>
          </div>
        </div>

        {/* TAB TOGGLES */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveTab('pending')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              backgroundColor: activeTab === 'pending' ? '#2c3e50' : '#fff',
              color: activeTab === 'pending' ? '#fff' : '#7f8c8d',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            ⏳ Pending Submissions ({pendingStations.length})
          </button>
          <button 
            onClick={() => setActiveTab('approved')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              backgroundColor: activeTab === 'approved' ? '#2c3e50' : '#fff',
              color: activeTab === 'approved' ? '#fff' : '#7f8c8d',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            ✅ Live Verified Stations ({approvedStations.length})
          </button>
        </div>

        {/* TAB CONTENT */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          
          {activeTab === 'pending' && (
            <div>
              <h3 style={{ color: '#2c3e50', marginTop: 0, marginBottom: '20px' }}>
                Pending Review Queue
              </h3>
              
              {pendingStations.length === 0 ? (
                <div style={{ padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '10px', textAlign: 'center', color: '#7f8c8d' }}>
                  🎉 No pending stations! All host submissions have been verified and processed.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {pendingStations.map(station => (
                    <div key={station._id} style={{ border: '1px solid #dfe6e9', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: '#fff' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '18px' }}>{station.name}</h4>
                        <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '14px' }}>📍 {station.address}</p>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ padding: '4px 10px', backgroundColor: '#f1f2f6', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                            🔌 {station.plugType}
                          </span>
                          <span style={{ padding: '4px 10px', backgroundColor: '#f1f2f6', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                            ⚡ {station.powerOutput} kW
                          </span>
                          <span style={{ padding: '4px 10px', backgroundColor: '#fcf3cf', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#f39c12' }}>
                            ₹ {station.hourlyRate}/hr
                          </span>
                          <span style={{ padding: '4px 10px', backgroundColor: '#e8f8f5', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#18bc9c' }}>
                            Ports: {station.totalPorts || 2}
                          </span>
                        </div>

                        {station.hostId && (
                          <span style={{ fontSize: '12px', color: '#95a5a6' }}>
                            Submitted by Host: {station.hostId.name || station.hostId.email}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleApprove(station._id, station.name)}
                          style={{ padding: '10px 18px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(24, 188, 156, 0.3)' }}
                        >
                          ✓ Verify & Approve
                        </button>
                        <button 
                          onClick={() => handleReject(station._id, station.name)}
                          style={{ padding: '10px 18px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'approved' && (
            <div>
              <h3 style={{ color: '#2c3e50', marginTop: 0, marginBottom: '20px' }}>
                Live Stations on Grid
              </h3>
              
              {approvedStations.length === 0 ? (
                <div style={{ padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '10px', textAlign: 'center', color: '#7f8c8d' }}>
                  No active stations registered yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {approvedStations.map(station => (
                    <div key={station._id} style={{ border: '1px solid #dfe6e9', borderRadius: '10px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: '#fdfefe' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '17px' }}>{station.name}</h4>
                          <span style={{ padding: '2px 8px', backgroundColor: '#e8f8f5', color: '#18bc9c', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                            LIVE
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px 0', color: '#7f8c8d', fontSize: '13px' }}>📍 {station.address}</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#2c3e50', fontWeight: '500' }}>
                            {station.plugType} • {station.powerOutput} kW • ₹{station.hourlyRate}/hr
                          </span>
                          <span style={{ fontSize: '12px', color: '#18bc9c', fontWeight: 'bold' }}>
                            ({station.availablePorts || 0}/{station.totalPorts || 2} Ports Free)
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleReject(station._id, station.name)}
                        style={{ padding: '8px 14px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Remove Station
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminPage;
