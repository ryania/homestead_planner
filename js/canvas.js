import { state, bus } from './state.js';
import { feetToPx, pxToFeet } from './utils.js';

const fabric = window.fabric;

let canvas = null;
let gridLines = [];
let isPanning = false;
let lastPanPoint = null;

export function getCanvas() {
  return canvas;
}

export function init() {
  const container = document.getElementById('canvas-container');
  const canvasEl = document.getElementById('main-canvas');

  canvas = new fabric.Canvas('main-canvas', {
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: state.canvasConfig.backgroundColor,
    selection: true,
    preserveObjectStacking: true,
    fireRightClick: true,
    stopContextMenu: true,
  });

  window.addEventListener('resize', () => resizeCanvas());

  setupZoomPan();
  drawGrid();
  setupMouseTracking();

  bus.on('scale-changed', () => {
    drawGrid();
  });

  return canvas;
}

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  canvas.setWidth(container.clientWidth);
  canvas.setHeight(container.clientHeight);
  canvas.renderAll();
  drawGrid();
}

// ===== Zoom & Pan =====

function setupZoomPan() {
  canvas.on('mouse:wheel', (opt) => {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.min(10, Math.max(0.05, zoom));
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
    updateZoomDisplay(zoom);
    drawGrid();
    bus.emit('zoom-changed', zoom);
  });

  canvas.on('mouse:down', (opt) => {
    const e = opt.e;
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning = true;
      lastPanPoint = { x: e.clientX, y: e.clientY };
      canvas.selection = false;
      canvas.defaultCursor = 'grabbing';
    }
  });

  canvas.on('mouse:move', (opt) => {
    if (isPanning && lastPanPoint) {
      const e = opt.e;
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      const vpt = canvas.viewportTransform;
      vpt[4] += dx;
      vpt[5] += dy;
      canvas.requestRenderAll();
      lastPanPoint = { x: e.clientX, y: e.clientY };
      drawGrid();
    }
  });

  canvas.on('mouse:up', () => {
    if (isPanning) {
      isPanning = false;
      lastPanPoint = null;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    }
  });
}

export function setZoom(zoom, center = true) {
  zoom = Math.min(10, Math.max(0.05, zoom));
  if (center) {
    const c = canvas.getCenter();
    canvas.zoomToPoint({ x: c.left, y: c.top }, zoom);
  } else {
    canvas.setZoom(zoom);
  }
  drawGrid();
  updateZoomDisplay(zoom);
}

export function fitToView() {
  const objs = canvas.getObjects().filter(o => o.entityId);
  if (objs.length === 0) {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    drawGrid();
    updateZoomDisplay(1);
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objs.forEach(o => {
    const br = o.getBoundingRect(true);
    minX = Math.min(minX, br.left);
    minY = Math.min(minY, br.top);
    maxX = Math.max(maxX, br.left + br.width);
    maxY = Math.max(maxY, br.top + br.height);
  });

  const pad = 60;
  const contentW = maxX - minX + pad * 2;
  const contentH = maxY - minY + pad * 2;
  const w = canvas.width;
  const h = canvas.height;
  const zoom = Math.min(w / contentW, h / contentH, 3);

  canvas.setZoom(zoom);
  const vpt = canvas.viewportTransform;
  vpt[4] = w / 2 - (minX + (maxX - minX) / 2) * zoom;
  vpt[5] = h / 2 - (minY + (maxY - minY) / 2) * zoom;
  canvas.requestRenderAll();
  drawGrid();
  updateZoomDisplay(zoom);
}

function updateZoomDisplay(zoom) {
  const el = document.getElementById('zoom-level');
  const statusEl = document.getElementById('status-zoom');
  const pct = Math.round(zoom * 100) + '%';
  if (el) el.textContent = pct;
  if (statusEl) statusEl.textContent = 'Zoom: ' + pct;
}

// ===== Grid =====

export function drawGrid() {
  gridLines.forEach(l => canvas.remove(l));
  gridLines = [];

  if (!state.showGrid) {
    canvas.renderAll();
    return;
  }

  const vpt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  const cellPx = feetToPx(state.gridSizeFt, state.pixelsPerFoot);
  const cellScreen = cellPx * zoom;

  if (cellScreen < 4) return;

  const w = canvas.width;
  const h = canvas.height;

  const offsetX = ((vpt[4] % cellScreen) + cellScreen) % cellScreen;
  const offsetY = ((vpt[5] % cellScreen) + cellScreen) % cellScreen;

  const lineOpts = {
    stroke: 'rgba(255,255,255,0.07)',
    strokeWidth: 1,
    selectable: false,
    evented: false,
    excludeFromExport: true,
    isGridLine: true,
  };

  for (let x = offsetX; x < w; x += cellScreen) {
    const line = new fabric.Line([x, 0, x, h], lineOpts);
    canvas.add(line);
    canvas.sendToBack(line);
    gridLines.push(line);
  }

  for (let y = offsetY; y < h; y += cellScreen) {
    const line = new fabric.Line([0, y, w, y], lineOpts);
    canvas.add(line);
    canvas.sendToBack(line);
    gridLines.push(line);
  }

  canvas.renderAll();
}

// ===== Coordinate Helpers =====

export function screenToWorld(screenX, screenY) {
  const vpt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  return {
    x: (screenX - vpt[4]) / zoom,
    y: (screenY - vpt[5]) / zoom,
  };
}

export function worldToScreen(worldX, worldY) {
  const vpt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  return {
    x: worldX * zoom + vpt[4],
    y: worldY * zoom + vpt[5],
  };
}

export function worldToFeet(worldX, worldY) {
  return {
    x: pxToFeet(worldX, state.pixelsPerFoot),
    y: pxToFeet(worldY, state.pixelsPerFoot),
  };
}

// ===== Mouse Position Tracking =====

function setupMouseTracking() {
  const statusEl = document.getElementById('status-coords');
  canvas.on('mouse:move', (opt) => {
    const world = screenToWorld(opt.e.offsetX, opt.e.offsetY);
    const feet = worldToFeet(world.x, world.y);
    if (statusEl) {
      statusEl.textContent = `${feet.x.toFixed(1)} ft, ${feet.y.toFixed(1)} ft`;
    }
  });
}

// ===== Snapping =====

export function snapToGrid(worldX, worldY) {
  const cellPx = feetToPx(state.gridSizeFt, state.pixelsPerFoot);
  return {
    x: Math.round(worldX / cellPx) * cellPx,
    y: Math.round(worldY / cellPx) * cellPx,
  };
}
