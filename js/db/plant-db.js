import plants from './plant-data.js';
import { state } from '../state.js';
import { zoneOverlaps } from '../utils.js';

export function getAll() {
  return plants;
}

export function getById(id) {
  return plants.find(p => p.id === id) || null;
}

export function search(query = '', filters = {}) {
  const q = query.toLowerCase().trim();
  const { category, selfFertile, zone } = filters;

  return plants.filter(p => {
    if (q && !p.commonName.toLowerCase().includes(q) &&
        !p.scientificName.toLowerCase().includes(q) &&
        !(p.tags || []).some(t => t.includes(q))) {
      return false;
    }
    if (category && p.category !== category) return false;
    if (selfFertile && !p.pollination.selfFertile) return false;
    if (zone && !zoneOverlaps(p.hardiness.usdaZones, Number(zone))) return false;
    return true;
  });
}

export function getCompatible(plantId) {
  const plant = getById(plantId);
  if (!plant) return [];
  const ids = (plant.pollination.compatibleVarieties || []).map(v => v.id);
  return ids.map(id => getById(id)).filter(Boolean);
}

// Trefle.io online search
export async function fetchTrefle(query) {
  const key = state.settings.trefleApiKey;
  if (!key || !query) return [];

  try {
    const url = `https://trefle.io/api/v1/plants/search?token=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Trefle API error: ${res.status}`);
    const json = await res.json();

    return (json.data || []).map(p => ({
      id: `trefle-${p.id}`,
      commonName: p.common_name || p.scientific_name,
      scientificName: p.scientific_name,
      category: mapTrefleFamily(p.family),
      tags: [p.family_common_name, 'online'].filter(Boolean),
      spacing: { minFt: null, maxFt: null, recommendedFt: null },
      mature: {
        heightFt: p.maximum_height
          ? { min: Math.round(p.maximum_height / 12 * 0.8), max: Math.round(p.maximum_height / 12) }
          : { min: null, max: null },
        lifespanYears: { min: null, max: null },
      },
      pollination: {
        selfFertile: null,
        pollinatorRequired: null,
        yieldWithoutPollinator: null,
        yieldWithPollinator: null,
        compatibleVarieties: [],
        notes: 'Online result — pollination data not available.',
      },
      hardiness: { usdaZones: null, chillHoursRequired: null },
      notes: 'Retrieved from Trefle.io. Spacing and pollination data not available.',
      _online: true,
    }));
  } catch (err) {
    console.warn('Trefle fetch failed:', err.message);
    return [];
  }
}

function mapTrefleFamily(family) {
  const f = (family || '').toLowerCase();
  if (f.includes('rosaceae')) return 'fruit-tree';
  if (f.includes('betulaceae') || f.includes('juglandaceae') || f.includes('fagaceae')) return 'nut-tree';
  if (f.includes('ericaceae') || f.includes('grossulariaceae')) return 'berry-bush';
  if (f.includes('vitaceae') || f.includes('actinidiaceae') || f.includes('cannabaceae')) return 'vine';
  return 'shrub';
}
