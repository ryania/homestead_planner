import { state, bus, selectEntity } from './state.js';
import { init as initCanvas, setZoom, fitToView, drawGrid } from './canvas.js';
import { init as initToolbar, activateTool } from './toolbar.js';
import { init as initProperties } from './panels/properties.js';
import { init as initPlantBrowser } from './panels/plant-browser.js';
import { init as initChickenManager } from './panels/chicken-manager.js';
import { init as initScale, initScalePopover, checkSpacingOverlaps } from './scale.js';
import { init as initPersistence } from './persistence.js';

async function boot() {
  const fabricCanvas = initCanvas();

  initToolbar(fabricCanvas);
  initProperties(fabricCanvas);
  initPlantBrowser();
  initChickenManager();
  initScale(fabricCanvas);
  initScalePopover();
  initPersistence(fabricCanvas);

  setupZoomButtons(fabricCanvas);
  setupKeyboardShortcuts(fabricCanvas);
  setupModalCloseButtons();
  setupTreeMoveOverlapCheck(fabricCanvas);

  document.getElementById('btn-plant-browser').addEventListener('click', () => {
    import('./panels/plant-browser.js').then(m => m.openBrowser(() => {}));
  });

  bus.emit('canvas-ready', {});
}

function setupZoomButtons(fabricCanvas) {
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    setZoom(fabricCanvas.getZoom() * 1.25);
  });
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    setZoom(fabricCanvas.getZoom() / 1.25);
  });
  document.getElementById('btn-zoom-fit')?.addEventListener('click', fitToView);
}

function setupKeyboardShortcuts(fabricCanvas) {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const id = state.selectedEntityId;
      if (!id) return;
      const entity = state.entities.get(id);
      if (entity?.fabricObj) {
        fabricCanvas.remove(entity.fabricObj);
        fabricCanvas.renderAll();
      }
      import('./state.js').then(({ deleteEntity, selectEntity: sel }) => {
        deleteEntity(id);
        sel(null);
      });
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      import('./persistence.js').then(({ saveDesign }) => saveDesign());
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      document.getElementById('file-input').click();
    }

    if (e.key === '+' || e.key === '=') {
      setZoom(fabricCanvas.getZoom() * 1.15);
    }
    if (e.key === '-') {
      setZoom(fabricCanvas.getZoom() / 1.15);
    }
    if (e.key === '0') {
      setZoom(1, true);
    }
  });
}

function setupModalCloseButtons() {
  document.querySelectorAll('.modal-close[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.modal)?.classList.add('hidden');
    });
  });
}

function setupTreeMoveOverlapCheck(fabricCanvas) {
  fabricCanvas.on('object:moving', (opt) => {
    if (opt.target?.entityId) {
      const entity = state.entities.get(opt.target.entityId);
      if (entity?.type === 'tree') {
        checkSpacingOverlaps();
      }
    }
  });
  fabricCanvas.on('object:modified', () => {
    checkSpacingOverlaps();
  });
}

document.addEventListener('DOMContentLoaded', boot);
