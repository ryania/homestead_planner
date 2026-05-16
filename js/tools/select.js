import { state, selectEntity, bus } from '../state.js';

const fabric = window.fabric;

const POLYLINE_ENTITY_TYPES = new Set(['fence', 'path', 'water']);

let _canvas = null;
let _vertexEditObj = null;

export function activate(canvas) {
  _canvas = canvas;
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
  _exitVertexEdit();
  canvas.off('selection:created', onSelected);
  canvas.off('selection:updated', onSelected);
  canvas.off('selection:cleared', onCleared);
  canvas.off('object:modified', onModified);
  _canvas = null;
}

function onSelected(opt) {
  const obj = opt.selected && opt.selected[0];
  if (!obj) return;

  if (obj.entityId) {
    const entity = state.entities.get(obj.entityId);
    selectEntity(obj.entityId);

    if (entity && POLYLINE_ENTITY_TYPES.has(entity.type)) {
      _exitVertexEdit();
      _enterVertexEdit(obj);
    } else {
      _exitVertexEdit();
    }
  }
}

function onCleared() {
  _exitVertexEdit();
  selectEntity(null);
}

function onModified(opt) {
  if (opt.target && opt.target.entityId) {
    bus.emit('entity-moved', { id: opt.target.entityId, obj: opt.target });
  }
}

// ===== Vertex Edit =====

function _vertexPositionHandler(dim, finalMatrix, fabricObject) {
  const x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x;
  const y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
  return fabric.util.transformPoint(
    { x, y },
    fabric.util.multiplyTransformMatrices(
      fabricObject.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    )
  );
}

function _vertexActionHandler(eventData, transform, x, y) {
  const polyline = transform.target;
  const currentControl = polyline.controls[polyline.__corner];
  const mouseLocalPosition = polyline.toLocalPoint(new fabric.Point(x, y), 'center', 'center');
  const polygonBaseSize = polyline._getNonTransformedDimensions();
  const size = polyline._getTransformedDimensions(0, 0);
  polyline.points[currentControl.pointIndex] = {
    x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polyline.pathOffset.x,
    y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polyline.pathOffset.y,
  };
  return true;
}

function _anchorWrapper(anchorIndex, fn) {
  return function(eventData, transform, x, y) {
    const obj = transform.target;
    const absolutePoint = fabric.util.transformPoint(
      {
        x: obj.points[anchorIndex].x - obj.pathOffset.x,
        y: obj.points[anchorIndex].y - obj.pathOffset.y,
      },
      obj.calcTransformMatrix()
    );
    const actionPerformed = fn(eventData, transform, x, y);
    obj._setPositionDimensions({});
    const baseSize = obj._getNonTransformedDimensions();
    const newX = (obj.points[anchorIndex].x - obj.pathOffset.x) / baseSize.x;
    const newY = (obj.points[anchorIndex].y - obj.pathOffset.y) / baseSize.y;
    obj.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
    return actionPerformed;
  };
}

function _buildVertexControls(polyline) {
  return polyline.points.reduce((acc, _pt, i) => {
    const lastIdx = polyline.points.length - 1;
    acc['p' + i] = new fabric.Control({
      positionHandler: _vertexPositionHandler.bind({ pointIndex: i }),
      actionHandler: _anchorWrapper(i > 0 ? i - 1 : lastIdx, _vertexActionHandler),
      actionName: 'modifyPolyline',
      pointIndex: i,
    });
    return acc;
  }, {});
}

function _enterVertexEdit(obj) {
  if (!obj || !obj.points) return;
  _vertexEditObj = obj;
  obj.hasControls = true;
  obj.cornerStyle = 'circle';
  obj.cornerColor = 'rgba(100,200,255,0.85)';
  obj.cornerSize = 10;
  obj.hasBorders = false;
  obj.controls = _buildVertexControls(obj);
  _canvas?.requestRenderAll();
}

function _exitVertexEdit() {
  if (!_vertexEditObj) return;
  const obj = _vertexEditObj;
  obj.hasControls = false;
  obj.hasBorders = true;
  obj.controls = fabric.Object.prototype.controls;
  obj.canvas?.requestRenderAll();
  _vertexEditObj = null;
}
