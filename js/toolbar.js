import { state, setActiveTool, bus } from './state.js';
import * as selectTool from './tools/select.js';
import * as structureTool from './tools/structure.js';
import * as treeTool from './tools/tree.js';
import * as fenceTool from './tools/fence.js';
import * as waterTool from './tools/water.js';
import * as pathTool from './tools/path.js';
import * as bedTool from './tools/bed.js';

const tools = {
  select: selectTool,
  structure: structureTool,
  tree: treeTool,
  fence: fenceTool,
  water: waterTool,
  path: pathTool,
  bed: bedTool,
};

let activeTool = null;

const keyMap = {
  s: 'select',
  b: 'structure',
  t: 'tree',
  f: 'fence',
  w: 'water',
  p: 'path',
  g: 'bed',
};

export function init(fabricCanvas) {
  const buttons = document.querySelectorAll('.tool-btn[data-tool]');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      activateTool(tool, fabricCanvas);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    const tool = keyMap[e.key.toLowerCase()];
    if (tool) activateTool(tool, fabricCanvas);
    if (e.key === 'Escape') activateTool('select', fabricCanvas);
  });

  setupToggleButtons(fabricCanvas);

  activateTool('select', fabricCanvas);
}

export function activateTool(toolName, fabricCanvas) {
  if (activeTool && tools[activeTool]) {
    tools[activeTool].deactivate(fabricCanvas);
  }

  activeTool = toolName;
  setActiveTool(toolName);

  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === toolName);
  });

  const container = document.getElementById('canvas-container');
  container.className = '';
  container.classList.add('tool-' + toolName);

  if (tools[toolName]) {
    tools[toolName].activate(fabricCanvas);
  }
}

function setupToggleButtons(fabricCanvas) {
  const gridBtn = document.getElementById('btn-toggle-grid');
  const ringsBtn = document.getElementById('btn-toggle-rings');

  gridBtn.addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    gridBtn.dataset.active = state.showGrid;
    bus.emit('scale-changed', {});
  });

  ringsBtn.addEventListener('click', () => {
    state.showSpacingRings = !state.showSpacingRings;
    ringsBtn.dataset.active = state.showSpacingRings;
    bus.emit('rings-visibility-changed', state.showSpacingRings);
    fabricCanvas.getObjects().forEach(obj => {
      if (obj.isSpacingRing) {
        obj.set('visible', state.showSpacingRings);
      }
    });
    fabricCanvas.renderAll();
  });
}
