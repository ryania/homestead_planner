import { getEntity, updateEntityField } from '../state.js';
import { formatAge, pxToFeet } from '../utils.js';
import { getById } from '../db/plant-db.js';

export function render(entityId) {
  const entity = getEntity(entityId);
  if (!entity || entity.type !== 'tree') return '';

  const inst = entity.instance || {};
  const dbEntry = entity.plantEntry || (entity.plantDbId ? getById(entity.plantDbId) : null);

  const maxHeightStr = dbEntry?.mature?.heightFt
    ? `${dbEntry.mature.heightFt.min}–${dbEntry.mature.heightFt.max} ft`
    : '—';
  const lifespanStr = dbEntry?.mature?.lifespanYears
    ? `${dbEntry.mature.lifespanYears.min}–${dbEntry.mature.lifespanYears.max} yrs`
    : '—';
  const spacingStr = dbEntry?.spacing?.recommendedFt ? `${dbEntry.spacing.recommendedFt} ft` : '—';
  const ageStr = formatAge(inst.plantingDate);
  const pollStr = dbEntry?.pollination
    ? dbEntry.pollination.selfFertile
      ? 'Self-fertile'
      : dbEntry.pollination.pollinatorRequired
        ? 'Requires companion'
        : 'Partial'
    : '—';

  return `
    <div class="panel-section">
      <h3>Plant Info</h3>
      ${dbEntry ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-style:italic;">${dbEntry.scientificName}</div>` : ''}
      <div class="prop-row">
        <label>Planted</label>
        <input type="date" id="pi-planting-date" value="${inst.plantingDate || ''}" data-field="instance.plantingDate">
      </div>
      <div class="prop-row">
        <label>Age</label>
        <span class="read-only">${ageStr}</span>
      </div>
      <div class="prop-row">
        <label>Curr. Height</label>
        <input type="number" id="pi-height" value="${inst.currentHeightFt || ''}" min="0" step="0.5" placeholder="ft" data-field="instance.currentHeightFt">
      </div>
      <div class="prop-row">
        <label>Max Height</label>
        <span class="read-only">${maxHeightStr}</span>
      </div>
      <div class="prop-row">
        <label>Lifespan</label>
        <span class="read-only">${lifespanStr}</span>
      </div>
      <div class="prop-row">
        <label>Spacing</label>
        <span class="read-only">${spacingStr}</span>
      </div>
      <div class="prop-row">
        <label>Pollination</label>
        <span class="read-only">${pollStr}</span>
      </div>
      ${dbEntry?.pollination?.notes ? `<div style="font-size:10px;color:var(--text-muted);margin-top:4px;line-height:1.4;">${dbEntry.pollination.notes}</div>` : ''}
      ${dbEntry?.notes ? `<div style="font-size:10px;color:var(--text-muted);margin-top:4px;line-height:1.4;">&#9432; ${dbEntry.notes}</div>` : ''}
    </div>
  `;
}

export function bindEvents(entityId, container) {
  container.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('change', () => {
      const val = input.type === 'number' ? parseFloat(input.value) : input.value;
      updateEntityField(entityId, input.dataset.field, val);
    });
  });
}
