import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyAddresses } from '../services/api';

export const AddressContext = createContext(null);

const STORAGE_KEY = '@smartaddress:addresses';
const PRIMARY_KEY = '@smartaddress:primaryId';

/**
 * Address model shape:
 * {
 *   id, code, label, landmark, gateColor, floor,
 *   arrivalInstructions,  ← last-50m guidance
 *   photos,               ← array of local URIs
 *   deliveryNotes,
 *   latitude, longitude,
 *   createdAt
 * }
 */
export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState([]);
  const [primaryId, setPrimaryId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedPrimary = await AsyncStorage.getItem(PRIMARY_KEY);
        if (storedPrimary) setPrimaryId(storedPrimary);

        // Try API first; fall back to local cache if unavailable
        try {
          const apiAddresses = await getMyAddresses();
          if (Array.isArray(apiAddresses) && apiAddresses.length > 0) {
            setAddresses(apiAddresses);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(apiAddresses));
            return;
          }
        } catch (_) {
          // API unavailable — use cached data below
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setAddresses(parsed);
        }
      } catch (e) {
        console.warn('Failed to load addresses:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (updatedAddresses, updatedPrimaryId) => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAddresses)),
      AsyncStorage.setItem(PRIMARY_KEY, updatedPrimaryId ?? ''),
    ]);
  }, []);

  const addAddress = useCallback(async (newAddress) => {
    setAddresses((prev) => {
      const updated = [newAddress, ...prev];
      const newPrimary = prev.length === 0 ? newAddress.id : primaryId;
      persist(updated, newPrimary);
      if (prev.length === 0) setPrimaryId(newAddress.id);
      return updated;
    });
  }, [primaryId, persist]);

  const updateAddress = useCallback(async (id, changes) => {
    setAddresses((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...changes } : a));
      persist(updated, primaryId);
      return updated;
    });
  }, [primaryId, persist]);

  const deleteAddress = useCallback(async (id) => {
    setAddresses((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      const newPrimary = primaryId === id ? (updated[0]?.id ?? null) : primaryId;
      setPrimaryId(newPrimary);
      persist(updated, newPrimary);
      return updated;
    });
  }, [primaryId, persist]);

  const setPrimary = useCallback(async (id) => {
    setPrimaryId(id);
    await AsyncStorage.setItem(PRIMARY_KEY, id);
  }, []);

  const primaryAddress = addresses.find((a) => a.id === primaryId) ?? addresses[0] ?? null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        primaryAddress,
        primaryId,
        loading,
        addAddress,
        updateAddress,
        deleteAddress,
        setPrimary,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}
