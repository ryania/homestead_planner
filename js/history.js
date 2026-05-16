import { state, bus } from './state.js';

const MAX_HISTORY = 50;

const _undo = [];
const _redo = [];

let _canvas = null;
let _pendingMoveStart = null; // { id, left, top } captured before a drag

export function initHistory(fabricCanvas) {
  _canvas = fabricCanvas;

  bus.on('entity-created', (entity) => {
    push(makeAdd(entity));
  });

  bus.on('entity-will-delete', (entity) => {
    push(makeDel(entity));
  });

  fabricCanvas.on('object:moving', (opt) => {
    if (_pendingMoveStart) return;
    const obj = opt.target;
    if (obj?.entityId) {
      _pendingMoveStart = { id: obj.entityId, left: obj.left, top: obj.top };
    }
  });

  fabricCanvas.on('object:modified', (opt) => {
    const obj = opt.target;
    if (obj?.entityId && _pendingMoveStart && _pendingMoveStart.id === obj.entityId) {
      const before = { left: _pendingMoveStart.left, top: _pendingMoveStart.top };
      const after = { left: obj.left, top: obj.top };
      if (before.left !== after.left || before.top !== after.top) {
        push(makeMove(state.entities.get(obj.entityId), before, after));
      }
      _pendingMoveStart = null;
    }
  });

  _updateButtons();
}

export function undo() {
  const cmd = _undo.pop();
  if (!cmd) return;
  cmd.undo();
  _redo.push(cmd);
  _updateButtons();
}

export function redo() {
  const cmd = _redo.pop();
  if (!cmd) return;
  cmd.redo();
  _undo.push(cmd);
  _updateButtons();
}

export function clearHistory() {
  _undo.length = 0;
  _redo.length = 0;
  _updateButtons();
}

function push(cmd) {
  _undo.push(cmd);
  if (_undo.length > MAX_HISTORY) _undo.shift();
  _redo.length = 0;
  _updateButtons();
}

function makeAdd(entity) {
  return {
    undo() {
      if (entity.fabricObj) _canvas.remove(entity.fabricObj);
      state.entities.delete(entity.id);
      _canvas.renderAll();
      bus.emit('entity-selected', null);
    },
    redo() {
      state.entities.set(entity.id, entity);
      if (entity.fabricObj) _canvas.add(entity.fabricObj);
      _canvas.renderAll();
    },
  };
}

function makeDel(entity) {
  return {
    undo() {
      state.entities.set(entity.id, entity);
      if (entity.fabricObj) _canvas.add(entity.fabricObj);
      _canvas.renderAll();
    },
    redo() {
      if (entity.fabricObj) _canvas.remove(entity.fabricObj);
      state.entities.delete(entity.id);
      _canvas.renderAll();
      bus.emit('entity-selected', null);
    },
  };
}

function makeMove(entity, before, after) {
  return {
    undo() {
      if (!entity?.fabricObj) return;
      entity.fabricObj.set(before);
      entity.fabricObj.setCoords();
      _canvas.renderAll();
    },
    redo() {
      if (!entity?.fabricObj) return;
      entity.fabricObj.set(after);
      entity.fabricObj.setCoords();
      _canvas.renderAll();
    },
  };
}

function _updateButtons() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = _undo.length === 0;
  if (r) r.disabled = _redo.length === 0;
}
