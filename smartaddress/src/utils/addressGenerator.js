// Exclude ambiguous characters: I, O (look like 1, 0)
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '0123456789';

/**
 * Generates a unique address code in the format XXX-NNN-NN
 * e.g. BXR-204-17, KAM-091-43
 */
export function generateAddressCode() {
  const part1 = Array.from(
    { length: 3 },
    () => LETTERS[Math.floor(Math.random() * LETTERS.length)]
  ).join('');

  const part2 = Array.from(
    { length: 3 },
    () => DIGITS[Math.floor(Math.random() * DIGITS.length)]
  ).join('');

  const part3 = Array.from(
    { length: 2 },
    () => DIGITS[Math.floor(Math.random() * DIGITS.length)]
  ).join('');

  return `${part1}-${part2}-${part3}`;
}

/**
 * Generates a unique ID for address storage
 */
export function generateAddressId() {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Formats coordinates into a readable string
 */
export function formatCoords(latitude, longitude) {
  const lat = Math.abs(latitude).toFixed(4);
  const lng = Math.abs(longitude).toFixed(4);
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  return `${lat}°${latDir}, ${lng}°${lngDir}`;
}

/**
 * Returns a shareable message for an address
 */
export function buildShareMessage(address) {
  const lines = [
    `📍 My SmartAddress Code: *${address.code}*`,
    `🏠 ${address.label}`,
  ];
  if (address.landmark) lines.push(`🗺 Landmark: ${address.landmark}`);
  if (address.gateColor) lines.push(`🚪 Gate: ${address.gateColor} gate`);
  if (address.arrivalInstructions) lines.push(`📋 Arrival: ${address.arrivalInstructions}`);
  if (address.deliveryNotes) lines.push(`📝 Note: ${address.deliveryNotes}`);
  lines.push(`\nUse this code when ordering on AfriLive Market.`);
  return lines.join('\n');
}

/**
 * Calculates delivery confidence score (0–100) based on address completeness.
 * More fields filled = easier for riders to find you.
 */
export function calculateConfidenceScore(address) {
  if (!address) return { score: 0, level: 'weak', color: '#E53E3E', factors: [], missing: [] };

  let score = 0;
  const factors = [];
  const missing = [];

  // Photos: up to 30 points
  if (address.photos?.length >= 2) {
    score += 30;
    factors.push('Gate & entrance photos');
  } else if (address.photos?.length === 1) {
    score += 15;
    factors.push('1 entrance photo');
    missing.push('Add more photos (+15)');
  } else {
    missing.push('Entrance photos (+30)');
  }

  // Arrival instructions: 25 points
  if (address.arrivalInstructions?.trim()) {
    score += 25;
    factors.push('Last-50m arrival guide');
  } else {
    missing.push('Arrival instructions (+25)');
  }

  // Landmark: 20 points
  if (address.landmark?.trim()) {
    score += 20;
    factors.push('Nearby landmark');
  } else {
    missing.push('Nearby landmark (+20)');
  }

  // Gate color: 15 points
  if (address.gateColor) {
    score += 15;
    factors.push('Gate color');
  } else {
    missing.push('Gate color (+15)');
  }

  // Floor / Apt: 10 points
  if (address.floor?.trim()) {
    score += 10;
    factors.push('Floor / Apartment');
  } else {
    missing.push('Floor/Apt info (+10)');
  }

  let level, color;
  if (score < 30) {
    level = 'Weak';
    color = '#E53E3E';
  } else if (score < 55) {
    level = 'Fair';
    color = '#E8A020';
  } else if (score < 80) {
    level = 'Good';
    color = '#D4AC0D';
  } else {
    level = 'Excellent';
    color = '#1A6B3C';
  }

  return { score, level, color, factors, missing };
}
