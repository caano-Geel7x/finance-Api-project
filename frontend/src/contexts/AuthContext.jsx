import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';
import api, { restoreSession, setAccessToken } from '../lib/api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const acceptSession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((session) => {
        if (active) setUser(session.user);
      })
      .catch(() => {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const expire = () => setUser(null);
    const refresh = (event) => setUser(event.detail);
    window.addEventListener('auth:expired', expire);
    window.addEventListener('auth:refreshed', refresh);
    return () => {
      active = false;
      window.removeEventListener('auth:expired', expire);
      window.removeEventListener('auth:refreshed', refresh);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return acceptSession(data);
  }, [acceptSession]);

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    return acceptSession(data);
  }, [acceptSession]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateProfilePicture = useCallback((profilePictureUrl) => {
    setUser((current) => current ? { ...current, profilePictureUrl } : current);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateProfilePicture,
  }), [user, loading, login, register, logout, updateProfilePicture]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
