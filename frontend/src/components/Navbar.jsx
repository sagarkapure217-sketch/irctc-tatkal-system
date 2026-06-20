import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Tatkal Window</div>
      {isAuthenticated && (
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;
