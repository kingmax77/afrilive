import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY, verifyOtp, register } from '../services/api';

export const AuthContext = createContext(null);

const ROLE_KEY = '@smartaddress:role';
const NAME_KEY = '@smartaddress:userName';
const PHONE_KEY = '@smartaddress:phone';

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(null);
  const [userName, setUserNameState] = useState('');
  const [phone, setPhoneState] = useState('');
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedRole, storedName, storedPhone, storedToken] = await Promise.all([
          AsyncStorage.getItem(ROLE_KEY),
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(PHONE_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
        ]);
        if (storedRole) setRoleState(storedRole);
        if (storedName) setUserNameState(storedName);
        if (storedPhone) setPhoneState(storedPhone);
        if (storedToken) setTokenState(storedToken);
      } catch (e) {
        console.warn('Failed to load auth:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Called after OTP is verified. If existing user (isNewUser=false), completes login.
  const loginWithOtp = useCallback(async (phoneNumber, otp) => {
    const { token: jwt, user, isNewUser } = await verifyOtp(phoneNumber, otp);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt);
    await AsyncStorage.setItem(PHONE_KEY, phoneNumber);
    setTokenState(jwt);
    setPhoneState(phoneNumber);

    if (!isNewUser) {
      const roleKey = user.role?.toLowerCase() === 'rider' ? 'rider' : 'resident';
      setRoleState(roleKey);
      setUserNameState(user.name);
      await Promise.all([
        AsyncStorage.setItem(ROLE_KEY, roleKey),
        AsyncStorage.setItem(NAME_KEY, user.name),
      ]);
    }

    return { isNewUser, user };
  }, []);

  // Called on the registration step to complete the profile.
  const completeRegistration = useCallback(async (phoneNumber, name, selectedRole) => {
    const { token: jwt, user } = await register(phoneNumber, name, selectedRole);
    const roleKey = selectedRole.toLowerCase() === 'rider' ? 'rider' : 'resident';

    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt),
      AsyncStorage.setItem(ROLE_KEY, roleKey),
      AsyncStorage.setItem(NAME_KEY, name),
    ]);
    setTokenState(jwt);
    setRoleState(roleKey);
    setUserNameState(name);
  }, []);

  const logout = useCallback(async () => {
    setRoleState(null);
    setUserNameState('');
    setPhoneState('');
    setTokenState(null);
    await Promise.all([
      AsyncStorage.removeItem(ROLE_KEY),
      AsyncStorage.removeItem(NAME_KEY),
      AsyncStorage.removeItem(PHONE_KEY),
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    ]);
  }, []);

  // Legacy shim kept so ProfileScreen / other callers don't break
  const setRole = useCallback(async (newRole, name = '') => {
    setRoleState(newRole);
    setUserNameState(name);
    await Promise.all([
      AsyncStorage.setItem(ROLE_KEY, newRole),
      AsyncStorage.setItem(NAME_KEY, name),
    ]);
  }, []);

  const clearRole = logout;

  return (
    <AuthContext.Provider
      value={{
        role,
        userName,
        phone,
        token,
        loading,
        isAuthenticated: !!token,
        loginWithOtp,
        completeRegistration,
        logout,
        setRole,
        clearRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
