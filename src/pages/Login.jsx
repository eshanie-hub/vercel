import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import bgImage from '../assets/login.png';
import API_BASE_URL from '../../route/api';

const loginStyles = `
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
    margin-bottom: 30px;
  }

  .input-group {
    text-align: left;
    margin-bottom: 15px;
  }

  .input-group label {
    font-size: clamp(0.8rem, 2.5vw, 0.95rem);
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

  .input-wrapper input {
    border: none;
    outline: none;
    width: 100%;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(0.8rem, 2.5vw, 0.95rem);
  }

  .btn-submit {
    background: #2d82cc;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    font-size: clamp(0.85rem, 2.5vw, 1rem);
    margin-top: 20px;
    transition: background 0.3s;
  }

  .btn-submit:hover { background: #1e6fb3; }

  .register-row {
    margin: 25px 0;
    font-size: clamp(0.85rem, 2.5vw, 1.05rem);
    font-weight: 500;
    color: #3f51b5;
  }

  .reg-link {
    color: #4a90e2;
    text-decoration: none;
    font-weight: 600;
  }

  /* Tablet */
  @media (max-width: 768px) {
    .auth-card {
      padding: 30px 25px;
      border-radius: 28px;
      max-width: 420px;
    }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .auth-container {
      padding: 16px;
      align-items: center;
    }

    .auth-card {
      padding: 28px 20px;
      border-radius: 24px;
    }

    .input-wrapper {
      padding: 9px;
    }

    .btn-submit {
      padding: 11px;
      margin-top: 16px;
    }

    .register-row {
      margin: 18px 0;
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

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ medicineBoxId: '', userId: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);

      if (response.data.success) {
        const id = response.data.user.userId;
        if (id.startsWith('d')) navigate('/driver');
        else if (id.startsWith('r')) navigate('/report');
        else if (id.startsWith('s')) navigate('/system');
        else alert("Unauthorized role");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <style>{loginStyles}</style>
      <div className="auth-card">
        <h1 style={{ color: '#2d4a8a' }}>Sign in</h1>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Medicine Box ID</label>
            <div className="input-wrapper">
              <input type="text" placeholder="Enter Box ID"
                onChange={(e) => setFormData({ ...formData, medicineBoxId: e.target.value })} required />
            </div>
          </div>
          <div className="input-group">
            <label>User ID</label>
            <div className="input-wrapper">
              <input type="text" placeholder="e.g. d1234"
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })} required />
            </div>
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input type="password" placeholder="••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
          </div>
          <div className="register-row">
            Don't have an account? <Link to="/register" className="reg-link">Register</Link>
          </div>
          <button type="submit" className="btn-submit">Login</button>
        </form>
      </div>
    </div>
  );
}