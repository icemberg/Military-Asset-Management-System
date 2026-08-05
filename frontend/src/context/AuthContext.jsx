import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const baseId = localStorage.getItem('baseId');
    
    if (token) {
      const parsedBaseId = (baseId && baseId !== 'null' && baseId !== 'undefined') ? Number.parseInt(baseId, 10) : null;
      return { role, baseId: parsedBaseId };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('baseId', data.baseId);
      setUser({ role: data.role, baseId: data.baseId });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('baseId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={React.useMemo(() => ({ user, login, logout, loading }), [user, loading])}>
      {children}
    </AuthContext.Provider>
  );
};
