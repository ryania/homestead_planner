import { EntityBase } from './EntityBase.js';
import { generateId } from '../utils.js';

const fabric = window.fabric;

export class WaterEntity extends EntityBase {
  constructor(data) {
    super({ ...data, type: 'water' });
    this.subtype = data.subtype || 'pond';
    this.points = data.points || [];
  }

  serialize() {
    return { ...super.serialize(), subtype: this.subtype, points: this.points };
  }

  static create(points, subtype = 'pond', opts = {}) {
    const entity = new WaterEntity({
      id: generateId(),
      label: opts.label || (subtype === 'pond' ? 'Pond' : 'Stream'),
      color: opts.color || '#4a90d9',
      subtype,
      points,
    });

    let fabricObj;

    if (subtype === 'pond' || subtype === 'rain-garden' || subtype === 'swale') {
      fabricObj = new fabric.Polygon(points, {
        fill: 'rgba(74,144,217,0.3)',
        stroke: '#4a90d9',
        strokeWidth: 2,
        selectable: true,
        hasControls: false,
        entityId: entity.id,
      });
    } else {
      fabricObj = new fabric.Polyline(points, {
        fill: 'transparent',
        stroke: '#4a90d9',
        strokeWidth: 8,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        opacity: 0.7,
        selectable: true,
        hasControls: false,
        entityId: entity.id,
      });
    }

    entity.fabricObj = fabricObj;
    entity.points = points;
    return entity;
  }

  static deserialize(data) {
    return new Promise((resolve) => {
      fabric.util.enlivenObjects([data.fabricData], (objects) => {
        const entity = new WaterEntity(data);
        const obj = objects[0];
        obj.entityId = entity.id;
        entity.fabricObj = obj;
        resolve(entity);
      });
    });
  }
}
