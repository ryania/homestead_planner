import { state, bus, markClean, markDirty } from './state.js';
import { deepClone, debounce, isoDate } from './utils.js';
import { StructureEntity } from './entities/StructureEntity.js';
import { TreeEntity } from './entities/TreeEntity.js';
import { FenceEntity } from './entities/FenceEntity.js';
import { WaterEntity } from './entities/WaterEntity.js';
import { PathEntity } from './entities/PathEntity.js';
import { BedEntity } from './entities/BedEntity.js';

const AUTOSAVE_KEY = 'homestead_planner_autosave';
const VERSION = '1.0';

let _canvas = null;

export function init(fabricCanvas) {
  _canvas = fabricCanvas;

  document.getElementById('btn-save').addEventListener('click', saveDesign);
  document.getElementById('btn-load').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  document.getElementById('file-input').addEventListener('change', handleFileLoad);

  document.getElementById('design-name').addEventListener('click', () => {
    const current = state.meta.name;
    const name = prompt('Rename design:', current);
    if (name && name.trim()) {
      state.meta.name = name.trim();
      document.getElementById('design-name').textContent = state.meta.name;
      markDirty();
    }
  });

  const autoSaveFn = debounce(() => autoSave(), 120000);
  bus.on('dirty-changed', (dirty) => { if (dirty) autoSaveFn(); });

  checkAutoSave();
  initSettingsModal();
}

function buildSaveData() {
  const entities = [];
  state.entities.forEach(entity => {
    entities.push(entity.serialize());
  });

  return {
    version: VERSION,
    meta: {
      ...state.meta,
      modified: new Date().toISOString(),
    },
    scale: {
      pixelsPerFoot: state.pixelsPerFoot,
      gridSizeFt: state.gridSizeFt,
      showGrid: state.showGrid,
      showSpacingRings: state.showSpacingRings,
    },
    canvasConfig: {
      ...state.canvasConfig,
      backgroundColor: _canvas.backgroundColor,
      viewport: {
        zoom: _canvas.getZoom(),
        panX: _canvas.viewportTransform[4],
        panY: _canvas.viewportTransform[5],
      },
    },
    settings: deepClone(state.settings),
    entities,
    chickens: deepClone(state.chickens),
  };
}

export function saveDesign() {
  const data = buildSaveData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.meta.name || 'homestead').replace(/\s+/g, '_') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  markClean();
}

function handleFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      await loadDesign(data);
    } catch (err) {
      alert('Failed to load file: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

export async function loadDesign(data) {
  if (!data || !data.version) throw new Error('Invalid design file');

  _canvas.clear();
  state.entities.clear();
  state.chickens = [];

  if (data.meta) Object.assign(state.meta, data.meta);
  if (data.scale) {
    state.pixelsPerFoot = data.scale.pixelsPerFoot || 10;
    state.gridSizeFt = data.scale.gridSizeFt || 5;
    state.showGrid = data.scale.showGrid !== false;
    state.showSpacingRings = data.scale.showSpacingRings !== false;
  }
  if (data.settings) Object.assign(state.settings, data.settings);
  if (data.chickens) state.chickens = data.chickens;

  if (data.canvasConfig) {
    _canvas.setBackgroundColor(data.canvasConfig.backgroundColor || '#f5f0e8', () => {});
    if (data.canvasConfig.viewport) {
      const vp = data.canvasConfig.viewport;
      const zoom = vp.zoom || 1;
      _canvas.setViewportTransform([zoom, 0, 0, zoom, vp.panX || 0, vp.panY || 0]);
    }
  }

  for (const entityData of (data.entities || [])) {
    try {
      const entity = await deserializeEntity(entityData);
      if (entity) {
        state.entities.set(entity.id, entity);
        _canvas.add(entity.fabricObj);
      }
    } catch (err) {
      console.warn('Failed to restore entity:', err);
    }
  }

  document.getElementById('design-name').textContent = state.meta.name || 'My Homestead';
  bus.emit('scale-changed', {});
  bus.emit('design-loaded', {});
  _canvas.renderAll();
  markClean();
}

async function deserializeEntity(data) {
  const map = {
    structure: StructureEntity,
    tree: TreeEntity,
    fence: FenceEntity,
    water: WaterEntity,
    path: PathEntity,
    bed: BedEntity,
  };
  const Cls = map[data.type];
  if (!Cls) return null;

  if (data.type === 'tree') {
    return Cls.deserialize(data, state.pixelsPerFoot);
  }
  return Cls.deserialize(data);
}

function autoSave() {
  try {
    const data = buildSaveData();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Autosave failed:', e);
  }
}

function checkAutoSave() {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (!data || !data.entities || data.entities.length === 0) return;

    const notice = document.getElementById('autosave-notice');
    if (notice) notice.classList.remove('hidden');

    document.getElementById('btn-restore-autosave')?.addEventListener('click', async () => {
      await loadDesign(data);
      notice.classList.add('hidden');
    });

    document.getElementById('btn-dismiss-autosave')?.addEventListener('click', () => {
      localStorage.removeItem(AUTOSAVE_KEY);
      notice.classList.add('hidden');
    });
  } catch (e) {
    console.warn('Autosave check failed:', e);
  }
}

function initSettingsModal() {
  const btn = document.getElementById('btn-settings');
  const modal = document.getElementById('modal-settings');
  const saveBtn = document.getElementById('settings-save');

  btn?.addEventListener('click', () => {
    document.getElementById('trefle-api-key').value = state.settings.trefleApiKey || '';
    document.getElementById('settings-zone').value = state.settings.usdaZone || '';
    document.getElementById('settings-bg-color').value = state.settings.bgColor || '#f5f0e8';
    modal.classList.remove('hidden');
  });

  modal?.querySelector('.modal-close')?.addEventListener('click', () => modal.classList.add('hidden'));
  modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => modal.classList.add('hidden'));

  saveBtn?.addEventListener('click', () => {
    const key = document.getElementById('trefle-api-key').value.trim();
    const zone = parseInt(document.getElementById('settings-zone').value) || null;
    const bg = document.getElementById('settings-bg-color').value;

    state.settings.trefleApiKey = key;
    state.settings.usdaZone = zone;
    state.settings.bgColor = bg;

    if (_canvas) {
      _canvas.setBackgroundColor(bg, () => _canvas.renderAll());
    }

    localStorage.setItem('homestead_trefle_key', key);
    markDirty();
    modal.classList.add('hidden');
  });

  const storedKey = localStorage.getItem('homestead_trefle_key');
  if (storedKey) state.settings.trefleApiKey = storedKey;
}
