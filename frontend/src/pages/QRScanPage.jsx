import React, { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const QRScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeBookingId, setActiveBookingId] = useState(location.state?.bookingId || null);
  const [bookings, setBookings] = useState([]);
  const [activeBookingInfo, setActiveBookingInfo] = useState(null);

  // Scanner States
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('Camera active. Align station QR code to start charging...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const isScanningRef = useRef(false);

  // Protected route & load bookings
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.get('http://localhost:5000/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${token}` }})
      .then(res => {
        const all = res.data || [];
        setBookings(all);
        
        // If no bookingId was explicitly passed, automatically associate with the latest confirmed booking
        if (!activeBookingId) {
          const confirmed = all.find(b => b.status === 'confirmed');
          if (confirmed) {
            setActiveBookingId(confirmed._id);
            setActiveBookingInfo(confirmed);
          }
        } else {
          const matching = all.find(b => b._id === activeBookingId);
          if (matching) setActiveBookingInfo(matching);
        }
      })
      .catch(err => console.error("Error fetching bookings", err));
  }, [activeBookingId, navigate]);

  // GPS Geofence Lock
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          setUserLocation({ lat: 23.2599, lng: 77.4126 });
        },
        { enableHighAccuracy: false, timeout: 4000 }
      );
    } else {
      setUserLocation({ lat: 23.2599, lng: 77.4126 });
    }
  }, []);

  const handleScan = async (scannedData) => {
    if (isScanningRef.current || isProcessing) return;
    isScanningRef.current = true;
    setIsProcessing(true);

    let finalLocation = userLocation || { lat: 23.2599, lng: 77.4126 };
    let textStr = "";

    try {
      if (Array.isArray(scannedData) && scannedData.length > 0) {
        textStr = scannedData[0]?.rawValue || scannedData[0]?.data || JSON.stringify(scannedData[0]);
      } else if (typeof scannedData === 'string') {
        textStr = scannedData;
      } else if (scannedData && typeof scannedData === 'object') {
        textStr = scannedData.rawValue || scannedData.data || scannedData.text || JSON.stringify(scannedData);
      }
    } catch (e) {
      textStr = "";
    }

    const trimmed = (textStr || '').trim();

    // Must have content
    if (!trimmed) {
      isScanningRef.current = false;
      setIsProcessing(false);
      return;
    }

    // Verify official QR code strictly: Sourabh_Rajput
    const normalized = trimmed.toLowerCase();
    const isValidQR = normalized === 'sourabh_rajput' || 
                      normalized === 'sourabh rajput' ||
                      normalized.includes('sourabh_rajput');

    if (!isValidQR) {
      setStatus(`❌ Invalid QR! Scanned: "${trimmed.substring(0, 30)}". Expected 'Sourabh_Rajput'.`);
      setTimeout(() => {
        setStatus('Ready. Scan station QR code (Sourabh_Rajput).');
        setIsProcessing(false);
        isScanningRef.current = false;
      }, 3000);
      return; 
    }

    setStatus(`⚡ Valid QR 'Sourabh_Rajput' detected! Initiating charging session...`);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/bookings/verify-arrival', {
        bookingId: activeBookingId, 
        qrData: trimmed, 
        userLat: finalLocation.lat,
        userLng: finalLocation.lng
      }, { headers: { Authorization: `Bearer ${token}` } });

      setStatus(`✅ Success: ${res.data.message || 'Charging Started!'}`);
      setTimeout(() => navigate('/profile'), 1500);
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Authentication Failed';
      setStatus(`❌ Error: ${errorMsg}`);
      
      setTimeout(() => {
        setStatus('Ready. Scan station QR code (Sourabh_Rajput).');
        setIsProcessing(false);
        isScanningRef.current = false; 
      }, 3500); 
    }
  };

  const handleSimulateScan = () => {
    handleScan("Sourabh_Rajput");
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScan(manualInput.trim());
  };

  return (
    <div style={{ minHeight: '85vh', backgroundColor: '#f4f7f6', padding: '30px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '520px', textAlign: 'center' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ color: '#2c3e50', margin: 0, fontSize: '22px' }}>⚡ Auto QR Arrival Scanner</h2>
            <p style={{ color: '#7f8c8d', margin: '4px 0 0 0', fontSize: '13px' }}>
              Station QR Code: <strong style={{ color: '#18bc9c' }}>Sourabh_Rajput</strong>
            </p>
          </div>
          
          <button 
            onClick={() => setShowBookingsModal(!showBookingsModal)}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#ecf0f1', 
              color: '#2c3e50', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            {activeBookingInfo ? `Slot: ${activeBookingInfo.timeSlot?.split(' - ')[0] || 'Active'}` : 'All Bookings'} ▾
          </button>
        </div>

        {/* ACTIVE BOOKING BADGE */}
        {activeBookingInfo && (
          <div style={{ 
            backgroundColor: '#e8f8f5', 
            padding: '10px 15px', 
            borderRadius: '8px', 
            marginBottom: '15px', 
            fontSize: '13px', 
            color: '#18bc9c', 
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Station: {activeBookingInfo.stationName || 'VoltSync Hub'}</span>
            <span>⏰ {activeBookingInfo.timeSlot}</span>
          </div>
        )}

        {/* BOOKINGS SWITCHER MODAL / DROPDOWN */}
        {showBookingsModal && (
          <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dfe6e9', textAlign: 'left' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', display: 'block', marginBottom: '8px' }}>
              Select Reservation to Unlock:
            </span>
            {bookings.filter(b => b.status === 'confirmed').length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: '#95a5a6' }}>
                No pre-booked slots. Scanning <strong>Sourabh_Rajput</strong> will start an instant charging session.
              </p>
            ) : (
              bookings.filter(b => b.status === 'confirmed').map(b => (
                <div 
                  key={b._id} 
                  onClick={() => { setActiveBookingId(b._id); setActiveBookingInfo(b); setShowBookingsModal(false); }}
                  style={{ 
                    padding: '8px 10px', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    marginBottom: '4px',
                    backgroundColor: activeBookingId === b._id ? '#18bc9c' : '#fff',
                    color: activeBookingId === b._id ? '#fff' : '#2c3e50',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  📅 {b.date} | ⏰ {b.timeSlot} ({b.stationName})
                </div>
              ))
            )}
          </div>
        )}

        {/* STATUS BANNER */}
        <div style={{ 
          backgroundColor: status.includes('Success') || status.includes('Valid') ? '#e8f8f5' : status.includes('Error') || status.includes('Invalid') ? '#fde8e8' : '#ecf0f1', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          fontWeight: 'bold', 
          fontSize: '13px',
          color: status.includes('Success') || status.includes('Valid') ? '#18bc9c' : status.includes('Error') || status.includes('Invalid') ? '#e74c3c' : '#2c3e50' 
        }}>
          {status}
        </div>

        {/* LIVE CAMERA VIEWFINDER */}
        <div style={{ 
          borderRadius: '16px', 
          overflow: 'hidden', 
          border: '4px solid #2c3e50', 
          marginBottom: '20px', 
          height: '280px', 
          backgroundColor: isProcessing ? '#f8f9fa' : '#000', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative'
        }}>
          {isProcessing ? (
            <div style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '16px', padding: '20px' }}>
              ⚡ Activating OCPP Relay & Starting Charge...
            </div>
          ) : cameraError ? (
            <div style={{ color: '#ecf0f1', padding: '20px', fontSize: '13px' }}>
              <p>📷 Camera could not be accessed directly.</p>
              <p>Use the 1-click simulation button below or enter the code manually.</p>
            </div>
          ) : (
            <Scanner 
              onScan={(result) => handleScan(result)} 
              onError={() => setCameraError(true)} 
              components={{ audio: true, finder: true }}
            />
          )}
        </div>

        {/* 1-CLICK INSTANT DEMO SIMULATION (Sourabh_Rajput) */}
        <div style={{ backgroundColor: '#fcf3cf', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #f9e79f' }}>
          <span style={{ fontSize: '12px', color: '#7d6608', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            ⚡ AUTOMATIC STATION SCAN ('Sourabh_Rajput')
          </span>
          <button 
            onClick={handleSimulateScan} 
            disabled={isProcessing}
            style={{ 
              padding: '13px 20px', 
              backgroundColor: '#18bc9c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: isProcessing ? 'not-allowed' : 'pointer', 
              width: '100%',
              fontSize: '15px',
              boxShadow: '0 4px 10px rgba(24, 188, 156, 0.4)',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            ⚡ Scan 'Sourabh_Rajput' & Start Charging
          </button>
        </div>

        {/* MANUAL INPUT FALLBACK */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Or type QR code (e.g. Sourabh_Rajput)" 
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid #dfe6e9', 
              fontSize: '13px', 
              outline: 'none' 
            }} 
          />
          <button 
            type="submit" 
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#2c3e50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Submit
          </button>
        </form>

      </div>
    </div>
  );
};

export default QRScanPage;
