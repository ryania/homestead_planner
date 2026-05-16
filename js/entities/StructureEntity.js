import { EntityBase } from './EntityBase.js';
import { generateId } from '../utils.js';

const fabric = window.fabric;

export class StructureEntity extends EntityBase {
  constructor(data) {
    super({ ...data, type: 'structure' });
    this.subtype = data.subtype || 'building';
  }

  serialize() {
    return { ...super.serialize(), subtype: this.subtype };
  }

  static create({ left, top, width, height }, opts = {}) {
    const entity = new StructureEntity({
      id: generateId(),
      label: opts.label || 'Structure',
      color: opts.color || '#8B6914',
      subtype: opts.subtype || 'building',
    });

    const rect = new fabric.Rect({
      left, top, width, height,
      fill: 'rgba(139,105,20,0.3)',
      stroke: '#8B6914',
      strokeWidth: 2,
      originX: 'left',
      originY: 'top',
    });

    const text = new fabric.Text(entity.label, {
      left: left + width / 2,
      top: top + height / 2,
      fontSize: 12,
      fill: '#fff',
      fontFamily: 'system-ui, sans-serif',
      originX: 'center',
      originY: 'center',
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
    entity._rect = rect;
    entity._text = text;
    return entity;
  }

  static deserialize(data, fabricCanvas) {
    return new Promise((resolve) => {
      fabric.util.enlivenObjects([data.fabricData], (objects) => {
        const entity = new StructureEntity(data);
        const obj = objects[0];
        obj.entityId = entity.id;
        entity.fabricObj = obj;
        resolve(entity);
      });
    });
  }
}
