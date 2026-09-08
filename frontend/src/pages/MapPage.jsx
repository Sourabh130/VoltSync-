import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MapPage = () => {
  const [stations, setStations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/stations')
      .then(res => setStations(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    // We removed the title bar and set the height to exactly the screen height minus the navbar (approx 65px).
    // This perfectly pushes the footer below the fold so you have to scroll to see it!
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 65px)' }}>
      
      <MapContainer center={[23.2599, 77.4126]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {stations.map(station => (
          <Marker key={station._id} position={[station.lat, station.lng]}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{station.name}</strong> <br/>
                
                <div style={{ margin: '10px 0', padding: '5px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Ports Available:</span><br/>
                  <strong style={{ color: station.availablePorts > 0 ? '#18bc9c' : '#e74c3c', fontSize: '18px' }}>
                    {station.availablePorts || 0} / {station.totalPorts || 2}
                  </strong>
                </div>

                {station.availablePorts > 0 ? (
                  <button 
                    onClick={() => navigate(`/book/${station._id}`)}
                    style={{ marginTop: '5px', padding: '8px 15px', background: '#18bc9c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                  >
                    Book Slot
                  </button>
                ) : (
                  <div style={{ marginTop: '5px', padding: '8px 15px', background: '#e74c3c', color: 'white', borderRadius: '5px', fontWeight: 'bold', width: '100%' }}>
                    Currently Full
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
    </div>
  );
};

export default MapPage;