import React from 'react';

const Footer = () => {
  const teamMembers = [
    { name: 'Sourabh Rajput', phone: '6260763368', email: 'sr5956145@gmail.com', rollNo: null },
    { name: 'Vishal Kumar Madheshiya', phone: '7054527210', email: '0112cs231149@gmail.com', rollNo: '0112CS231149' },
    { name: 'Raina Rahangdale', phone: '8349459369', email: 'rainarahangdale1@gmail.com', rollNo: '0112CS231101' },
    { name: 'Ursheeta Jain', phone: '7440827804', email: 'ursheetajain10@gmail.com', rollNo: '0112CS231142' },
    { name: 'Sumit Kumar Gupta', phone: '9122777671', email: 'sumitguptaofficial04@gmail.com', rollNo: '0112CS231137' },
  ];

  return (
    <footer style={{ backgroundColor: '#2c3e50', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
      
      {/* Navigation & Resources */}
      <div style={{ marginBottom: '30px' }}>
        <a href="/about" style={{ color: '#18bc9c', margin: '0 15px', textDecoration: 'none', fontWeight: 'bold' }}>About Us</a>
        <a href="/contact" style={{ color: '#18bc9c', margin: '0 15px', textDecoration: 'none', fontWeight: 'bold' }}>Contact</a>
        <a href="/host" style={{ color: '#18bc9c', margin: '0 15px', textDecoration: 'none', fontWeight: 'bold' }}>Become a Host</a>
        {/* Presentation Download Link */}
        <a 
          href="/SIH_2026_Coder_Hero_ppt.pptx" 
          download 
          style={{ color: '#f39c12', margin: '0 15px', textDecoration: 'none', fontWeight: 'bold' }}
        >
          📄 About Project
        </a>
      </div>

      {/* Team Details Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#18bc9c', marginBottom: '20px' }}>The Coder Hero Team 467</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {teamMembers.map((member, index) => (
            <div key={index} style={{ backgroundColor: '#34495e', padding: '15px', borderRadius: '8px', minWidth: '240px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 5px', fontWeight: 'bold', fontSize: '16px' }}>{member.name}</p>
              {member.rollNo && (
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#bdc3c7' }}>Roll No: {member.rollNo}</p>
              )}
              <p style={{ margin: '0 0 5px', fontSize: '14px' }}>📞 {member.phone}</p>
              <p style={{ margin: '0', fontSize: '14px' }}>
                ✉️ <a href={`mailto:${member.email}`} style={{ color: '#18bc9c', textDecoration: 'none' }}>{member.email}</a>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid #34495e', paddingTop: '20px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#bdc3c7' }}>
          &copy; 2026 VoltSync (Team 467) - Vision 2047 Viksit Bharat. All rights reserved.
        </p>
      </div>
      
    </footer>
  );
};

export default Footer;