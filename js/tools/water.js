import { state, selectEntity, bus } from '../state.js';
import { screenToWorld, snapToGrid } from '../canvas.js';
import { WaterEntity } from '../entities/WaterEntity.js';

const fabric = window.fabric;

let _canvas = null;
let points = [];
let previewLine = null;
let dotMarkers = [];

export function activate(canvas) {
  _canvas = canvas;
  canvas.selection = false;
  canvas.isDrawingMode = false;
  canvas.defaultCursor = 'crosshair';
  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:dblclick', onDblClick);
  document.addEventListener('keydown', onKey);
  showHint('Click to place points. Double-click or Enter to close polygon (pond) / Enter for open stream.');
}

export function deactivate(canvas) {
  canvas.off('mouse:down', onMouseDown);
  canvas.off('mouse:move', onMouseMove);
  canvas.off('mouse:dblclick', onDblClick);
  document.removeEventListener('keydown', onKey);
  clearPreview();
  hideHint();
  points = [];
}

function onMouseDown(opt) {
  if (opt.e.button !== 0 || opt.e.altKey) return;
  const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
  const pt = snapToGrid(world.x, world.y);

  if (points.length > 2) {
    const first = points[0];
    const dx = pt.x - first.x, dy = pt.y - first.y;
    if (Math.sqrt(dx * dx + dy * dy) < 15) { finalize(true); return; }
  }

  points.push(pt);
  const dot = new fabric.Circle({
    left: pt.x - 4, top: pt.y - 4, radius: 4,
    fill: 'rgba(74,144,217,0.7)', selectable: false, evented: false,
  });
  _canvas.add(dot);
  dotMarkers.push(dot);
  _canvas.renderAll();
}

function onMouseMove(opt) {
  if (points.length === 0) return;
  const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
  if (previewLine) _canvas.remove(previewLine);
  const last = points[points.length - 1];
  previewLine = new fabric.Line([last.x, last.y, world.x, world.y], {
    stroke: '#4a90d9', strokeWidth: 2, strokeDashArray: [5, 4],
    selectable: false, evented: false,
  });
  _canvas.add(previewLine);
  _canvas.renderAll();
}

function onDblClick() { finalize(true); }

function onKey(e) {
  if (e.key === 'Enter') finalize(true);
  if (e.key === 'Escape') { clearPreview(); points = []; }
}

function finalize(close = true) {
  if (points.length < 2) { clearPreview(); points = []; return; }

  const entity = WaterEntity.create(points, close && points.length >= 3 ? 'pond' : 'stream');
  state.entities.set(entity.id, entity);
  _canvas.add(entity.fabricObj);
  _canvas.setActiveObject(entity.fabricObj);

  clearPreview();
  points = [];
  _canvas.renderAll();
  selectEntity(entity.id);
  bus.emit('entity-created', entity);
}

function clearPreview() {
  if (previewLine) { _canvas.remove(previewLine); previewLine = null; }
  dotMarkers.forEach(d => _canvas.remove(d));
  dotMarkers = [];
  _canvas.renderAll();
}

function showHint(msg) {
  const el = document.getElementById('drawing-hint');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideHint() {
  const el = document.getElementById('drawing-hint');
  if (el) el.classList.add('hidden');
}
