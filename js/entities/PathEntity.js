import { EntityBase } from './EntityBase.js';
import { generateId, feetToPx } from '../utils.js';

const fabric = window.fabric;

const SUBTYPE_COLORS = {
  gravel: '#c8b89a',
  mulch: '#8B4513',
  pavers: '#9e9e9e',
  grass: '#66bb6a',
  concrete: '#b0bec5',
};

export class PathEntity extends EntityBase {
  constructor(data) {
    super({ ...data, type: 'path' });
    this.subtype = data.subtype || 'gravel';
    this.widthFt = data.widthFt || 4;
    this.points = data.points || [];
  }

  serialize() {
    return { ...super.serialize(), subtype: this.subtype, widthFt: this.widthFt, points: this.points };
  }

  updateWidth(widthFt, pixelsPerFoot) {
    this.widthFt = widthFt;
    if (this.fabricObj) {
      this.fabricObj.set({ strokeWidth: feetToPx(widthFt, pixelsPerFoot) });
      this.fabricObj.canvas?.renderAll();
    }
  }

  static create(points, widthFt = 4, opts = {}) {
    const subtype = opts.subtype || 'gravel';
    const color = SUBTYPE_COLORS[subtype] || '#c8b89a';

    const entity = new PathEntity({
      id: generateId(),
      label: opts.label || 'Path',
      color,
      subtype,
      widthFt,
      points,
    });

    const polyline = new fabric.Polyline(points, {
      stroke: color,
      strokeWidth: feetToPx(widthFt, opts.pixelsPerFoot || 10),
      fill: 'transparent',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      opacity: 0.85,
      selectable: true,
      hasControls: false,
      entityId: entity.id,
    });

    entity.fabricObj = polyline;
    entity.points = points;
    return entity;
  }

  static deserialize(data) {
    return new Promise((resolve) => {
      fabric.util.enlivenObjects([data.fabricData], (objects) => {
        const entity = new PathEntity(data);
        const obj = objects[0];
        obj.entityId = entity.id;
        entity.fabricObj = obj;
        resolve(entity);
      });
    });
  }
}
