import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [mechanic, setMechanic] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('highway_rescue_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('highway_rescue_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setMechanic(res.data.mechanic);
          }
        } catch (error) {
          console.warn('Auto auth check failed:', error.response?.data?.message || error.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Customer & User Login
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser, mechanic: receivedMech } = res.data;
        localStorage.setItem('highway_rescue_token', receivedToken);
        localStorage.setItem('highway_rescue_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setMechanic(receivedMech);
        toast.success(res.data.message || 'Login successful!');
        return { success: true, user: receivedUser };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Register Customer
  const registerCustomer = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        localStorage.setItem('highway_rescue_token', receivedToken);
        localStorage.setItem('highway_rescue_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        toast.success(res.data.message || 'Registration successful!');
        return { success: true, user: receivedUser };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Register Mechanic
  const registerMechanic = async (formData) => {
    try {
      const res = await api.post('/mechanics/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser, mechanic: receivedMech } = res.data;
        localStorage.setItem('highway_rescue_token', receivedToken);
        localStorage.setItem('highway_rescue_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setMechanic(receivedMech);
        toast.success(res.data.message || 'Mechanic registered successfully!');
        return { success: true, user: receivedUser, mechanic: receivedMech };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Mechanic registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('highway_rescue_token');
    localStorage.removeItem('highway_rescue_user');
    setToken(null);
    setUser(null);
    setMechanic(null);
    toast.info('You have been logged out.');
  };

  // Update Profile
  const updateProfile = async (data) => {
    try {
      const res = await api.put('/users/profile', data);
      if (res.data.success) {
        setUser(res.data.data);
        toast.success('Profile updated successfully!');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Toggle Mechanic Online/Offline Availability
  const toggleMechanicAvailability = async (isOnline) => {
    try {
      const res = await api.put('/mechanics/availability', { isOnline });
      if (res.data.success) {
        setMechanic((prev) => ({ ...prev, isOnline: res.data.isOnline }));
        toast.success(res.data.message);
        return { success: true, isOnline: res.data.isOnline };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mechanic,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        registerCustomer,
        registerMechanic,
        logout,
        updateProfile,
        toggleMechanicAvailability,
        setMechanic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
