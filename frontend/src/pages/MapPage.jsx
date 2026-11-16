import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Reliable on-brand custom EV station pin
const createMarkerIcon = (isAvailable) => {
  const bg = isAvailable ? '#18bc9c' : '#e74c3c';
  return L.divIcon({
    className: 'custom-ev-marker',
    html: `
      <div style="
        background-color: ${bg}; 
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-size: 18px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.35); 
        border: 3px solid white;
        transition: transform 0.2s;
        cursor: pointer;
      ">
        ⚡
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

const MapPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/stations');
      setStations(res.data || []);
    } catch (err) {
      console.error("Error loading stations:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      
      {/* MAP CONTROLS OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '60px',
        zIndex: 500,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(5px)',
        padding: '10px 18px',
        borderRadius: '25px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#2c3e50'
      }}>
        <span>⚡ Live Chargers: <strong>{stations.length} Active</strong></span>
        <span style={{ color: '#bdc3c7' }}>|</span>
        <span style={{ color: '#18bc9c' }}>● Available</span>
        <span style={{ color: '#e74c3c' }}>● Full / Busy</span>
      </div>

      <MapContainer 
        center={[23.2599, 77.4126]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        {stations.map(station => {
          const lat = Number(station.lat);
          const lng = Number(station.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isAvailable = (station.availablePorts || 0) > 0;

          return (
            <Marker 
              key={station._id} 
              position={[lat, lng]}
              icon={createMarkerIcon(isAvailable)}
            >
              <Popup>
                <div style={{ minWidth: '220px', padding: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{station.name}</strong>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: isAvailable ? '#e8f8f5' : '#fde8e8',
                      color: isAvailable ? '#18bc9c' : '#e74c3c',
                      fontWeight: 'bold'
                    }}>
                      {isAvailable ? 'AVAILABLE' : 'FULL'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#7f8c8d', lineHeight: '1.4' }}>
                    📍 {station.address}
                  </p>

                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: '#7f8c8d' }}>Plug Type</span>
                      <strong style={{ display: 'block', color: '#2c3e50' }}>{station.plugType || 'CCS2'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#7f8c8d' }}>Power</span>
                      <strong style={{ display: 'block', color: '#2c3e50' }}>{station.powerOutput || 50} kW</strong>
                    </div>
                    <div>
                      <span style={{ color: '#7f8c8d' }}>Price</span>
                      <strong style={{ display: 'block', color: '#f39c12' }}>₹{station.hourlyRate || 250}/hr</strong>
                    </div>
                  </div>

                  <div style={{ 
                    marginBottom: '12px', 
                    textAlign: 'center', 
                    padding: '6px', 
                    backgroundColor: isAvailable ? '#e8f8f5' : '#fef9e7', 
                    borderRadius: '6px' 
                  }}>
                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>Ports Free: </span>
                    <strong style={{ color: isAvailable ? '#18bc9c' : '#e74c3c', fontSize: '15px' }}>
                      {station.availablePorts || 0} / {station.totalPorts || 2}
                    </strong>
                  </div>

                  {isAvailable ? (
                    <button 
                      onClick={() => navigate(`/book/${station._id}`)}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: '#18bc9c', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        fontSize: '14px',
                        boxShadow: '0 2px 6px rgba(24, 188, 156, 0.4)'
                      }}
                    >
                      📅 Book Charging Slot
                    </button>
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      padding: '10px', 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      textAlign: 'center', 
                      borderRadius: '6px', 
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}>
                      All Ports Occupied
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
    </div>
  );
};

export default MapPage;
