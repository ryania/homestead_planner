import { state, selectEntity, bus } from '../state.js';
import { screenToWorld, snapToGrid } from '../canvas.js';
import { StructureEntity } from '../entities/StructureEntity.js';

const fabric = window.fabric;

let isDrawing = false;
let startPoint = null;
let previewRect = null;
let _canvas = null;

export function activate(canvas) {
  _canvas = canvas;
  canvas.selection = false;
  canvas.isDrawingMode = false;
  canvas.defaultCursor = 'crosshair';
  canvas.hoverCursor = 'crosshair';

  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);

  showHint('Click and drag to draw a structure');
}

export function deactivate(canvas) {
  canvas.off('mouse:down', onMouseDown);
  canvas.off('mouse:move', onMouseMove);
  canvas.off('mouse:up', onMouseUp);
  if (previewRect) { canvas.remove(previewRect); previewRect = null; }
  hideHint();
  isDrawing = false;
}

function onMouseDown(opt) {
  if (opt.e.button !== 0 || opt.e.altKey) return;
  const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
  startPoint = snapToGrid(world.x, world.y);
  isDrawing = true;

  previewRect = new fabric.Rect({
    left: startPoint.x, top: startPoint.y,
    width: 1, height: 1,
    fill: 'rgba(139,105,20,0.25)',
    stroke: '#8B6914',
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    selectable: false,
    evented: false,
  });
  _canvas.add(previewRect);
}

function onMouseMove(opt) {
  if (!isDrawing || !previewRect) return;
  const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
  const end = snapToGrid(world.x, world.y);

  const left = Math.min(startPoint.x, end.x);
  const top = Math.min(startPoint.y, end.y);
  const w = Math.abs(end.x - startPoint.x);
  const h = Math.abs(end.y - startPoint.y);

  previewRect.set({ left, top, width: Math.max(1, w), height: Math.max(1, h) });
  _canvas.renderAll();
}

function onMouseUp(opt) {
  if (!isDrawing) return;
  isDrawing = false;
  if (previewRect) { _canvas.remove(previewRect); previewRect = null; }

  const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
  const end = snapToGrid(world.x, world.y);
  const left = Math.min(startPoint.x, end.x);
  const top = Math.min(startPoint.y, end.y);
  const w = Math.abs(end.x - startPoint.x);
  const h = Math.abs(end.y - startPoint.y);

  if (w < 5 || h < 5) { _canvas.renderAll(); return; }

  const entity = StructureEntity.create({ left, top, width: w, height: h });
  state.entities.set(entity.id, entity);
  _canvas.add(entity.fabricObj);
  _canvas.setActiveObject(entity.fabricObj);
  _canvas.renderAll();
  selectEntity(entity.id);
  bus.emit('entity-created', entity);
}

function showHint(msg) {
  const el = document.getElementById('drawing-hint');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideHint() {
  const el = document.getElementById('drawing-hint');
  if (el) el.classList.add('hidden');
}
