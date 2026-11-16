import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const BookingPage = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  
  const [station, setStation] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  
  // Custom Time States
  const [bookingMode, setBookingMode] = useState('preset'); // 'preset' or 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Checkout State
  const [activeLock, setActiveLock] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const allSlots = [
    "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", 
    "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM",
    "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM", "08:00 PM - 09:00 PM",
    "09:00 PM - 10:00 PM", "10:00 PM - 11:00 PM"
  ];

  // Fetch station details
  useEffect(() => {
    axios.get('http://localhost:5000/api/stations')
      .then(res => {
        const found = res.data.find(s => s._id === stationId);
        if (found) setStation(found);
      })
      .catch(err => console.error(err));
  }, [stationId]);

  // Fetch occupied slots for selected date
  useEffect(() => {
    axios.get(`http://localhost:5000/api/bookings/${stationId}/${date}`)
      .then(res => setOccupiedSlots(res.data || []))
      .catch(err => console.error(err));
  }, [stationId, date]);

  // Lock timer countdown
  useEffect(() => {
    let timer;
    if (activeLock && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && activeLock) {
      alert("Your 5-minute reservation hold has expired. The slot has been released back to the grid.");
      setActiveLock(null);
      window.location.reload();
    }
    return () => clearInterval(timer);
  }, [activeLock, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    let [h, m] = time24.split(':');
    let hours = parseInt(h);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    hours = hours < 10 ? '0' + hours : hours;
    return `${hours}:${m} ${ampm}`;
  };

  const handleLockSlot = async (slot) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login first to reserve a charging slot.");
      return navigate('/login');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/bookings/lock', 
        { stationId, date, timeSlot: slot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setActiveLock({ bookingId: res.data.bookingId, timeSlot: slot });
      setTimeLeft(300);
    } catch (err) {
      alert(err.response?.data?.message || "Could not lock slot. It may have just been taken.");
    }
  };

  const handleCustomSubmit = () => {
    if (!customStart || !customEnd) return alert("Please select both start and end times.");
    if (customStart >= customEnd) return alert("End time must be later than start time.");
    
    const customSlot = `${formatTo12Hour(customStart)} - ${formatTo12Hour(customEnd)}`;
    handleLockSlot(customSlot);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/bookings/confirm', 
        { bookingId: activeLock.bookingId, paymentDetails: { cardNumber } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ ${res.data.message}\nYour reservation is confirmed and held in escrow.`);
      navigate('/profile'); 
    } catch (err) {
      alert(err.response?.data?.message || "Payment Failed.");
    } finally {
      setLoading(false);
    }
  };

  const hourlyFee = station?.hourlyRate || 250;
  const convenienceFee = 15;
  const totalEscrow = hourlyFee + convenienceFee;

  return (
    <div style={{ minHeight: '85vh', backgroundColor: '#f4f7f6', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '800px' }}>
        
        {/* STATION BANNER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#18bc9c', fontWeight: 'bold' }}>⚡ VOLTSYNC SMART RESERVATION</span>
            <h2 style={{ color: '#2c3e50', margin: '4px 0' }}>{station?.name || "EV Charging Station"}</h2>
            <p style={{ color: '#7f8c8d', margin: 0, fontSize: '14px' }}>
              📍 {station?.address || "Madhya Pradesh"} • {station?.plugType || "CCS2"} ({station?.powerOutput || 50} kW)
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: 'bold' }}>DATE:</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              disabled={!!activeLock}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #dfe6e9', fontWeight: 'bold', color: '#2c3e50' }} 
            />
          </div>
        </div>

        {!activeLock ? (
          <div>
            {/* TOGGLE PRESET VS CUSTOM */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#f1f2f6', padding: '5px', borderRadius: '10px' }}>
              <button 
                type="button" 
                onClick={() => setBookingMode('preset')}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  transition: '0.2s', 
                  backgroundColor: bookingMode === 'preset' ? '#fff' : 'transparent', 
                  color: bookingMode === 'preset' ? '#2c3e50' : '#7f8c8d', 
                  boxShadow: bookingMode === 'preset' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' 
                }}
              >
                ⚡ Standard 1-Hour Slots
              </button>
              <button 
                type="button" 
                onClick={() => setBookingMode('custom')}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  transition: '0.2s', 
                  backgroundColor: bookingMode === 'custom' ? '#fff' : 'transparent', 
                  color: bookingMode === 'custom' ? '#2c3e50' : '#7f8c8d', 
                  boxShadow: bookingMode === 'custom' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' 
                }}
              >
                ⏱️ Custom Time Duration
              </button>
            </div>

            {bookingMode === 'preset' ? (
              <div>
                <p style={{ color: '#7f8c8d', fontSize: '13px', marginBottom: '15px' }}>
                  Click an available slot to initiate 5-minute concurrency lock:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                  {allSlots.map(slot => {
                    const isOccupied = occupiedSlots.includes(slot);
                    if (isOccupied) {
                      return (
                        <div key={slot} style={{ padding: '14px', backgroundColor: '#f8f9fa', color: '#bdc3c7', borderRadius: '8px', border: '1px dashed #dfe6e9', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                          🔒 {slot} (Booked)
                        </div>
                      );
                    }
                    return (
                      <button 
                        key={slot} 
                        onClick={() => handleLockSlot(slot)}
                        style={{ 
                          padding: '14px', 
                          backgroundColor: '#ecf0f1', 
                          color: '#2c3e50', 
                          border: '2px solid transparent', 
                          borderRadius: '8px', 
                          fontWeight: 'bold', 
                          cursor: 'pointer', 
                          fontSize: '13px',
                          transition: '0.2s' 
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#18bc9c'; e.currentTarget.style.backgroundColor = '#e8f8f5'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = '#ecf0f1'; }}
                      >
                        ⚡ {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: '25px', border: '1px solid #dfe6e9', borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Select Custom Slot Duration</h4>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', fontWeight: 'bold' }}>START TIME</label>
                    <input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', boxSizing: 'border-box' }} />
                  </div>
                  <strong style={{ marginTop: '20px', color: '#7f8c8d' }}>to</strong>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', fontWeight: 'bold' }}>END TIME</label>
                    <input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button 
                  onClick={handleCustomSubmit} 
                  style={{ marginTop: '20px', width: '100%', padding: '14px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                >
                  🔒 Lock Custom Time Slot
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            {/* CONCURRENCY LOCK BANNER */}
            <div style={{ backgroundColor: '#fcf3cf', padding: '18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <strong style={{ color: '#d35400', display: 'block', fontSize: '17px' }}>
                  🔒 Slot Reserved: {activeLock.timeSlot}
                </strong>
                <span style={{ color: '#7f8c8d', fontSize: '13px' }}>
                  Temporary database lock active to prevent double-booking.
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#c0392b', fontFamily: 'monospace' }}>
                ⏳ {formatTime(timeLeft)}
              </div>
            </div>

            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Pre-Authorization & Escrow Settlement</h3>
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ padding: '20px', border: '1px solid #dfe6e9', borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Estimated Energy Rate (1 hr)</span>
                  <strong>₹ {hourlyFee}.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#7f8c8d', fontSize: '14px' }}>
                  <span>Grid Sync & Escrow Fee</span>
                  <strong>₹ {convenienceFee}.00</strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #dfe6e9', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                  <strong>Pre-Auth Escrow Total</strong>
                  <strong style={{ color: '#18bc9c' }}>₹ {totalEscrow}.00</strong>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#95a5a6' }}>
                  * Any unused energy is automatically refunded to your original payment method after session completion.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '6px', fontWeight: 'bold' }}>CARD DETAILS (DEMO / STRIPE SANDBOX)</label>
                <input 
                  type="text" 
                  placeholder="4242 •••• •••• 4242" 
                  required 
                  maxLength="16" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => { setActiveLock(null); window.location.reload(); }} 
                  style={{ padding: '14px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
                >
                  Release Slot
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ padding: '14px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', flex: 2, fontSize: '15px' }}
                >
                  {loading ? 'Processing Escrow...' : `Authorize ₹${totalEscrow}.00 & Confirm`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
