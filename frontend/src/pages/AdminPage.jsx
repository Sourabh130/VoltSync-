import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [pendingStations, setPendingStations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingStations();
  }, []);

  const fetchPendingStations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const res = await axios.get('http://localhost:5000/api/stations/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingStations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (stationId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/stations/approve/${stationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${res.data.message}`);
      // Refresh the list to remove the approved station
      fetchPendingStations();
    } catch (err) {
      alert("Error approving station");
    }
  };

  return (
    <div style={{ minHeight: '80vh', padding: '40px 20px', backgroundColor: '#f4f7f6', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '800px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '36px' }}>🛡️</div>
          <div>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>Admin Control Center</h2>
            <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Review and approve host station submissions.</p>
          </div>
        </div>

        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Pending Approvals ({pendingStations.length})</h3>
        
        {pendingStations.length === 0 ? (
          <div style={{ padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center', color: '#7f8c8d' }}>
            No pending stations. All caught up!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingStations.map(station => (
              <div key={station._id} style={{ border: '1px solid #dfe6e9', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '18px' }}>{station.name}</h4>
                  <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '14px' }}>📍 {station.address}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#f1f2f6', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50' }}>{station.plugType}</span>
                    <span style={{ padding: '4px 8px', backgroundColor: '#f1f2f6', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50' }}>{station.powerOutput} kW</span>
                    <span style={{ padding: '4px 8px', backgroundColor: '#fcf3cf', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#f39c12' }}>₹ {station.hourlyRate}/hr</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleApprove(station._id)}
                  style={{ padding: '12px 20px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(24, 188, 156, 0.3)' }}
                >
                  Verify & Approve
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;