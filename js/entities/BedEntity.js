import { EntityBase } from './EntityBase.js';
import { generateId } from '../utils.js';

const fabric = window.fabric;

const SUBTYPE_STYLES = {
  raised: { fill: 'rgba(101,67,33,0.3)', stroke: '#654321' },
  'in-ground': { fill: 'rgba(76,153,0,0.2)', stroke: '#4c9900' },
  container: { fill: 'rgba(96,96,96,0.3)', stroke: '#606060' },
  hugelkultur: { fill: 'rgba(139,90,43,0.25)', stroke: '#8B5A2B' },
};

export class BedEntity extends EntityBase {
  constructor(data) {
    super({ ...data, type: 'bed' });
    this.subtype = data.subtype || 'raised';
    this.contents = data.contents || '';
  }

  serialize() {
    return { ...super.serialize(), subtype: this.subtype, contents: this.contents };
  }

  static create({ left, top, width, height }, opts = {}) {
    const subtype = opts.subtype || 'raised';
    const style = SUBTYPE_STYLES[subtype] || SUBTYPE_STYLES['raised'];

    const entity = new BedEntity({
      id: generateId(),
      label: opts.label || 'Garden Bed',
      color: style.stroke,
      subtype,
      contents: opts.contents || '',
    });

    const rect = new fabric.Rect({
      left, top, width, height,
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: 2,
      originX: 'left',
      originY: 'top',
    });

    const text = new fabric.Text(entity.label, {
      left: left + width / 2,
      top: top + 6,
      fontSize: 11,
      fill: '#ffffffcc',
      fontFamily: 'system-ui, sans-serif',
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
    });

    const group = new fabric.Group([rect, text], {
      left, top,
      selectable: true,
      hasControls: true,
      entityId: entity.id,
    });

    entity.fabricObj = group;
    return entity;
  }

  static deserialize(data) {
    return new Promise((resolve) => {
      fabric.util.enlivenObjects([data.fabricData], (objects) => {
        const entity = new BedEntity(data);
        const obj = objects[0];
        obj.entityId = entity.id;
        entity.fabricObj = obj;
        resolve(entity);
      });
    });
  }
}
