import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // ✅ jwt-decode import කරන්න

const AuthContext = createContext();

const USER_STORAGE_KEY = 'burger_shop_user';
const API_URL = 'https://grilmelt-burger.onrender.com/api/users';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // If token is invalid, treat as expired
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      const userObject = savedUser ? JSON.parse(savedUser) : null;
      // ✅ Token එකේ കാലാവധി කාලය check කරන්න
      if (userObject && userObject.token && !isTokenExpired(userObject.token)) {
        setUser(userObject);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const handleSuccessfulAuth = useCallback((authenticatedUser) => {
    // The backend already removes the password. We store the user object and token.
    const userToStore = authenticatedUser;
    setUser(userToStore);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      handleSuccessfulAuth(response.data);
    } catch (error) {
      // axios wraps errors in error.response.data
      throw new Error(error.response?.data?.message || error.message || 'Failed to log in');
    }
  }, [handleSuccessfulAuth]);

  const register = useCallback(async (email, password, name) => {
    try {
      const response = await axios.post(`${API_URL}/register`, { name, email, password });
      handleSuccessfulAuth(response.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to register');
    }
  }, [handleSuccessfulAuth]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);
    
  return (
    <AuthContext.Provider value={useMemo(() => ({ 
        user, setUser, // ✅ setUser function එක context එකට එකතු කරන ලදී
        login, register, logout, isAuthenticated: !!user?.token 
    }), [user, login, register, logout, setUser])}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
