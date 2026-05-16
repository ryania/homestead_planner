import { EntityBase } from './EntityBase.js';
import { generateId, feetToPx, isoDate } from '../utils.js';

const fabric = window.fabric;

const CATEGORY_COLORS = {
  'fruit-tree': '#4caf50',
  'nut-tree': '#ff9800',
  'berry-bush': '#9c27b0',
  'cane-fruit': '#e91e63',
  'shrub': '#00bcd4',
  'vine': '#cddc39',
};

export class TreeEntity extends EntityBase {
  constructor(data) {
    super({ ...data, type: 'tree' });
    this.plantDbId = data.plantDbId || null;
    this.plantEntry = data.plantEntry || null;
    this.spacingRingVisible = data.spacingRingVisible !== false;
    this.instance = data.instance || {
      plantingDate: null,
      currentHeightFt: null,
      issues: [],
    };
    this._ring = null;
    this._body = null;
    this._label = null;
  }

  serialize() {
    return {
      ...super.serialize(),
      plantDbId: this.plantDbId,
      plantEntry: this.plantEntry,
      spacingRingVisible: this.spacingRingVisible,
      instance: this.instance,
    };
  }

  getFabricObjects() {
    return [this.fabricObj];
  }

  updateSpacingRing(pixelsPerFoot) {
    if (!this._ring || !this.plantEntry) return;
    const spacingFt = this.plantEntry.spacing?.recommendedFt || 10;
    const r = feetToPx(spacingFt / 2, pixelsPerFoot);
    this._ring.set({ radius: r });
    if (this.fabricObj) this.fabricObj.canvas?.renderAll();
  }

  setRingColor(color) {
    if (this._ring) {
      this._ring.set({ stroke: color });
      if (this.fabricObj && this.fabricObj.canvas) {
        this.fabricObj.canvas.renderAll();
      }
    }
  }

  static create(position, plantEntry, pixelsPerFoot) {
    const category = plantEntry?.category || 'shrub';
    const color = CATEGORY_COLORS[category] || '#4caf50';
    const label = plantEntry?.commonName || 'Tree';

    const entity = new TreeEntity({
      id: generateId(),
      label,
      color,
      plantDbId: plantEntry?.id || null,
      plantEntry: plantEntry || null,
      instance: {
        plantingDate: isoDate(),
        currentHeightFt: null,
        issues: [],
      },
    });

    const bodyRadius = 16;
    const spacingFt = plantEntry?.spacing?.recommendedFt || 10;
    const ringRadius = feetToPx(spacingFt / 2, pixelsPerFoot);

    const ring = new fabric.Circle({
      left: -ringRadius,
      top: -ringRadius,
      radius: ringRadius,
      fill: 'transparent',
      stroke: 'rgba(76,175,80,0.45)',
      strokeWidth: 1.5,
      strokeDashArray: [6, 4],
      selectable: false,
      evented: false,
      isSpacingRing: true,
    });

    const body = new fabric.Circle({
      left: -bodyRadius,
      top: -bodyRadius,
      radius: bodyRadius,
      fill: color,
      stroke: '#fff',
      strokeWidth: 1.5,
    });

    const text = new fabric.Text(label.length > 14 ? label.slice(0, 12) + '…' : label, {
      top: bodyRadius + 4,
      fontSize: 10,
      fill: '#fff',
      fontFamily: 'system-ui, sans-serif',
      originX: 'center',
      originY: 'top',
    });

    const group = new fabric.Group([ring, body, text], {
      left: position.x,
      top: position.y,
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: true,
      entityId: entity.id,
    });

    group.isSpacingRing = false;
    entity.fabricObj = group;
    entity._ring = ring;
    entity._body = body;
    entity._label = text;

    return entity;
  }

  static deserialize(data, pixelsPerFoot) {
    return new Promise((resolve) => {
      fabric.util.enlivenObjects([data.fabricData], (objects) => {
        const entity = new TreeEntity(data);
        const obj = objects[0];
        obj.entityId = entity.id;
        entity.fabricObj = obj;

        obj.getObjects().forEach(child => {
          if (child.isSpacingRing) entity._ring = child;
          if (child.type === 'circle' && !child.isSpacingRing) entity._body = child;
          if (child.type === 'text') entity._label = child;
        });

        resolve(entity);
      });
    });
  }
}
