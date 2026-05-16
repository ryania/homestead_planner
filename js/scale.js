import { state, bus } from './state.js';
import { feetToPx } from './utils.js';
import { drawGrid } from './canvas.js';

let _canvas = null;

export function init(fabricCanvas) {
  _canvas = fabricCanvas;
  bus.on('scale-changed', () => {
    drawGrid();
    updateScaleDisplay();
    updateAllSpacingRings();
    updateAllPathWidths();
  });
  updateScaleDisplay();
}

export function setScale(pixelsPerFoot, gridSizeFt) {
  state.pixelsPerFoot = pixelsPerFoot;
  state.gridSizeFt = gridSizeFt;
  bus.emit('scale-changed', {});
}

function updateScaleDisplay() {
  const el = document.getElementById('scale-label');
  if (el) el.textContent = `1 sq = ${state.gridSizeFt} ft`;
}

export function checkSpacingOverlaps() {
  if (!_canvas) return;

  const trees = [];
  _canvas.getObjects().forEach(obj => {
    if (!obj.entityId) return;
    const entity = state.entities.get(obj.entityId);
    if (!entity || entity.type !== 'tree') return;
    const spacingFt = entity.plantEntry?.spacing?.recommendedFt || 0;
    if (!spacingFt) return;
    const center = obj.getCenterPoint();
    trees.push({ entity, obj, center, radiusPx: feetToPx(spacingFt / 2, state.pixelsPerFoot) });
  });

  trees.forEach(tree => {
    if (!tree.entity._ring) return;
    if (!tree.entity.spacingRingVisible) return;

    const overlapping = trees.some(other => {
      if (other.entity.id === tree.entity.id) return false;
      const dx = other.center.x - tree.center.x;
      const dy = other.center.y - tree.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < tree.radiusPx + other.radiusPx;
    });

    tree.entity._ring.set({
      stroke: overlapping
        ? 'rgba(244, 67, 54, 0.7)'
        : 'rgba(76, 175, 80, 0.45)',
    });
  });

  if (trees.length > 0) _canvas.renderAll();
}

function updateAllSpacingRings() {
  if (!_canvas) return;
  state.entities.forEach(entity => {
    if (entity.type === 'tree' && entity._ring && entity.plantEntry) {
      const spacingFt = entity.plantEntry.spacing?.recommendedFt || 10;
      entity._ring.set({ radius: feetToPx(spacingFt / 2, state.pixelsPerFoot) });
    }
  });
  _canvas.renderAll();
  checkSpacingOverlaps();
}

function updateAllPathWidths() {
  if (!_canvas) return;
  state.entities.forEach(entity => {
    if (entity.type === 'path' && entity.fabricObj && entity.widthFt) {
      entity.fabricObj.set({ strokeWidth: feetToPx(entity.widthFt, state.pixelsPerFoot) });
    }
  });
  _canvas.renderAll();
}

export function initScalePopover() {
  const trigger = document.getElementById('scale-display');
  const popover = document.getElementById('scale-popover');
  const cancelBtn = document.getElementById('popover-scale-cancel');
  const applyBtn = document.getElementById('popover-scale-apply');
  const gridFtIn = document.getElementById('popover-grid-ft');
  const pxFtIn = document.getElementById('popover-px-ft');

  if (!trigger || !popover) return;

  trigger.addEventListener('click', () => {
    gridFtIn.value = state.gridSizeFt;
    pxFtIn.value = state.pixelsPerFoot;
    const rect = trigger.getBoundingClientRect();
    popover.style.top = (rect.bottom + 6) + 'px';
    popover.style.left = rect.left + 'px';
    popover.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => popover.classList.add('hidden'));

  applyBtn.addEventListener('click', () => {
    const newGridFt = parseFloat(gridFtIn.value) || 5;
    const newPxFt = parseFloat(pxFtIn.value) || 10;
    setScale(newPxFt, newGridFt);
    popover.classList.add('hidden');
  });

  document.addEventListener('click', e => {
    if (!popover.contains(e.target) && !trigger.contains(e.target)) {
      popover.classList.add('hidden');
    }
  });
}
