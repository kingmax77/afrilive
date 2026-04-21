import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY, verifyOtp, register } from '../services/api';

export const AuthContext = createContext(null);

const ROLES_KEY = '@smartaddress:roles';
const ACTIVE_ROLE_KEY = '@smartaddress:activeRole';
const NAME_KEY = '@smartaddress:userName';
const PHONE_KEY = '@smartaddress:phone';

function normalizeRoles(rawRoles) {
  if (!Array.isArray(rawRoles) || rawRoles.length === 0) return [];
  return rawRoles
    .map(r => {
      const u = r.toUpperCase();
      if (u === 'RIDER') return 'RIDER';
      if (u === 'RESIDENT' || u === 'BUYER') return 'RESIDENT';
      return u;
    })
    .filter((v, i, a) => a.indexOf(v) === i);
}

function pickActiveRole(roles) {
  if (roles.includes('RESIDENT')) return 'resident';
  if (roles.includes('RIDER')) return 'rider';
  return null;
}

export function AuthProvider({ children }) {
  const [roles, setRolesState] = useState([]);
  const [activeRole, setActiveRoleState] = useState(null);
  const [userName, setUserNameState] = useState('');
  const [phone, setPhoneState] = useState('');
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedRoles, storedActiveRole, storedName, storedPhone, storedToken] = await Promise.all([
          AsyncStorage.getItem(ROLES_KEY),
          AsyncStorage.getItem(ACTIVE_ROLE_KEY),
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(PHONE_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
        ]);
        if (storedRoles) {
          const parsed = JSON.parse(storedRoles);
          setRolesState(parsed);
          const ar = storedActiveRole ?? pickActiveRole(parsed);
          if (ar) setActiveRoleState(ar);
        }
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

  // Returns { isNewUser, user } — isNewUser=true when roles array is empty
  const loginWithOtp = useCallback(async (phoneNumber, otp) => {
    const { token: jwt, user, isNewUser } = await verifyOtp(phoneNumber, otp);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt);
    await AsyncStorage.setItem(PHONE_KEY, phoneNumber);
    setTokenState(jwt);
    setPhoneState(phoneNumber);

    const userRoles = normalizeRoles(user.roles ?? (user.role ? [user.role] : []));
    const needsRegistration = isNewUser || userRoles.length === 0;

    if (!needsRegistration) {
      // Only auto-pick an active role when the user has exactly one role.
      // Multi-role users are routed to RoleSwitcherScreen so they can choose.
      const ar = userRoles.length === 1 ? pickActiveRole(userRoles) : null;
      const storageOps = [
        AsyncStorage.setItem(ROLES_KEY, JSON.stringify(userRoles)),
        AsyncStorage.setItem(NAME_KEY, user.name ?? ''),
      ];
      if (ar) {
        storageOps.push(AsyncStorage.setItem(ACTIVE_ROLE_KEY, ar));
      } else {
        storageOps.push(AsyncStorage.removeItem(ACTIVE_ROLE_KEY));
      }
      await Promise.all(storageOps);
      setRolesState(userRoles);
      setActiveRoleState(ar);
      setUserNameState(user.name ?? '');
    }

    return {
      isNewUser: needsRegistration,
      isReturningUser: !isNewUser && needsRegistration,
      isMultiRole: !needsRegistration && normalizeRoles(user.roles ?? []).length > 1,
      user,
    };
  }, []);

  const completeRegistration = useCallback(async (phoneNumber, name, selectedRole) => {
    const { token: jwt, user } = await register(phoneNumber, name, selectedRole);
    const newRoles = normalizeRoles(user.roles ?? [selectedRole]);
    const ar = pickActiveRole(newRoles);

    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt),
      AsyncStorage.setItem(ROLES_KEY, JSON.stringify(newRoles)),
      AsyncStorage.setItem(ACTIVE_ROLE_KEY, ar),
      AsyncStorage.setItem(NAME_KEY, name),
    ]);
    setTokenState(jwt);
    setRolesState(newRoles);
    setActiveRoleState(ar);
    setUserNameState(name);
  }, []);

  // Called from ProfileScreen to add a second role to an existing user
  const addRole = useCallback(async (newRole) => {
    const { token: jwt, user } = await register(phone, userName, newRole);
    const updatedRoles = normalizeRoles(user.roles ?? [...roles, newRole]);
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt),
      AsyncStorage.setItem(ROLES_KEY, JSON.stringify(updatedRoles)),
    ]);
    setTokenState(jwt);
    setRolesState(updatedRoles);
  }, [phone, userName, roles]);

  const switchActiveRole = useCallback(async (newActiveRole) => {
    setActiveRoleState(newActiveRole);
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, newActiveRole);
  }, []);

  const clearActiveRole = useCallback(async () => {
    setActiveRoleState(null);
    await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
  }, []);

  const logout = useCallback(async () => {
    setRolesState([]);
    setActiveRoleState(null);
    setUserNameState('');
    setPhoneState('');
    setTokenState(null);
    await Promise.all([
      AsyncStorage.removeItem(ROLES_KEY),
      AsyncStorage.removeItem(ACTIVE_ROLE_KEY),
      AsyncStorage.removeItem(NAME_KEY),
      AsyncStorage.removeItem(PHONE_KEY),
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    ]);
  }, []);

  // Backward-compat shim — kept so existing callers don't break
  const setRole = useCallback(async (newRole, name = '') => {
    const ar = newRole === 'rider' ? 'rider' : 'resident';
    const newRoles = ar === 'rider' ? ['RIDER'] : ['RESIDENT'];
    setRolesState(newRoles);
    setActiveRoleState(ar);
    setUserNameState(name);
    await Promise.all([
      AsyncStorage.setItem(ROLES_KEY, JSON.stringify(newRoles)),
      AsyncStorage.setItem(ACTIVE_ROLE_KEY, ar),
      AsyncStorage.setItem(NAME_KEY, name),
    ]);
  }, []);

  const clearRole = logout;

  return (
    <AuthContext.Provider
      value={{
        roles,
        role: activeRole,   // backward-compat alias for activeRole
        activeRole,
        userName,
        phone,
        token,
        loading,
        isAuthenticated: !!token,
        loginWithOtp,
        completeRegistration,
        addRole,
        switchActiveRole,
        clearActiveRole,
        logout,
        setRole,
        clearRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
