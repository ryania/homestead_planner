import { generateId, formatDate, isoDate } from '../utils.js';
import { updateEntityField, getEntity, bus } from '../state.js';

export function render(entityId) {
  const entity = getEntity(entityId);
  if (!entity || entity.type !== 'tree') return '';

  const issues = entity.instance?.issues || [];

  const itemsHtml = issues.length
    ? issues.map(issue => renderIssueItem(issue, entityId)).join('')
    : '<p style="color:var(--text-muted);font-size:11px;">No issues recorded.</p>';

  return `
    <div class="panel-section" id="issue-tracker-section">
      <h3>Issues</h3>
      <div class="issues-list" id="issues-list-${entityId}">${itemsHtml}</div>
      <button class="btn-icon" id="btn-add-issue" style="font-size:11px;width:100%;">+ Add Issue</button>
    </div>
  `;
}

export function bindEvents(entityId, container) {
  const addBtn = container.querySelector('#btn-add-issue');
  if (addBtn) {
    addBtn.addEventListener('click', () => addIssue(entityId, container));
  }

  container.querySelectorAll('[data-resolve-issue]').forEach(btn => {
    btn.addEventListener('click', () => {
      const issueId = btn.dataset.resolveIssue;
      resolveIssue(entityId, issueId, container);
    });
  });

  container.querySelectorAll('[data-delete-issue]').forEach(btn => {
    btn.addEventListener('click', () => {
      const issueId = btn.dataset.deleteIssue;
      deleteIssue(entityId, issueId, container);
    });
  });
}

function renderIssueItem(issue, entityId) {
  const typeClass = `issue-type-${issue.type || 'other'}`;
  const resolvedClass = issue.resolved ? 'resolved' : '';
  return `
    <div class="issue-item ${resolvedClass}" data-issue-id="${issue.id}">
      <div class="issue-item-header">
        <span class="issue-type-badge ${typeClass}">${issue.type || 'other'}</span>
        <span class="issue-date">${formatDate(issue.date)}</span>
        ${issue.resolved ? '<span style="color:var(--accent-green);font-size:10px;">Resolved</span>' : ''}
      </div>
      <div class="issue-desc">${issue.description || '(no description)'}</div>
      <div class="issue-actions">
        ${!issue.resolved
          ? `<button class="btn-icon" data-resolve-issue="${issue.id}">Mark Resolved</button>`
          : ''}
        <button class="btn-icon" style="color:var(--accent-error);" data-delete-issue="${issue.id}">Delete</button>
      </div>
    </div>
  `;
}

function addIssue(entityId, container) {
  const entity = getEntity(entityId);
  if (!entity) return;

  const newIssue = {
    id: generateId(),
    date: isoDate(),
    type: 'pest',
    description: '',
    resolved: false,
    resolvedDate: null,
  };

  const issues = [...(entity.instance?.issues || []), newIssue];
  updateEntityField(entityId, 'instance.issues', issues);

  rerenderList(entityId, container);
}

function resolveIssue(entityId, issueId, container) {
  const entity = getEntity(entityId);
  if (!entity) return;

  const issues = (entity.instance?.issues || []).map(i =>
    i.id === issueId ? { ...i, resolved: true, resolvedDate: isoDate() } : i
  );
  updateEntityField(entityId, 'instance.issues', issues);
  rerenderList(entityId, container);
}

function deleteIssue(entityId, issueId, container) {
  const entity = getEntity(entityId);
  if (!entity) return;

  const issues = (entity.instance?.issues || []).filter(i => i.id !== issueId);
  updateEntityField(entityId, 'instance.issues', issues);
  rerenderList(entityId, container);
}

function rerenderList(entityId, container) {
  const entity = getEntity(entityId);
  const issues = entity?.instance?.issues || [];
  const listEl = container.querySelector(`#issues-list-${entityId}`);
  if (listEl) {
    listEl.innerHTML = issues.length
      ? issues.map(i => renderIssueItem(i, entityId)).join('')
      : '<p style="color:var(--text-muted);font-size:11px;">No issues recorded.</p>';
    bindEvents(entityId, container);
  }
}
