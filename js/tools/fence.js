import { state, selectEntity, bus } from '../state.js';
import { screenToWorld, snapToGrid } from '../canvas.js';
import { FenceEntity } from '../entities/FenceEntity.js';

const fabric = window.fabric;

let _canvas = null;
let points = [];
let previewLine = null;
let dotMarkers = [];
let previewPolyline = null;

export function activate(canvas) {
  _canvas = canvas;
  canvas.selection = false;
  canvas.isDrawingMode = false;
  canvas.defaultCursor = 'crosshair';
  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:dblclick', onDblClick);
  showHint('Click to add fence vertices. Double-click or press Enter to finish.');
  document.addEventListener('keydown', onKey);
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
  points.push(pt);

  const dot = new fabric.Circle({
    left: pt.x - 4, top: pt.y - 4,
    radius: 4, fill: '#888', selectable: false, evented: false,
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
    stroke: '#888', strokeWidth: 2, strokeDashArray: [5, 4],
    selectable: false, evented: false,
  });
  _canvas.add(previewLine);
  _canvas.renderAll();
}

function onDblClick() {
  finalize();
}

function onKey(e) {
  if (e.key === 'Enter') finalize();
  if (e.key === 'Escape') {
    clearPreview();
    points = [];
  }
}

function finalize() {
  if (points.length < 2) { clearPreview(); points = []; return; }

  const entity = FenceEntity.create(points);
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
  if (previewPolyline) { _canvas.remove(previewPolyline); previewPolyline = null; }
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
