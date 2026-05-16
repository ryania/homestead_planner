import { generateId } from '../utils.js';

export class EntityBase {
  constructor(data) {
    this.id = data.id || generateId();
    this.type = data.type;
    this.label = data.label || '';
    this.color = data.color || '#888888';
    this.notes = data.notes || '';
    this.fabricObj = null;
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      color: this.color,
      notes: this.notes,
      fabricData: this.fabricObj ? this.fabricObj.toObject(['entityId']) : null,
    };
  }

  updateLabel(text) {
    this.label = text;
  }

  updateColor(hex) {
    this.color = hex;
  }
}
