import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create custom axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure token authorization header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const signup = async (name, email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/signup', { name, email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser({
          success: true,
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          profile: res.data.profile,
        });
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser({
          success: true,
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          profile: res.data.profile,
        });
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await api.put('/auth/profile', {
        name: profileData.name,
        profile: {
          degree: profileData.degree,
          department: profileData.department,
          currentYear: profileData.currentYear,
          skills: profileData.skills,
          areasOfInterest: profileData.areasOfInterest,
          careerGoal: profileData.careerGoal,
        },
      });
      if (res.data.success) {
        setUser(res.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        signup,
        login,
        logout,
        updateProfile,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
