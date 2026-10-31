import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vvs_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('vvs_token');
      const savedUser = localStorage.getItem('vvs_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          // Verify with /me
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          localStorage.setItem('vvs_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed, logging out:", err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password, booth_id = null) => {
    const payload = { username, password };
    if (booth_id) payload.booth_id = booth_id;

    const res = await api.post('/api/auth/login', payload);
    const data = res.data;
    
    setToken(data.access_token);
    setUser({
      username: data.username,
      role: data.role,
      full_name: data.full_name,
      booth_id: data.booth_id,
    });

    localStorage.setItem('vvs_token', data.access_token);
    localStorage.setItem('vvs_user', JSON.stringify({
      username: data.username,
      role: data.role,
      full_name: data.full_name,
      booth_id: data.booth_id,
    }));

    return data;
  };

  const requestOTP = async (username) => {
    const res = await api.post('/api/auth/request-otp', { username });
    return res.data;
  };

  const verifyOTP = async (username, otp_code) => {
    const res = await api.post('/api/auth/verify-otp', { username, otp_code });
    const data = res.data;

    setToken(data.access_token);
    setUser({
      username: data.username,
      role: data.role,
      full_name: data.full_name,
      booth_id: data.booth_id,
    });

    localStorage.setItem('vvs_token', data.access_token);
    localStorage.setItem('vvs_user', JSON.stringify({
      username: data.username,
      role: data.role,
      full_name: data.full_name,
      booth_id: data.booth_id,
    }));

    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vvs_token');
    localStorage.removeItem('vvs_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        boothId: user?.booth_id,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        requestOTP,
        verifyOTP,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
