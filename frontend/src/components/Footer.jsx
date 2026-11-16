import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const teamMembers = [
    { name: 'Sourabh Rajput', phone: '6260763368', email: 'sr5956145@gmail.com', role: 'Team Lead' },
    { name: 'Vishal Kumar Madheshiya', phone: '7054527210', email: '0112cs231149@gmail.com', rollNo: '0112CS231149' },
    { name: 'Raina Rahangdale', phone: '8349459369', email: 'rainarahangdale1@gmail.com', rollNo: '0112CS231101' },
    { name: 'Riddhima Jain', phone: '7440827804', email: 'riddhimajain@gmail.com', rollNo: '0112CS231142' },
    { name: 'Sumit Kumar Gupta', phone: '9122777671', email: 'sumitguptaofficial04@gmail.com', rollNo: '0112CS231137' },
  ];

  return (
    <footer style={{ backgroundColor: '#2c3e50', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
      
      {/* Navigation & Resources */}
      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#18bc9c', textDecoration: 'none', fontWeight: 'bold' }}>Live Map</Link>
        <Link to="/verify-arrival" style={{ color: '#18bc9c', textDecoration: 'none', fontWeight: 'bold' }}>QR Scanner</Link>
        <Link to="/register-station" style={{ color: '#18bc9c', textDecoration: 'none', fontWeight: 'bold' }}>Become a Host</Link>
        <Link to="/profile" style={{ color: '#18bc9c', textDecoration: 'none', fontWeight: 'bold' }}>My Profile</Link>
      </div>

      {/* College & Project Badge */}
      <div style={{ marginBottom: '25px', padding: '12px', backgroundColor: '#34495e', borderRadius: '8px', maxWidth: '700px', margin: '0 auto 25px auto' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#18bc9c' }}>
          BANSAL INSTITUTE OF SCIENCE & TECHNOLOGY, BHOPAL
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#bdc3c7' }}>
          Department of Computer Science and Engineering • Session July-December 2026
        </p>
      </div>

      {/* Team Details Section */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ color: '#ecf0f1', marginBottom: '15px' }}>Project Group Members</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
          {teamMembers.map((member, index) => (
            <div key={index} style={{ backgroundColor: '#34495e', padding: '12px 18px', borderRadius: '8px', minWidth: '220px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{member.name}</p>
              {member.rollNo && (
                <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#18bc9c' }}>Roll: {member.rollNo}</p>
              )}
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#bdc3c7' }}>📞 {member.phone}</p>
              <p style={{ margin: '0', fontSize: '12px' }}>
                ✉️ <a href={`mailto:${member.email}`} style={{ color: '#18bc9c', textDecoration: 'none' }}>{member.email}</a>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid #34495e', paddingTop: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#bdc3c7' }}>
          &copy; 2026 VoltSync – EV Charging Station Locator & Slot Booking System. All rights reserved.
        </p>
      </div>
      
    </footer>
  );
};

export default Footer;
