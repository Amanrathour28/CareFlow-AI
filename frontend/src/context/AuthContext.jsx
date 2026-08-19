import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('careflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync fresh user profile & role from backend on app boot
  useEffect(() => {
    const token = localStorage.getItem('careflow_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then(res => {
        if (res.data) {
          localStorage.setItem('careflow_user', JSON.stringify(res.data));
          setUser(res.data);
        }
      })
      .catch(() => {
        // If token is invalid or expired, clear stale storage
        localStorage.removeItem('careflow_token');
        localStorage.removeItem('careflow_user');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('careflow_token', access_token);
    localStorage.setItem('careflow_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('careflow_token');
    localStorage.removeItem('careflow_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
