import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import bgImage from '../assets/register.png';
import API_BASE_URL from '../../route/api';

const regStyles = `
  .auth-container {
    min-height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: url(${bgImage}) center/cover no-repeat;
    padding: 20px;
    box-sizing: border-box;
  }

  .auth-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 40px;
    width: 100%;
    max-width: 450px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }

  .auth-card h1 {
    font-size: clamp(1.5rem, 4vw, 2rem);
    margin-bottom: 25px;
  }

  .input-group {
    text-align: left;
    margin-bottom: 12px;
  }

  .input-group label {
    font-size: clamp(0.8rem, 2.5vw, 0.85rem);
    font-weight: 500;
    color: #4a5568;
    margin-left: 5px;
  }

  .input-wrapper {
    display: flex;
    border: 1.5px solid #2d4a8a;
    border-radius: 10px;
    padding: 10px;
    background: white;
    margin-top: 5px;
  }

  .input-wrapper input,
  .input-wrapper select {
    border: none;
    outline: none;
    width: 100%;
    font-family: 'Poppins', sans-serif;
    background: transparent;
    color: #2d3748;
    font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  }

  .input-wrapper select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d4a8a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 1em;
    padding-right: 30px;
  }

  .btn-submit {
    background: #2d82cc;
    color: white;
    border: none;
    padding: 12px 40px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 20px;
    width: 100%;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(0.85rem, 2.5vw, 1rem);
    transition: background 0.3s;
  }

  .btn-submit:hover { background: #1e6fb3; }

  .register-row {
    margin: 20px 0;
    font-size: clamp(0.85rem, 2.5vw, 1.05rem);
    font-weight: 500;
    color: #3f51b5;
  }

  .login-link {
    color: #4a90e2;
    text-decoration: none;
    font-weight: 600;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;              /* ← modal also scrollable on mobile */
  }

  .modal-content {
    background: white;
    padding: 40px;
    border-radius: 30px;
    text-align: center;
    width: 100%;
    max-width: 380px;
    box-sizing: border-box;
    margin: auto;                  /* ← keeps modal centered when scrolling */
  }

  .modal-content h2 {
    font-size: clamp(1.3rem, 4vw, 1.6rem);
    color: #1e3a6e;
  }

  .modal-content p {
    color: #718096;
    font-size: clamp(0.85rem, 2.5vw, 1rem);
  }

  .generated-id {
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    font-weight: 700;
    color: #2d82cc;
    margin: 20px 0;
    padding: 15px;
    border: 2px dashed #2d82cc;
    border-radius: 15px;
    background: #f0f7ff;
    word-break: break-all;
  }

  .btn-cancel {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(0.85rem, 2.5vw, 1rem);
    transition: background 0.3s;
  }

  .btn-cancel:hover { background: #c53030; }

  /* Tablet */
  @media (max-width: 768px) {
    .auth-card {
      padding: 30px 25px;
      border-radius: 28px;
    }

    .modal-content {
      padding: 30px 25px;
      border-radius: 24px;
    }
  }

  /* Mobile — scroll enabled here only */
  @media (max-width: 480px) {
    .auth-container {
      padding: 16px;
      align-items: flex-start;     /* ← top-align so card scrolls naturally */
      overflow-y: auto;            /* ← vertical scroll on mobile only */
      min-height: 100dvh;          /* ← dvh accounts for mobile browser chrome */
    }

    .auth-card {
      padding: 28px 20px;
      border-radius: 24px;
      margin: auto;                /* ← centers card vertically when content is short */
    }

    .input-wrapper {
      padding: 9px;
    }

    .btn-submit {
      padding: 11px;
      margin-top: 14px;
    }

    .register-row {
      margin: 15px 0;
    }

    .modal-content {
      padding: 25px 18px;
      border-radius: 20px;
    }
  }

  /* Very small screens */
  @media (max-width: 360px) {
    .auth-card {
      padding: 22px 15px;
      border-radius: 20px;
    }
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const [boxId, setBoxId] = useState('');
  const [role, setRole] = useState('driver');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [newId, setNewId] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        medicineBoxId: boxId,
        userRole: role,
        password: password
      });
      setNewId(response.data.generatedUserId);
      setShowPopup(true);
    } catch (error) {
      alert(error.response?.data?.message || "Error registering user");
    }
  };

  return (
    <div className="auth-container">
      <style>{regStyles}</style>
      <div className="auth-card">
        <h1 style={{ color: '#2d4a8a' }}>Register</h1>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Medicine Box ID</label>
            <div className="input-wrapper">
              <input type="text" placeholder="Enter Box ID"
                onChange={(e) => setBoxId(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <label>User Role</label>
            <div className="input-wrapper">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="driver">Driver</option>
                <option value="report">Report Manager</option>
                <option value="system">System Manager</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input type="password" placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <label>Re-enter Password</label>
            <div className="input-wrapper">
              <input type="password" placeholder="••••••••"
                onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <div className="register-row">
            Already have an account? <Link to="/login" className="login-link">Login</Link>
          </div>
          <button type="submit" className="btn-submit">Register</button>
        </form>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Success!</h2>
            <p>Your unique Login ID is:</p>
            <div className="generated-id">{newId}</div>
            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '20px' }}>
              Please save this ID to login to your dashboard.
            </p>
            <button className="btn-cancel" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}