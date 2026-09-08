import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import BookingPage from './pages/BookingPage';
import QRScanPage from './pages/QRScanPage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import ProfilePage from './pages/ProfilePage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import './App.css'; 
import RegisterStation from './pages/RegisterStation';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        <Navbar />
        
        {/* We added display: 'flex' and flexDirection: 'column' to main so it stretches its children */}
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
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;