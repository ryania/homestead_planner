const _handlers = {};

export const bus = {
  on(event, handler) {
    if (!_handlers[event]) _handlers[event] = [];
    _handlers[event].push(handler);
  },
  off(event, handler) {
    if (!_handlers[event]) return;
    _handlers[event] = _handlers[event].filter(h => h !== handler);
  },
  emit(event, data) {
    (_handlers[event] || []).forEach(h => h(data));
  },
};

export const state = {
  activeTool: 'select',
  selectedEntityId: null,

  pixelsPerFoot: 10,
  gridSizeFt: 5,
  showGrid: true,
  showSpacingRings: true,

  entities: new Map(),
  chickens: [],

  plantDb: [],

  settings: {
    trefleApiKey: '',
    usdaZone: null,
    bgColor: '#f5f0e8',
  },

  meta: {
    name: 'My Homestead',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    description: '',
  },

  canvasConfig: {
    width: 2000,
    height: 2000,
    backgroundColor: '#f5f0e8',
    viewport: { zoom: 1, panX: 0, panY: 0 },
  },

  dirty: false,
};

export function markDirty() {
  state.dirty = true;
  bus.emit('dirty-changed', true);
}

export function markClean() {
  state.dirty = false;
  bus.emit('dirty-changed', false);
}

export function setActiveTool(tool) {
  state.activeTool = tool;
  bus.emit('tool-changed', tool);
}

export function selectEntity(id) {
  state.selectedEntityId = id;
  bus.emit('entity-selected', id);
}

export function getEntity(id) {
  return state.entities.get(id);
}

export function setEntity(id, data) {
  state.entities.set(id, data);
  markDirty();
}

export function deleteEntity(id) {
  state.entities.delete(id);
  if (state.selectedEntityId === id) {
    state.selectedEntityId = null;
    bus.emit('entity-selected', null);
  }
  markDirty();
}

export function updateEntityField(id, fieldPath, value) {
  const entity = state.entities.get(id);
  if (!entity) return;
  const parts = fieldPath.split('.');
  let obj = entity;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  markDirty();
  bus.emit('entity-updated', { id, entity });
}
