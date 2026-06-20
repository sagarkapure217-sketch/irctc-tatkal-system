import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage on initial load
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // simple loading state
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
        />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                  <Navigate to="/dashboard" replace /> : 
                  <Login setIsAuthenticated={setIsAuthenticated} />
              } 
            />
            
            <Route 
              path="/signup" 
              element={
                isAuthenticated ? 
                  <Navigate to="/dashboard" replace /> : 
                  <Signup setIsAuthenticated={setIsAuthenticated} />
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? 
                  <Dashboard /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            {/* Default redirect */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
