import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, saveUserProfile, clearUserProfile } from '../utils/storage';
import { setSignOutHandler, TOKEN_KEY } from '../services/api';

export const ACTIVE_ROLE_KEY = 'ACTIVE_ROLE';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState('BUYER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    setSignOutHandler(async () => {
      await clearUserProfile();
      await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
      setUser(null);
      setActiveRole('BUYER');
    });
  }, []);

  const loadUser = async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    const profile = await getUserProfile();
    if (profile) {
      // Normalize old single-role profiles that stored role as a string
      if (!profile.roles) {
        profile.roles = [(profile.role || 'BUYER').toUpperCase()];
      }
      const storedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
      const active =
        storedRole && profile.roles.includes(storedRole)
          ? storedRole
          : profile.roles[0] || 'BUYER';
      setActiveRole(active);
      setUser(profile);
    }
    setLoading(false);
  };

  /** Called after verifyOTP or register — persists token + normalised user */
  const signIn = async (token, apiUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    const roles = apiUser.roles?.length
      ? apiUser.roles.map((r) => r.toUpperCase())
      : [(apiUser.role || 'BUYER').toUpperCase()];

    const profile = {
      id:                apiUser.id,
      name:              apiUser.name,
      phone:             apiUser.phone,
      roles,
      createdAt:         apiUser.createdAt || new Date().toISOString(),
      smartAddressCodes: apiUser.smartAddressCodes ||
                         (roles.includes('BUYER') ? ['LGS-204-17'] : []),
      totalOrders:       0,
      totalSales:        0,
      revenue:           0,
    };
    await saveUserProfile(profile);

    const storedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
    const newActive =
      storedRole && roles.includes(storedRole) ? storedRole : roles[0];
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, newActive);

    setUser(profile);
    setActiveRole(newActive);
    return profile;
  };

  const signOut = async () => {
    await clearUserProfile();
    await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
    setUser(null);
    setActiveRole('BUYER');
  };

  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };
    await saveUserProfile(updated);
    setUser(updated);
  };

  const switchRole = async (role) => {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, signIn, signOut, updateUser, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
