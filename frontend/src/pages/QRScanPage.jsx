import React, { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const QRScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // NEW: State to manage the list of bookings and the currently selected one
  const [bookings, setBookings] = useState([]);
  const [activeBookingId, setActiveBookingId] = useState(location.state?.bookingId || null);

  // Scanner States
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('Waiting for camera and GPS...');
  const [isProcessing, setIsProcessing] = useState(false);
  const isScanningRef = useRef(false);

  // FETCH BOOKINGS: If they clicked "QR Scanner" in the navbar without a booking, fetch their history!
  useEffect(() => {
    if (!activeBookingId) {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('http://localhost:5000/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${token}` }})
          .then(res => setBookings(res.data))
          .catch(err => console.error("Error fetching bookings", err));
      } else {
        navigate('/login'); // Protect the route
      }
    }
  }, [activeBookingId, navigate]);

  // GPS LOGIC
  useEffect(() => {
    if (activeBookingId) { // Only fetch GPS if we are actually opening the camera
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setStatus('GPS Locked. Please scan the station QR code.');
          },
          (error) => {
            setStatus('GPS is slow. Using Demo Fallback. Please scan QR.');
            setUserLocation({ lat: 23.2599, lng: 77.4126 });
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
        setStatus('Geolocation not supported. Using Demo Fallback.');
        setUserLocation({ lat: 23.2599, lng: 77.4126 });
      }
    }
  }, [activeBookingId]);

  const handleScan = async (scannedData) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setIsProcessing(true);

    let finalLocation = userLocation || { lat: 23.2599, lng: 77.4126 };

    let textStr = "";
    try {
      if (Array.isArray(scannedData)) {
        textStr = scannedData[0]?.rawValue || JSON.stringify(scannedData);
      } else if (typeof scannedData === 'string') {
        textStr = scannedData;
      } else if (scannedData && typeof scannedData === 'object') {
        textStr = scannedData.text || scannedData.data || scannedData.rawValue || JSON.stringify(scannedData);
      }
    } catch (e) {
      textStr = "Format Error";
    }

    if (!textStr.includes("VOLTSYNC")) {
      setStatus(`❌ Invalid QR! The camera saw: "${textStr.substring(0, 45)}"`);
      setTimeout(() => {
        setStatus('Ready. Try scanning again.');
        setIsProcessing(false);
        isScanningRef.current = false;
      }, 4000);
      return; 
    }

    setStatus(`⏳ QR Validated! Communicating with Station...`);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/bookings/verify-arrival', {
        bookingId: activeBookingId, 
        qrData: textStr, 
        userLat: finalLocation.lat,
        userLng: finalLocation.lng
      }, { headers: { Authorization: `Bearer ${token}` } });

      setStatus(`✅ Success! Distance: ${res.data.distance}m. Starting charge...`);
      setTimeout(() => navigate('/profile'), 3000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown Server Error';
      setStatus(`❌ Backend Error: ${errorMsg}`);
      
      setTimeout(() => {
        setStatus('Ready. Try scanning again.');
        setIsProcessing(false);
        isScanningRef.current = false; 
      }, 4000); 
    }
  };

  const handleDemoOverride = () => {
    handleScan("VOLTSYNC_STATION_1");
  };

  // ----------------------------------------------------------------------
  // RENDER VIEW 1: THE LIST DASHBOARD (If no booking is selected yet)
  // ----------------------------------------------------------------------
  if (!activeBookingId) {
    return (
      <div style={{ minHeight: '80vh', backgroundColor: '#f4f7f6', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '600px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
            <div style={{ fontSize: '30px' }}>📷</div>
            <div>
              <h2 style={{ color: '#2c3e50', margin: 0 }}>QR Authentication Hub</h2>
              <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Select an active tracking session to verify your arrival.</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div style={{ padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center', color: '#7f8c8d' }}>
              No active bookings found. Head to the Live Map to reserve a slot!
            </div>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {bookings.map(item => (
                <li key={item._id} style={{ padding: '15px', borderBottom: '1px solid #dfe6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: item.status === 'charging' ? '#e8f8f5' : 'transparent' }}>
                  <div>
                    <strong>Date: {item.date}</strong><br/>
                    <span style={{ color: '#7f8c8d' }}>Slot: {item.timeSlot}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <span style={{ padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', 
                      backgroundColor: item.status === 'charging' ? '#18bc9c' : item.status === 'completed' ? '#95a5a6' : item.status === 'confirmed' ? '#f39c12' : '#ecf0f1', 
                      color: item.status === 'locked' ? '#2c3e50' : 'white' }}>
                      {item.status === 'charging' ? '⚡ LIVE CHARGING' : item.status.toUpperCase()}
                    </span>
                    
                    {/* Select button to trigger the camera! */}
                    {item.status === 'confirmed' && (
                      <button 
                        onClick={() => setActiveBookingId(item._id)}
                        style={{ padding: '8px 12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                        📷 Select to Scan
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER VIEW 2: THE ACTUAL CAMERA SCANNER
  // ----------------------------------------------------------------------
  return (
    <div style={{ minHeight: '80vh', backgroundColor: '#f4f7f6', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        
        {/* NEW: Back Button! */}
        <button 
          onClick={() => { setActiveBookingId(null); setIsProcessing(false); }} 
          style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          ⬅ Back to Bookings List
        </button>

        <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>Location Authenticator</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Verify physical presence to unlock the charger.</p>

        <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', color: status.includes('Success') ? '#18bc9c' : status.includes('Error') ? '#e74c3c' : '#2c3e50' }}>
          {status}
        </div>

        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '4px solid #2c3e50', marginBottom: '20px', height: '300px', backgroundColor: isProcessing ? '#f8f9fa' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isProcessing ? (
            <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '18px' }}>
              Communicating with Station...
            </div>
          ) : (
            <Scanner 
              onScan={(result) => handleScan(result)} 
              onError={(error) => console.log("Scanner Error:", error?.message)} 
              components={{ audio: true, finder: true }}
            />
          )}
        </div>

        <div style={{ borderTop: '2px dashed #dfe6e9', paddingTop: '20px', marginTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '10px' }}>Admin / Hackathon Demo Fallback</p>
          <button 
            onClick={handleDemoOverride} 
            disabled={isProcessing}
            style={{ padding: '12px 20px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', opacity: isProcessing ? 0.5 : 1 }}
          >
            Simulate Successful QR Scan
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRScanPage;