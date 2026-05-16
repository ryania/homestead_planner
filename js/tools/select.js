import { selectEntity, bus } from '../state.js';

export function activate(canvas) {
  canvas.selection = true;
  canvas.isDrawingMode = false;
  canvas.defaultCursor = 'default';
  canvas.hoverCursor = 'move';

  canvas.on('selection:created', onSelected);
  canvas.on('selection:updated', onSelected);
  canvas.on('selection:cleared', onCleared);
  canvas.on('object:modified', onModified);
}

export function deactivate(canvas) {
  canvas.off('selection:created', onSelected);
  canvas.off('selection:updated', onSelected);
  canvas.off('selection:cleared', onCleared);
  canvas.off('object:modified', onModified);
}

function onSelected(opt) {
  const obj = opt.selected && opt.selected[0];
  if (obj && obj.entityId) {
    selectEntity(obj.entityId);
  }
}

function onCleared() {
  selectEntity(null);
}

function onModified(opt) {
  if (opt.target && opt.target.entityId) {
    bus.emit('entity-moved', { id: opt.target.entityId, obj: opt.target });
  }
}
