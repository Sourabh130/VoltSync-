import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  // Check if a token exists in local storage
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#2c3e50', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: 0 }}>
        <Link to="/" style={{ color: '#18bc9c', textDecoration: 'none', fontWeight: 'bold', fontSize: '24px' }}>
          ⚡ VoltSync
        </Link>
      </h2>
      
      <div style={{ display: 'flex', gap: '25px', alignItems: 'center', fontWeight: '500' }}>
        <Link to="/" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Live Map</Link>
        <Link to="/verify-arrival" style={{ color: '#ecf0f1', textDecoration: 'none' }}>QR Scanner</Link>
        
        {isLoggedIn ? (
          <Link to="/profile" style={{ backgroundColor: '#18bc9c', color: 'white', padding: '8px 20px', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(24, 188, 156, 0.3)' }}>
            My Profile
          </Link>
        ) : (
          <>
            <Link to="/login" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Login</Link>
            <Link to="/signup" style={{ backgroundColor: '#18bc9c', color: 'white', padding: '8px 20px', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(24, 188, 156, 0.3)' }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;