import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, saveUserProfile, clearUserProfile } from '../utils/storage';
import { setSignOutHandler, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  // Wire up the 401 handler — api.js calls this when a request returns 401
  useEffect(() => {
    setSignOutHandler(async () => {
      await clearUserProfile();
      setUser(null);
    });
  }, []);

  const loadUser = async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    const profile = await getUserProfile();
    setUser(profile);
    setLoading(false);
  };

  /** Called after verifyOTP or register — persists token + normalised user */
  const signIn = async (token, apiUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    const profile = {
      id:                 apiUser.id,
      name:               apiUser.name,
      phone:              apiUser.phone,
      role:               (apiUser.role || 'BUYER').toLowerCase(),
      createdAt:          apiUser.createdAt || new Date().toISOString(),
      smartAddressCodes:  apiUser.smartAddressCodes ||
                          (['buyer', 'BUYER'].includes(apiUser.role) ? ['LGS-204-17'] : []),
      totalOrders:        0,
      totalSales:         0,
      revenue:            0,
    };
    await saveUserProfile(profile);
    setUser(profile);
    return profile;
  };

  const signOut = async () => {
    await clearUserProfile();
    setUser(null);
  };

  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };
    await saveUserProfile(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
