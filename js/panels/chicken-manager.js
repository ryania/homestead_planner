import { state, markDirty } from '../state.js';
import { generateId, formatAge, isoDate } from '../utils.js';

export function init() {
  document.getElementById('btn-chickens').addEventListener('click', open);
  document.getElementById('chicken-manager-close').addEventListener('click', close);
  document.querySelector('#modal-chicken-manager .modal-close').addEventListener('click', close);
  document.querySelector('#modal-chicken-manager .modal-backdrop').addEventListener('click', close);
  document.getElementById('btn-add-chicken').addEventListener('click', addChicken);
}

export function open() {
  const modal = document.getElementById('modal-chicken-manager');
  modal.classList.remove('hidden');
  render();
}

export function close() {
  document.getElementById('modal-chicken-manager').classList.add('hidden');
}

function render() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const hens = state.chickens.filter(c => c.type === 'hen').length;
  const roosters = state.chickens.filter(c => c.type === 'rooster').length;
  const total = state.chickens.length;
  document.getElementById('chicken-summary').textContent =
    `${total} bird${total !== 1 ? 's' : ''} total — ${roosters} rooster${roosters !== 1 ? 's' : ''}, ${hens} hen${hens !== 1 ? 's' : ''}`;
}

function renderList() {
  const container = document.getElementById('chicken-list');

  if (!state.chickens.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:12px;padding:8px 0;">No birds added yet.</p>';
    return;
  }

  const header = `<div class="chicken-row-header">
    <span>Name</span><span>Type</span><span>Breed</span><span>Hatch Date</span><span>Age / Notes</span><span></span>
  </div>`;

  const rows = state.chickens.map(chicken => buildRow(chicken)).join('');
  container.innerHTML = header + rows;

  container.querySelectorAll('[data-chicken-id]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.chickenId;
      const field = input.dataset.field;
      const chicken = state.chickens.find(c => c.id === id);
      if (chicken) {
        chicken[field] = input.value;
        markDirty();
        if (field === 'type') renderSummary();
        if (field === 'hatchDate') {
          const row = input.closest('.chicken-row');
          const ageSpan = row?.querySelector('.chicken-age');
          if (ageSpan) ageSpan.textContent = formatAge(input.value);
        }
      }
    });
  });

  container.querySelectorAll('[data-delete-chicken]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deleteChicken;
      state.chickens = state.chickens.filter(c => c.id !== id);
      markDirty();
      render();
    });
  });
}

function buildRow(chicken) {
  return `<div class="chicken-row">
    <input type="text" value="${escHtml(chicken.name)}" placeholder="Name"
      data-chicken-id="${chicken.id}" data-field="name">
    <select data-chicken-id="${chicken.id}" data-field="type">
      <option value="hen" ${chicken.type==='hen'?'selected':''}>Hen</option>
      <option value="rooster" ${chicken.type==='rooster'?'selected':''}>Rooster</option>
    </select>
    <input type="text" value="${escHtml(chicken.breed)}" placeholder="Breed"
      data-chicken-id="${chicken.id}" data-field="breed">
    <input type="date" value="${chicken.hatchDate || ''}"
      data-chicken-id="${chicken.id}" data-field="hatchDate">
    <span class="chicken-age" style="font-size:11px;color:var(--text-muted);">${formatAge(chicken.hatchDate)}</span>
    <button class="btn-icon" style="color:var(--accent-error);" data-delete-chicken="${chicken.id}">✕</button>
  </div>`;
}

function addChicken() {
  state.chickens.push({
    id: generateId(),
    name: '',
    type: 'hen',
    breed: '',
    hatchDate: '',
    notes: '',
    active: true,
  });
  markDirty();
  render();
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
