import { state, bus, getEntity, updateEntityField, deleteEntity, selectEntity } from '../state.js';
import { render as renderPlantInstance, bindEvents as bindPlantInstanceEvents } from './plant-instance.js';
import { render as renderIssues, bindEvents as bindIssueEvents } from './issue-tracker.js';
import { pxToFeet, feetToPx } from '../utils.js';

let _fabricCanvas = null;

export function init(fabricCanvas) {
  _fabricCanvas = fabricCanvas;

  bus.on('entity-selected', (id) => render(id));
  bus.on('entity-updated', ({ id }) => {
    if (id === state.selectedEntityId) render(id);
  });
  bus.on('dirty-changed', () => {
    const el = document.getElementById('status-dirty');
    if (el) el.classList.toggle('hidden', !state.dirty);
  });

  initScaleConfig();
}

function render(entityId) {
  const panel = document.getElementById('properties-content');

  if (!entityId) {
    renderEmpty(panel);
    document.getElementById('status-selected').textContent = 'Nothing selected';
    return;
  }

  const entity = getEntity(entityId);
  if (!entity) { renderEmpty(panel); return; }

  document.getElementById('status-selected').textContent = entity.label || entity.type;

  let html = `
    <div class="entity-header">
      <span class="entity-type-badge">${entity.type}</span>
      <input class="entity-label-input" id="prop-label" value="${escHtml(entity.label)}" placeholder="Label">
    </div>
  `;

  html += `
    <div class="panel-section">
      <h3>Appearance</h3>
      <div class="prop-row">
        <label>Color</label>
        <input type="color" id="prop-color" value="${entity.color || '#888888'}">
      </div>
    </div>
  `;

  if (entity.type === 'structure') {
    html += renderStructureFields(entity);
  } else if (entity.type === 'tree') {
    html += renderPlantInstance(entityId);
    html += renderSpacingRingToggle(entity);
    html += renderIssues(entityId);
  } else if (entity.type === 'fence') {
    html += renderFenceFields(entity);
  } else if (entity.type === 'water') {
    html += renderWaterFields(entity);
  } else if (entity.type === 'path') {
    html += renderPathFields(entity);
  } else if (entity.type === 'bed') {
    html += renderBedFields(entity);
  }

  html += `
    <div class="panel-section">
      <h3>Notes</h3>
      <div class="prop-row">
        <textarea id="prop-notes" rows="3" placeholder="Notes…">${escHtml(entity.notes)}</textarea>
      </div>
    </div>
  `;

  html += renderPositionInfo(entity);

  html += `<button class="delete-btn" id="btn-delete-entity">Delete</button>`;

  panel.innerHTML = html;
  bindPanelEvents(entityId, panel, entity);
}

function renderEmpty(panel) {
  panel.innerHTML = `
    <div class="panel-empty">
      <p>Select an object to edit its properties.</p>
      <p>Use the tools on the left to draw.</p>
      <div id="scale-config" class="scale-config">
        <h3>Scale</h3>
        <label>Grid square = <input type="number" id="scale-grid-ft" value="${state.gridSizeFt}" min="1" max="500"> ft</label>
        <label>Pixels per foot <input type="number" id="scale-px-per-ft" value="${state.pixelsPerFoot}" min="1" max="100"></label>
      </div>
    </div>
  `;
  initScaleConfig();
}

function renderStructureFields(entity) {
  return `
    <div class="panel-section">
      <h3>Structure</h3>
      <div class="prop-row">
        <label>Type</label>
        <select id="prop-subtype">
          ${['building','shed','coop','greenhouse','barn','other'].map(s =>
            `<option value="${s}" ${entity.subtype===s?'selected':''}>${capitalize(s)}</option>`
          ).join('')}
        </select>
      </div>
    </div>
  `;
}

function renderFenceFields(entity) {
  return `
    <div class="panel-section">
      <h3>Fence</h3>
      <div class="prop-row">
        <label>Type</label>
        <select id="prop-subtype">
          ${['woven-wire','board','electric','split-rail','picket','hedgerow'].map(s =>
            `<option value="${s}" ${entity.subtype===s?'selected':''}>${capitalize(s.replace('-',' '))}</option>`
          ).join('')}
        </select>
      </div>
    </div>
  `;
}

function renderWaterFields(entity) {
  return `
    <div class="panel-section">
      <h3>Water Feature</h3>
      <div class="prop-row">
        <label>Type</label>
        <select id="prop-subtype">
          ${['pond','stream','rain-garden','swale'].map(s =>
            `<option value="${s}" ${entity.subtype===s?'selected':''}>${capitalize(s.replace('-',' '))}</option>`
          ).join('')}
        </select>
      </div>
    </div>
  `;
}

function renderPathFields(entity) {
  return `
    <div class="panel-section">
      <h3>Path</h3>
      <div class="prop-row">
        <label>Surface</label>
        <select id="prop-subtype">
          ${['gravel','mulch','pavers','grass','concrete'].map(s =>
            `<option value="${s}" ${entity.subtype===s?'selected':''}>${capitalize(s)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row">
        <label>Width</label>
        <input type="number" id="prop-path-width" value="${entity.widthFt || 4}" min="1" max="30" step="0.5"> ft
      </div>
    </div>
  `;
}

function renderBedFields(entity) {
  return `
    <div class="panel-section">
      <h3>Garden Bed</h3>
      <div class="prop-row">
        <label>Type</label>
        <select id="prop-subtype">
          ${['raised','in-ground','container','hugelkultur'].map(s =>
            `<option value="${s}" ${entity.subtype===s?'selected':''}>${capitalize(s.replace('-',' '))}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row">
        <label>Contents</label>
        <input type="text" id="prop-bed-contents" value="${escHtml(entity.contents || '')}" placeholder="Plants growing here…">
      </div>
    </div>
  `;
}

function renderSpacingRingToggle(entity) {
  return `
    <div class="panel-section">
      <div class="prop-row">
        <label>Spacing Ring</label>
        <input type="checkbox" id="prop-ring-visible" ${entity.spacingRingVisible !== false ? 'checked' : ''}>
      </div>
    </div>
  `;
}

function renderPositionInfo(entity) {
  if (!entity.fabricObj) return '';
  const obj = entity.fabricObj;
  const xFt = pxToFeet(obj.left || 0, state.pixelsPerFoot).toFixed(1);
  const yFt = pxToFeet(obj.top || 0, state.pixelsPerFoot).toFixed(1);
  return `
    <div class="panel-section">
      <h3>Position</h3>
      <div class="prop-row">
        <label>X</label><span class="read-only">${xFt} ft</span>
      </div>
      <div class="prop-row">
        <label>Y</label><span class="read-only">${yFt} ft</span>
      </div>
    </div>
  `;
}

function bindPanelEvents(entityId, panel, entity) {
  panel.querySelector('#prop-label')?.addEventListener('change', e => {
    updateEntityField(entityId, 'label', e.target.value);
    if (entity.fabricObj) {
      const textObj = entity.fabricObj.getObjects
        ? entity.fabricObj.getObjects('text')[0]
        : null;
      if (textObj) {
        textObj.set({ text: e.target.value });
        entity.fabricObj.canvas?.renderAll();
      }
    }
  });

  panel.querySelector('#prop-color')?.addEventListener('input', e => {
    updateEntityField(entityId, 'color', e.target.value);
  });

  panel.querySelector('#prop-notes')?.addEventListener('change', e => {
    updateEntityField(entityId, 'notes', e.target.value);
  });

  panel.querySelector('#prop-subtype')?.addEventListener('change', e => {
    updateEntityField(entityId, 'subtype', e.target.value);
  });

  panel.querySelector('#prop-path-width')?.addEventListener('change', e => {
    const w = parseFloat(e.target.value) || 4;
    updateEntityField(entityId, 'widthFt', w);
    if (entity.fabricObj) {
      entity.fabricObj.set({ strokeWidth: feetToPx(w, state.pixelsPerFoot) });
      entity.fabricObj.canvas?.renderAll();
    }
  });

  panel.querySelector('#prop-bed-contents')?.addEventListener('change', e => {
    updateEntityField(entityId, 'contents', e.target.value);
  });

  const ringToggle = panel.querySelector('#prop-ring-visible');
  if (ringToggle) {
    ringToggle.addEventListener('change', e => {
      updateEntityField(entityId, 'spacingRingVisible', e.target.checked);
      if (entity._ring) {
        entity._ring.set({ visible: e.target.checked });
        entity.fabricObj?.canvas?.renderAll();
      }
    });
  }

  panel.querySelector('#btn-delete-entity')?.addEventListener('click', () => {
    if (entity.fabricObj && _fabricCanvas) {
      _fabricCanvas.remove(entity.fabricObj);
      _fabricCanvas.renderAll();
    }
    deleteEntity(entityId);
    selectEntity(null);
  });

  if (entity.type === 'tree') {
    bindPlantInstanceEvents(entityId, panel);
    bindIssueEvents(entityId, panel);
  }
}

function initScaleConfig() {
  const gridFtEl = document.getElementById('scale-grid-ft');
  const pxFtEl = document.getElementById('scale-px-per-ft');

  if (gridFtEl) {
    gridFtEl.addEventListener('change', () => {
      state.gridSizeFt = parseFloat(gridFtEl.value) || 5;
      bus.emit('scale-changed', {});
    });
  }
  if (pxFtEl) {
    pxFtEl.addEventListener('change', () => {
      state.pixelsPerFoot = parseFloat(pxFtEl.value) || 10;
      bus.emit('scale-changed', {});
    });
  }
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
