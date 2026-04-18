export const formatViewerCount = (count) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
};

export const formatCurrency = (amount, currency = 'NGN') => {
  const symbols = { NGN: '₦', KES: 'KSh', GHS: 'GH₵', UGX: 'USh', TZS: 'TSh' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};

export const MOCK_PRODUCTS = [
  { id: 'p1', sellerId: 'seller_1', name: 'Ankara Wrap Dress', price: 12500, currency: 'NGN', stock: 8, category: 'Fashion', available: true, gradient: ['#e8a020', '#f5b84a'] },
  { id: 'p2', sellerId: 'seller_1', name: 'Gold Hoop Earrings', price: 4500, currency: 'NGN', stock: 20, category: 'Fashion', available: true, gradient: ['#7b3a00', '#c0392b'] },
  { id: 'p3', sellerId: 'seller_1', name: 'Leather Crossbody Bag', price: 18000, currency: 'NGN', stock: 5, category: 'Fashion', available: true, gradient: ['#1a1a2e', '#4a0080'] },
  { id: 'p4', sellerId: 'seller_1', name: 'Kente Print Shirt', price: 8000, currency: 'NGN', stock: 12, category: 'Fashion', available: false, gradient: ['#0b3d2e', '#1a6b3c'] },
  { id: 'p5', sellerId: 'seller_2', name: 'Wireless Earbuds', price: 4500, currency: 'KES', stock: 15, category: 'Electronics', available: true, gradient: ['#0d1b2a', '#1565c0'] },
];

export const MOCK_STREAMS = [
  {
    id: 's1', sellerId: 'seller_1', sellerName: 'Ada Okonkwo', location: 'Lagos, NG',
    title: '🔥 New Ankara Collection — Live Unboxing!', category: 'Fashion',
    isLive: true, viewerCount: 1240, gradient: ['#1a1a2e', '#e8a020'],
    pinnedProduct: { id: 'p1', name: 'Ankara Wrap Dress', price: 12500, currency: 'NGN', gradient: ['#e8a020', '#f5b84a'] },
  },
  {
    id: 's2', sellerId: 'seller_2', sellerName: 'Kofi Mensah', location: 'Accra, GH',
    title: 'Best Tech Deals This Week 💻', category: 'Electronics',
    isLive: true, viewerCount: 876, gradient: ['#0d1b2a', '#1b4f72'],
    pinnedProduct: { id: 'p5', name: 'Wireless Earbuds', price: 4500, currency: 'KES', gradient: ['#1b4f72', '#2980b9'] },
  },
  {
    id: 's3', sellerId: 'seller_3', sellerName: 'Amina Diallo', location: 'Nairobi, KE',
    title: 'Friday Beauty Haul 💄', category: 'Beauty',
    isLive: false, startTime: '3:00 PM', viewerCount: 0, gradient: ['#2d132c', '#ee4540'],
    pinnedProduct: null,
  },
];

export const DISCOVERY_MOCK_STREAMS = [
  {
    id: 'mock_1',
    sellerName: 'Adaeze Boutique',
    location: 'Lagos, Nigeria 🇳🇬',
    title: '✨ New Ankara arrivals — tap to grab yours!',
    category: 'Fashion',
    isLive: true,
    viewerCount: 4217,
    gradient: ['#1a0a2e', '#e8a020'],
    pinnedProduct: { name: 'Ankara Wrap Dress', price: 18500, currency: 'NGN', gradient: ['#e8a020', '#f5b84a'] },
  },
  {
    id: 'mock_2',
    sellerName: 'TechHub Lagos',
    location: 'Victoria Island, Nigeria 🇳🇬',
    title: '🎧 Best audio deals on the continent right now',
    category: 'Electronics',
    isLive: true,
    viewerCount: 1843,
    gradient: ['#0d1b2a', '#1b4f72'],
    pinnedProduct: { name: 'Wireless Earbuds Pro', price: 12000, currency: 'NGN', gradient: ['#1b4f72', '#2980b9'] },
  },
  {
    id: 'mock_3',
    sellerName: 'NaturalGlow',
    location: 'Nairobi, Kenya 🇰🇪',
    title: '🌿 Natural skincare for African skin — watch & learn',
    category: 'Beauty',
    isLive: false,
    startTime: '2:30 PM',
    viewerCount: 892,
    gradient: ['#0b3d2e', '#1a6b3c'],
    pinnedProduct: { name: 'Shea Butter Gift Set', price: 2800, currency: 'KES', gradient: ['#1a6b3c', '#27ae60'] },
  },
  {
    id: 'mock_4',
    sellerName: 'KE Electronics',
    location: 'Kampala, Uganda 🇺🇬',
    title: '🔋 Power Bank flash sale — limited units!',
    category: 'Electronics',
    isLive: false,
    startTime: '4:00 PM',
    viewerCount: 2104,
    gradient: ['#1a1a1a', '#3d1a00'],
    pinnedProduct: { name: 'Power Bank 20000mAh', price: 35000, currency: 'UGX', gradient: ['#3d1a00', '#e8a020'] },
  },
  {
    id: 'mock_5',
    sellerName: 'FashionByAmaka',
    location: 'Accra, Ghana 🇬🇭',
    title: '🎨 Kente prints restocked — beautiful African fashion',
    category: 'Fashion',
    isLive: true,
    viewerCount: 673,
    gradient: ['#1a0d00', '#8b4513'],
    pinnedProduct: { name: 'Kente Print Dress', price: 180, currency: 'GHS', gradient: ['#8b4513', '#d4a017'] },
  },
  {
    id: 'mock_6',
    sellerName: 'SpiceMarket',
    location: 'Dar es Salaam, Tanzania 🇹🇿',
    title: '🌶️ Authentic Zanzibar spices — smell through the screen!',
    category: 'Food',
    isLive: true,
    viewerCount: 445,
    gradient: ['#1a0a00', '#7b2d00'],
    pinnedProduct: { name: 'Zanzibar Spice Bundle', price: 25000, currency: 'TZS', gradient: ['#7b2d00', '#c0392b'] },
  },
];

export const MOCK_BUYER_ORDERS = [
  { id: 'o1', productName: 'Ankara Wrap Dress', sellerName: 'Ada Okonkwo', price: 12500, currency: 'NGN', status: 'delivered', orderedAt: Date.now() - 86400000 * 3 },
  { id: 'o2', productName: 'Gold Hoop Earrings', sellerName: 'Ada Okonkwo', price: 4500, currency: 'NGN', status: 'in_transit', orderedAt: Date.now() - 86400000 },
  { id: 'o3', productName: 'Wireless Earbuds', sellerName: 'Kofi Mensah', price: 4500, currency: 'KES', status: 'confirmed', orderedAt: Date.now() - 3600000 },
];

export const MOCK_CHAT_MESSAGES = [
  { id: 'c1', user: 'Temi_Lagos', text: 'This dress is everything! 😍' },
  { id: 'c2', user: 'NaijaQueen', text: 'Do you ship to Abuja?' },
  { id: 'c3', user: 'KofiGh', text: 'Price is amazing 🙌' },
  { id: 'c4', user: 'AmiraK', text: 'Just placed my order!' },
  { id: 'c5', user: 'FashionLover', text: 'What sizes are available?' },
];
