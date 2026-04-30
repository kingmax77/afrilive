import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://afrilive-production.up.railway.app/api/v1';

export const AUTH_TOKEN_KEY = 'AUTH_TOKEN';

async function authFetch(path, options = {}) {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API ${res.status}: ${path}`);
  }
  return res.json();
}

async function publicFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API ${res.status}: ${path}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function sendOtp(phone) {
  return publicFetch('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone, otp) {
  return publicFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}

export async function register(phone, name, role) {
  return publicFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, name, role: role.toUpperCase() }),
  });
}

// ── Addresses ─────────────────────────────────────────────────────────────────

function normalizeAddress(a) {
  return { ...a, latitude: a.lat, longitude: a.lng };
}

export async function getMyAddresses() {
  const list = await authFetch('/addresses');
  return Array.isArray(list) ? list.map(normalizeAddress) : list;
}

export async function createAddress(data) {
  const result = await authFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify({
      label: data.label,
      lat: data.latitude,
      lng: data.longitude,
      landmark: data.landmark,
      gateColor: data.gateColor,
      floor: data.floor,
      arrivalInstructions: data.arrivalInstructions,
      photos: data.photos ?? [],
      deliveryNotes: data.deliveryNotes,
      isPrimary: data.isPrimary ?? false,
    }),
  });
  return normalizeAddress(result);
}

// ── Orders / Delivery ─────────────────────────────────────────────────────────

export async function getOrdersBySmartAddress(code) {
  return authFetch(`/orders/smartaddress/${encodeURIComponent(code)}`);
}

export async function getActiveDelivery() {
  return authFetch('/deliveries/active');
}

export async function markDelivered(orderId) {
  return authFetch(`/deliveries/${orderId}/delivered`, { method: 'PATCH' });
}

export async function getDeliveryHistory() {
  return authFetch('/deliveries/history');
}

export async function getEarnings() {
  return authFetch('/riders/earnings');
}

export async function getRiderProfile() {
  return authFetch('/riders/me');
}

export async function updateRiderProfile(data) {
  return authFetch('/riders/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function addRoleApi(phone, name, role) {
  return authFetch('/auth/add-role', {
    method: 'POST',
    body: JSON.stringify({ phone, name, role: role.toUpperCase() }),
  });
}
