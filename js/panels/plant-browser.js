import { search, fetchTrefle, getAll } from '../db/plant-db.js';
import { state } from '../state.js';
import { debounce } from '../utils.js';

let _onSelect = null;
let _selected = null;

export function openBrowser(onSelect) {
  _onSelect = onSelect;
  _selected = null;

  const modal = document.getElementById('modal-plant-browser');
  modal.classList.remove('hidden');
  document.getElementById('plant-browser-select').disabled = true;

  updateTrefleToggleVisibility();
  renderResults(search('', {}));

  document.getElementById('plant-search').focus();
}

export function closeBrowser() {
  document.getElementById('modal-plant-browser').classList.add('hidden');
  _onSelect = null;
  _selected = null;
}

export function init() {
  const searchEl = document.getElementById('plant-search');
  const categoryEl = document.getElementById('plant-category-filter');
  const selfFertEl = document.getElementById('plant-self-fertile-filter');
  const zoneEl = document.getElementById('plant-zone-filter');
  const trefleToggle = document.getElementById('plant-online-toggle');

  const doSearch = debounce(async () => {
    const q = searchEl.value;
    const filters = {
      category: categoryEl.value,
      selfFertile: selfFertEl.checked,
      zone: zoneEl.value || null,
    };
    let results = search(q, filters);

    if (trefleToggle && trefleToggle.checked && q.length >= 2) {
      const online = await fetchTrefle(q);
      results = [...results, ...online];
    }

    renderResults(results);
  }, 280);

  searchEl.addEventListener('input', doSearch);
  categoryEl.addEventListener('change', doSearch);
  selfFertEl.addEventListener('change', doSearch);
  zoneEl.addEventListener('input', doSearch);
  if (trefleToggle) trefleToggle.addEventListener('change', doSearch);

  document.getElementById('plant-browser-select').addEventListener('click', () => {
    if (_selected && _onSelect) {
      _onSelect(_selected);
      closeBrowser();
    }
  });

  document.getElementById('plant-browser-cancel').addEventListener('click', () => {
    if (_onSelect) _onSelect(null);
    closeBrowser();
  });

  document.querySelector('#modal-plant-browser .modal-close').addEventListener('click', () => {
    if (_onSelect) _onSelect(null);
    closeBrowser();
  });

  document.querySelector('#modal-plant-browser .modal-backdrop').addEventListener('click', () => {
    if (_onSelect) _onSelect(null);
    closeBrowser();
  });

  renderResults(getAll());
}

function updateTrefleToggleVisibility() {
  const wrap = document.getElementById('plant-online-toggle')?.parentElement;
  if (!wrap) return;
  wrap.style.display = state.settings.trefleApiKey ? 'flex' : 'none';
}

function renderResults(plants) {
  const container = document.getElementById('plant-browser-results');
  if (!plants.length) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:12px 0;">No plants found.</p>';
    return;
  }

  container.innerHTML = '';
  plants.forEach(plant => {
    const card = buildCard(plant);
    container.appendChild(card);
  });
}

function buildCard(plant) {
  const poll = plant.pollination;
  const pollBadge = poll.selfFertile === null
    ? ''
    : poll.selfFertile
      ? '<span class="pollination-badge poll-self">Self-fertile</span>'
      : poll.pollinatorRequired
        ? '<span class="pollination-badge poll-needs">Needs companion</span>'
        : '<span class="pollination-badge poll-partial">Partial</span>';

  const heightStr = plant.mature.heightFt.min != null
    ? `${plant.mature.heightFt.min}–${plant.mature.heightFt.max} ft tall`
    : '';
  const spacingStr = plant.spacing.recommendedFt
    ? `${plant.spacing.recommendedFt} ft spacing`
    : '';
  const onlineBadge = plant._online ? '<span class="online-badge">Online</span>' : '';

  const compatHtml = (poll.compatibleVarieties || []).length
    ? poll.compatibleVarieties.map(v =>
        `<span class="compatible-tag ${v.effectiveness}">${v.name}</span>`
      ).join('')
    : '<em style="color:var(--text-muted)">None listed</em>';

  const catClass = 'cat-' + (plant.category || 'shrub').replace(/[^a-z-]/g, '-');

  const card = document.createElement('div');
  card.className = 'plant-card';
  card.innerHTML = `
    <div class="plant-card-header">
      <span class="plant-card-name">${plant.commonName}</span>
      ${onlineBadge}
      <span class="plant-category-badge ${catClass}">${formatCategory(plant.category)}</span>
      ${pollBadge}
    </div>
    <div class="plant-card-sci">${plant.scientificName}</div>
    <div class="plant-card-details">
      ${heightStr ? `<span>${heightStr}</span>` : ''}
      ${spacingStr ? `<span>${spacingStr}</span>` : ''}
      ${plant.hardiness.usdaZones ? `<span>Zones ${plant.hardiness.usdaZones}</span>` : ''}
    </div>
    <div class="plant-card-expand">
      ${poll.notes ? `<div style="margin-bottom:5px;color:var(--text-secondary);">${poll.notes}</div>` : ''}
      ${!poll.selfFertile && poll.compatibleVarieties?.length
        ? `<div><strong style="font-size:10px;">Compatible with:</strong><div class="compatible-list">${compatHtml}</div></div>`
        : ''}
      ${plant.notes ? `<div style="margin-top:6px;color:var(--text-muted);">${plant.notes}</div>` : ''}
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.detail === 1) {
      document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected', 'expanded'));
      card.classList.add('selected', 'expanded');
      _selected = plant;
      document.getElementById('plant-browser-select').disabled = false;
    }
  });

  card.addEventListener('dblclick', () => {
    _selected = plant;
    if (_onSelect) { _onSelect(plant); closeBrowser(); }
  });

  return card;
}

function formatCategory(cat) {
  const map = {
    'fruit-tree': 'Fruit Tree',
    'nut-tree': 'Nut Tree',
    'berry-bush': 'Berry Bush',
    'cane-fruit': 'Cane Fruit',
    'shrub': 'Shrub',
    'vine': 'Vine',
  };
  return map[cat] || cat;
}
