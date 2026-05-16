export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getAgeYears(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const years = (now - then) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, years);
}

export function formatAge(dateStr) {
  const years = getAgeYears(dateStr);
  if (years === null) return '—';
  if (years < 1) {
    const months = Math.floor(years * 12);
    return months <= 0 ? 'Just planted' : `${months} mo`;
  }
  return years < 2 ? '1 yr' : `${Math.floor(years)} yrs`;
}

export function feetToPx(ft, pixelsPerFoot) {
  return ft * pixelsPerFoot;
}

export function pxToFeet(px, pixelsPerFoot) {
  return px / pixelsPerFoot;
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isoDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function zoneOverlaps(plantZones, userZone) {
  if (!plantZones || !userZone) return true;
  const [minZ, maxZ] = plantZones.split('-').map(Number);
  return userZone >= minZ && userZone <= maxZ;
}
