import { state, selectEntity, bus } from '../state.js';
import { screenToWorld, snapToGrid } from '../canvas.js';
import { TreeEntity } from '../entities/TreeEntity.js';
import { openBrowser } from '../panels/plant-browser.js';

let _canvas = null;

export function activate(canvas) {
  _canvas = canvas;
  canvas.selection = false;
  canvas.isDrawingMode = false;
  canvas.defaultCursor = 'crosshair';
  canvas.hoverCursor = 'crosshair';
  canvas.on('mouse:down', onMouseDown);
  showHint('Click to place a tree or bush — choose a species from the browser');
}

export function deactivate(canvas) {
  canvas.off('mouse:down', onMouseDown);
  hideHint();
}

function onMouseDown(opt) {
  if (opt.e.button !== 0 || opt.e.altKey) return;
  const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
  const pt = snapToGrid(world.x, world.y);

  openBrowser((plantEntry) => {
    if (!plantEntry) return;
    const entity = TreeEntity.create(pt, plantEntry, state.pixelsPerFoot);
    state.entities.set(entity.id, entity);
    _canvas.add(...entity.getFabricObjects());
    _canvas.setActiveObject(entity.fabricObj);
    _canvas.renderAll();
    selectEntity(entity.id);
    bus.emit('entity-created', entity);
  });
}

function showHint(msg) {
  const el = document.getElementById('drawing-hint');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideHint() {
  const el = document.getElementById('drawing-hint');
  if (el) el.classList.add('hidden');
}
