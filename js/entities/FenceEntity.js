import { EntityBase } from './EntityBase.js';
import { generateId } from '../utils.js';

const fabric = window.fabric;

const SUBTYPE_STYLES = {
  'woven-wire': { stroke: '#888888', strokeDashArray: null },
  'board': { stroke: '#8B6914', strokeDashArray: null },
  'electric': { stroke: '#FFD600', strokeDashArray: [8, 4] },
  'split-rail': { stroke: '#A0522D', strokeDashArray: null },
  'picket': { stroke: '#ffffff', strokeDashArray: null },
  'hedgerow': { stroke: '#2e7d32', strokeDashArray: null },
};

export class FenceEntity extends EntityBase {
  constructor(data) {
    super({ ...data, type: 'fence' });
    this.subtype = data.subtype || 'woven-wire';
    this.points = data.points || [];
  }

  serialize() {
    const pts = this.fabricObj
      ? this.fabricObj.points
      : this.points;
    return { ...super.serialize(), subtype: this.subtype, points: pts };
  }

  static create(points, opts = {}) {
    const entity = new FenceEntity({
      id: generateId(),
      label: opts.label || 'Fence',
      color: opts.color || '#888888',
      subtype: opts.subtype || 'woven-wire',
      points,
    });

    const style = SUBTYPE_STYLES[entity.subtype] || SUBTYPE_STYLES['woven-wire'];
    const flatPoints = points.flatMap(p => [p.x, p.y]);

    const polyline = new fabric.Polyline(points, {
      stroke: entity.color,
      strokeWidth: 3,
      fill: 'transparent',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      strokeDashArray: style.strokeDashArray,
      selectable: true,
      hasControls: false,
      entityId: entity.id,
    });

    entity.fabricObj = polyline;
    return entity;
  }

  static deserialize(data) {
    return new Promise((resolve) => {
      fabric.util.enlivenObjects([data.fabricData], (objects) => {
        const entity = new FenceEntity(data);
        const obj = objects[0];
        obj.entityId = entity.id;
        entity.fabricObj = obj;
        resolve(entity);
      });
    });
  }
}
