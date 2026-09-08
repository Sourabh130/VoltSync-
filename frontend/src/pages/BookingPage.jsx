import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const BookingPage = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  
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

  const allSlots = [
    "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", 
    "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM",
    "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM", "08:00 PM - 09:00 PM",
    "09:00 PM - 10:00 PM", "10:00 PM - 11:00 PM"
  ];

  useEffect(() => {
    axios.get(`http://localhost:5000/api/bookings/${stationId}/${date}`)
      .then(res => setOccupiedSlots(res.data))
      .catch(err => console.error(err));
  }, [stationId, date]);

  useEffect(() => {
    let timer;
    if (activeLock && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && activeLock) {
      alert("Your session expired. The slot has been released.");
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

  // Helper to convert standard HTML 24hr time to the 12hr AM/PM format our backend uses
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
    if (!token) return navigate('/login');

    try {
      const res = await axios.post('http://localhost:5000/api/bookings/lock', 
        { stationId, date, timeSlot: slot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setActiveLock({ bookingId: res.data.bookingId, timeSlot: slot });
      setTimeLeft(300);
    } catch (err) {
      alert(err.response?.data?.message || "Could not lock slot.");
    }
  };

  const handleCustomSubmit = () => {
    if (!customStart || !customEnd) return alert("Please select both start and end times.");
    if (customStart >= customEnd) return alert("End time must be later than start time.");
    
    // Combine them into our standard string format
    const customSlot = `${formatTo12Hour(customStart)} - ${formatTo12Hour(customEnd)}`;
    handleLockSlot(customSlot);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/bookings/confirm', 
        { bookingId: activeLock.bookingId, paymentDetails: { cardNumber } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ ${res.data.message} You can find your reservation in your Profile Dashboard.`);
      navigate('/profile'); 
    } catch (err) {
      alert(err.response?.data?.message || "Payment Failed.");
    }
  };

  return (
    <div style={{ minHeight: '80vh', backgroundColor: '#f4f7f6', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '800px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>Schedule Charging</h2>
            <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Select a date and secure your slot instantly.</p>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={activeLock}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #dfe6e9', fontWeight: 'bold', color: '#2c3e50' }} />
        </div>

        {!activeLock ? (
          <div>
            {/* NEW: Toggle between Preset and Custom Times */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#f1f2f6', padding: '5px', borderRadius: '10px' }}>
              <button type="button" onClick={() => setBookingMode('preset')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', backgroundColor: bookingMode === 'preset' ? '#fff' : 'transparent', color: bookingMode === 'preset' ? '#2c3e50' : '#7f8c8d', boxShadow: bookingMode === 'preset' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none' }}>
                Quick 1-Hour Slots
              </button>
              <button type="button" onClick={() => setBookingMode('custom')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', backgroundColor: bookingMode === 'custom' ? '#fff' : 'transparent', color: bookingMode === 'custom' ? '#2c3e50' : '#7f8c8d', boxShadow: bookingMode === 'custom' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none' }}>
                Custom Duration
              </button>
            </div>

            {bookingMode === 'preset' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {allSlots.map(slot => {
                  const isOccupied = occupiedSlots.includes(slot);
                  if (isOccupied) return null; 
                  return (
                    <button key={slot} onClick={() => handleLockSlot(slot)}
                      style={{ padding: '15px', backgroundColor: '#ecf0f1', color: '#2c3e50', border: '2px solid transparent', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                      onMouseOver={(e) => e.target.style.borderColor = '#18bc9c'} onMouseOut={(e) => e.target.style.borderColor = 'transparent'}>
                      {slot}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '20px', border: '1px solid #dfe6e9', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Enter Custom Charging Time</h4>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', fontWeight: 'bold' }}>START TIME</label>
                    <input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dfe6e9', boxSizing: 'border-box' }} />
                  </div>
                  <strong style={{ marginTop: '20px', color: '#7f8c8d' }}>to</strong>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', fontWeight: 'bold' }}>END TIME</label>
                    <input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dfe6e9', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button onClick={handleCustomSubmit} style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Lock Custom Time Slot
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ backgroundColor: '#fcf3cf', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <strong style={{ color: '#f39c12', display: 'block', fontSize: '18px' }}>Slot Locked: {activeLock.timeSlot}</strong>
                <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Complete payment to secure your reservation.</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>⏳ {formatTime(timeLeft)}</div>
            </div>

            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Secure Escrow Checkout</h3>
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ padding: '20px', border: '1px solid #dfe6e9', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Estimated Charging Fee</span><strong>₹ 250.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#7f8c8d' }}>
                  <span>Platform Convenience Fee</span><strong>₹ 15.00</strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #dfe6e9' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '18px' }}>
                  <strong>Total to Hold in Escrow</strong><strong style={{ color: '#18bc9c' }}>₹ 265.00</strong>
                </div>
              </div>

              <input type="text" placeholder="Mock Credit Card Number (16 digits)" required maxLength="16" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px', outline: 'none' }} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => { setActiveLock(null); window.location.reload(); }} style={{ padding: '15px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Cancel Lock</button>
                <button type="submit" style={{ padding: '15px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 2 }}>Confirm & Pay</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;