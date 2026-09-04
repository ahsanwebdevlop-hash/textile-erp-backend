import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (token) fetchUser();
    else setLoading(false);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data.data;
      localStorage.setItem('tf_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (!res.data?.data?.token || !res.data?.data?.role) {
      throw new Error('Login response did not include a valid token and role');
    }
    const { token, ...userData } = res.data.data;
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const register = async (name, email, password, role = 'employee') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    return res.data.message;
  };

  const getRoleDashboard = (role) => ({
    admin: '/admin-dashboard',
    manager: '/admin-dashboard',
    employee: '/employee-dashboard',
    customer: '/customer-dashboard',
  }[String(role).toLowerCase()] || '/employee-dashboard');

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AppContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, hasRole, getRoleDashboard }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
