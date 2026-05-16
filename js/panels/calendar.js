import { state } from '../state.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Month indices (0-based) when each task applies per category
// These are approximate for temperate zones (5-7); we shift by zone below
const BASE_SEASONS = {
  'fruit-tree':  { plant:[1,2,3],    prune:[1,2],    bloom:[3,4],    harvest:[6,7,8,9]  },
  'nut-tree':    { plant:[2,3],      prune:[1,2],    bloom:[3,4],    harvest:[8,9,10]   },
  'berry-bush':  { plant:[2,3,4],    prune:[1,2],    bloom:[3,4,5],  harvest:[5,6,7,8]  },
  'cane-fruit':  { plant:[2,3,4],    prune:[1,2],    bloom:[4,5],    harvest:[5,6,7]    },
  'shrub':       { plant:[2,3,4],    prune:[1,2],    bloom:[3,4,5],  harvest:[7,8,9]    },
  'vine':        { plant:[3,4],      prune:[1,2],    bloom:[4,5],    harvest:[7,8,9]    },
};

const TASK_COLORS = {
  plant:   '#4caf50',
  prune:   '#2196f3',
  bloom:   '#e91e63',
  harvest: '#ff9800',
};

const TASK_LABELS = {
  plant: 'Plant',
  prune: 'Prune',
  bloom: 'Bloom',
  harvest: 'Harvest',
};

// Zone shift: warmer zones shift seasons earlier, colder zones later
function shiftMonths(months, zone) {
  const shift = zone ? Math.round((zone - 6) * -0.5) : 0; // zone 6 = no shift
  return months.map(m => ((m + shift) % 12 + 12) % 12);
}

function getSeason(category, zone) {
  const base = BASE_SEASONS[category] || BASE_SEASONS['shrub'];
  const result = {};
  for (const [task, months] of Object.entries(base)) {
    result[task] = shiftMonths(months, zone);
  }
  return result;
}

export function openCalendar() {
  const modal = document.getElementById('modal-calendar');
  if (modal) {
    const zone = state.settings.usdaZone || 6;
    const zoneEl = document.getElementById('cal-zone-display');
    if (zoneEl) zoneEl.textContent = zone;
    renderCalendar();
    modal.classList.remove('hidden');
  }
}

function renderCalendar() {
  const container = document.getElementById('calendar-body');
  if (!container) return;

  const zone = state.settings.usdaZone || 6;
  const trees = [];
  state.entities.forEach(e => {
    if (e.type === 'tree' && e.plantEntry) trees.push(e);
  });

  if (trees.length === 0) {
    container.innerHTML = '<p class="cal-empty">No trees or bushes placed yet. Add trees to see a planting calendar.</p>';
    return;
  }

  let html = `
    <div class="cal-legend">
      ${Object.entries(TASK_LABELS).map(([k, v]) =>
        `<span class="cal-legend-item"><span class="cal-dot" style="background:${TASK_COLORS[k]}"></span>${v}</span>`
      ).join('')}
    </div>
    <div class="cal-scroll">
    <table class="cal-table">
      <thead>
        <tr>
          <th class="cal-plant-col">Plant</th>
          ${MONTHS.map(m => `<th>${m}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  trees.forEach(entity => {
    const plant = entity.plantEntry;
    const category = plant.category || 'shrub';
    const season = getSeason(category, zone);

    html += `<tr>
      <td class="cal-plant-col" title="${plant.scientificName || ''}">
        <span class="cal-plant-dot" style="background:${entity.color}"></span>
        ${plant.commonName || entity.label}
      </td>`;

    for (let m = 0; m < 12; m++) {
      const tasks = Object.entries(season)
        .filter(([, months]) => months.includes(m))
        .map(([task]) => task);

      if (tasks.length === 0) {
        html += '<td class="cal-cell"></td>';
      } else {
        const bars = tasks.map(t =>
          `<span class="cal-bar" style="background:${TASK_COLORS[t]}" title="${TASK_LABELS[t]}"></span>`
        ).join('');
        html += `<td class="cal-cell cal-active">${bars}</td>`;
      }
    }
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  // Current month highlight
  const curMonth = new Date().getMonth();
  container.innerHTML = html;

  // Highlight current month column (th index = curMonth + 1, since first col is plant name)
  container.querySelectorAll('table tr').forEach(row => {
    const cells = row.querySelectorAll('th, td');
    if (cells[curMonth + 1]) cells[curMonth + 1].classList.add('cal-current-month');
  });
}

export function init() {
  document.getElementById('btn-calendar')?.addEventListener('click', openCalendar);
  document.getElementById('calendar-close')?.addEventListener('click', () => {
    document.getElementById('modal-calendar')?.classList.add('hidden');
  });
  document.querySelector('#modal-calendar .modal-backdrop')?.addEventListener('click', () => {
    document.getElementById('modal-calendar')?.classList.add('hidden');
  });
}
