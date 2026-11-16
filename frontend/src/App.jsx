import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/MapPage';
import BookingPage from './pages/BookingPage';
import QRScanPage from './pages/QRScanPage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import ProfilePage from './pages/ProfilePage';
import RegisterStation from './pages/RegisterStation';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css'; 

function App() {
  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        <Navbar />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/book/:stationId" element={<BookingPage />} />
            <Route path="/verify-arrival" element={<QRScanPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<VerifyOTP />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/register-station" element={<RegisterStation />} />
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
