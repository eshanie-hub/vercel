import React from 'react';
import { useNavigate } from 'react-router-dom';


const navStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

  .nav-container {
    background-color: #1e3a6e;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 25px;
    font-family: 'Poppins', sans-serif;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-circle {
    background: white;
    width: 40px; /* Slightly larger to showcase the logo */
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden; /* Ensures image doesn't bleed past the circle */
  }

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Maintains aspect ratio while filling the circle */
  }

  .brand-name {
    font-weight: 600;
    font-size: 1.2rem;
    letter-spacing: 0.5px;
  }

  .btn-logout {
    background-color: #3182ce;
    color: white;
    border: none;
    padding: 6px 35px;
    border-radius: 6px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-logout:hover {
    background-color: #2b6cb0;
  }
`;

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic (e.g., localStorage.clear())
    navigate('/login');
  };

  return (
    <>
      <style>{navStyles}</style>
      <nav className="nav-container">
        <div className="logo-section">
          <div className="logo-circle">
            <img 
              src="/logo.png" 
              alt="MediPORT Logo" 
              className="logo-img" 
            />
          </div>
          <span className="brand-name">MediPORT</span>
        </div>
        
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </nav>
    </>
  );
}