import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext(null);

const ROLE_KEY = '@smartaddress:role';
const NAME_KEY = '@smartaddress:userName';

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(null); // 'resident' | 'rider' | null
  const [userName, setUserNameState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedRole, storedName] = await Promise.all([
          AsyncStorage.getItem(ROLE_KEY),
          AsyncStorage.getItem(NAME_KEY),
        ]);
        if (storedRole) setRoleState(storedRole);
        if (storedName) setUserNameState(storedName);
      } catch (e) {
        console.warn('Failed to load auth:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setRole = useCallback(async (newRole, name = '') => {
    setRoleState(newRole);
    setUserNameState(name);
    await Promise.all([
      AsyncStorage.setItem(ROLE_KEY, newRole),
      AsyncStorage.setItem(NAME_KEY, name),
    ]);
  }, []);

  const clearRole = useCallback(async () => {
    setRoleState(null);
    setUserNameState('');
    await Promise.all([
      AsyncStorage.removeItem(ROLE_KEY),
      AsyncStorage.removeItem(NAME_KEY),
    ]);
  }, []);

  return (
    <AuthContext.Provider value={{ role, userName, loading, setRole, clearRole }}>
      {children}
    </AuthContext.Provider>
  );
}
