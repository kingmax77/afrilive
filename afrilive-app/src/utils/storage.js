import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PROFILE: '@afrilive_user_profile',
  AUTH_TOKEN: 'AUTH_TOKEN', // must match TOKEN_KEY in services/api.js
  CART: '@afrilive_cart',
  ORDERS: '@afrilive_orders',
};

// Shared key read by the SmartAddress app — must match exactly
const SMARTADDRESS_SHARED_KEY = 'SMARTADDRESS_SHARED_ORDERS';

export const saveUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('saveUserProfile error:', e);
  }
};

export const getUserProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('getUserProfile error:', e);
    return null;
  }
};

export const clearUserProfile = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.USER_PROFILE, KEYS.AUTH_TOKEN]);
  } catch (e) {
    console.error('clearUserProfile error:', e);
  }
};

export const saveCart = async (cart) => {
  try {
    await AsyncStorage.setItem(KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error('saveCart error:', e);
  }
};

export const getCart = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CART);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveOrders = async (orders) => {
  try {
    await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('saveOrders error:', e);
  }
};

export const getOrders = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// ─── SmartAddress shared storage ────────────────────────────────────────────

export const getSharedOrders = async () => {
  try {
    const data = await AsyncStorage.getItem(SMARTADDRESS_SHARED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Insert a new order or replace an existing one (matched by id).
 * New orders are prepended so the SmartAddress app sees them first.
 */
export const upsertSharedOrder = async (order) => {
  try {
    const existing = await getSharedOrders();
    const idx = existing.findIndex((o) => o.id === order.id);
    let next;
    if (idx === -1) {
      next = [order, ...existing];
    } else {
      next = existing.map((o) => (o.id === order.id ? { ...o, ...order } : o));
    }
    await AsyncStorage.setItem(SMARTADDRESS_SHARED_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('upsertSharedOrder error:', e);
  }
};
