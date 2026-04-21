import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://afrilive-production.up.railway.app/api/v1';
export const TOKEN_KEY = 'AUTH_TOKEN';

// Registered by AuthProvider so the 401 handler can trigger a logout
let _signOut = null;
export const setSignOutHandler = (fn) => { _signOut = fn; };

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: clear token and trigger logout so RootNavigator shows auth screens
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      _signOut?.();
    }
    return Promise.reject(error);
  },
);

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const register = (phone, name, role) =>
  api.post('/auth/register', { phone, name, role });
export const addRole = (role) => api.post('/auth/add-role', { role });
export const getMe = () => api.get('/auth/me');

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
export const getMyProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ── STREAMS ──────────────────────────────────────────────────────────────────
export const getLiveStreams = () => api.get('/streams');
export const createStream = (data) => api.post('/streams', data);
export const updateStream = (id, data) => api.put(`/streams/${id}`, data);
export const startStream = (id) => api.put(`/streams/${id}/start`);
export const endStream = (id) => api.put(`/streams/${id}/end`);
export const pinProduct = (streamId, productId) =>
  api.put(`/streams/${streamId}/pin-product`, { productId });

// ── ORDERS ───────────────────────────────────────────────────────────────────
export const createOrder = (data) => api.post('/orders', data);
export const getBuyerOrders = () => api.get('/orders/buyer');
export const getSellerOrders = () => api.get('/orders/seller');
export const getOrdersBySmartAddress = (code) =>
  api.get(`/orders/smartaddress/${code}`);

// ── DELIVERY ─────────────────────────────────────────────────────────────────
export const trackDelivery = (orderId) => api.get(`/delivery/${orderId}/track`);
export const updateRiderLocation = (orderId, lat, lng) =>
  api.put(`/delivery/${orderId}/location`, { lat, lng });

export default api;
