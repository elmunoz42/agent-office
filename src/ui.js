// 2D overlays: desk panel (Kanban + Gantt), task editor, and the
// RPG-style conversation view.
import { STATUSES, agentById } from './data.js';
import { store, today, addDays, diffDays, parse } from './store.js';
import { adapter } from './adapter.js';
import { COLUMNS, STATUSES as REG_STATUSES, STATUS_COLORS } from './registry.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const statusOf = (id) => STATUSES.find((s) => s.id === id);
const fmt = (s) => parse(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function initUI({ onMode }) {
  let mode = 'play'; // 'play' | 'dialogue' | 'panel'
  let agent = null;
  let tab = 'kanban';
  let scope = 'agent';
  let editing = null;
  let editingNew = false;
  let taskMode = false;
  let busy = false;
  let typer = null;
  let choices = [];
  let convo = 0; // bumps on every open/close so stale async replies are dropped

  const setMode = (m) => {
    mode = m;
    document.body.classList.toggle('ui-open', m !== 'play');
    document.body.classList.toggle('talking', m === 'dialogue');
    onMode(m, agent);
  };

  // ---------------- dialogue ----------------
  function speak(text) {
    clearInterval(typer);
    const el = $('d-line');
    let i = 0;
    el.textContent = '';
    el.dataset.full = text;
    el.classList.toggle('long', text.length > 220); // real agent replies can be paragraphs
    typer = setInterval(() => {
      i += 2;
      el.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(typer);
    }, 18);
  }
  function skipTyping() {
    clearInterval(typer);
    if ($('d-line').dataset.full) $('d-line').textContent = $('d-line').dataset.full;
  }
  function setBusy(b) {
    busy = b;
    $('d-choices').classList.toggle('busy', b);
  }
  let noticeTimer = 0;
  function notify(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('info');
    t.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { t.hidden = true; t.classList.remove('info'); }, 9000);
  }
  async function ask(label, payload) {
    if (busy) return;
    const token = convo;
    const who = agent;
    $('d-you').hidden = false;
    $('d-you').textContent = `You: ${label}`;
    setBusy(true);
    speak('…');
    if (payload.text && store.remote) $('d-mock').textContent = `Sent to ${who.name} in Paperclip · waiting for the agent to run (usually about a minute)`;
    const onProgress = ({ status, secs, ref }) => {
      if (token !== convo) return;
      $('d-role').textContent = `${who.role} · ${store.harness(who).replace(/ · [a-z_]+$/, '')} · ${status}`;
      $('d-mock').textContent = `Waiting for ${who.name} · Paperclip ${ref} · ${status === 'running' ? 'working on it' : status} · ${secs}s`;
    };
    let res;
    try { res = await adapter.chat(who, payload, { onProgress }); } catch (err) { res = { text: "(No reply — the agent bridge didn't answer.)", note: err.message || '' }; }
    if (token !== convo) {
      // you walked off mid-wait: keep the reply for next time and say it arrived
      if (res.live) notify(`${who.name} replied. Talk to ${who.name} again to read it.`);
      return;
    }
    setBusy(false);
    speak(res.text);
    $('d-mock').textContent = res.note ?? '';
    adapter.markSeen(who, res.id);
  }
  function setTaskMode(on) {
    taskMode = on;
    $('d-input').placeholder = on ? 'Describe the task, then press Enter…' : 'Say something else…';
  }
  function renderChoices() {
    choices = [
      ['What are you working on right now?', () => ask('What are you working on right now?', { intent: 'status' })],
      ['Is anything blocking you?', () => ask('Is anything blocking you?', { intent: 'blockers' })],
      ['What ships next, and when?', () => ask('What ships next, and when?', { intent: 'eta' })],
      ['Let me see your Kanban board.', () => openPanel(agent.id, 'kanban')],
      ['Pull up your Gantt chart.', () => openPanel(agent.id, 'gantt')],
      ['I have a new task for you.', () => {
        setTaskMode(true);
        $('d-you').hidden = true;
        speak('Go ahead — what do you need done?');
        $('d-input').focus();
      }],
      ["That's all for now.", close],
    ];
    $('d-choices').innerHTML = choices.map(([t], i) => `<li data-i="${i}"><i>${i + 1}</i><span>${esc(t)}</span></li>`).join('');
  }
  function openDialogue(id) {
    const a = agentById(id);
    if (!a || !store.isActive(a)) return;
    convo++;
    agent = a;
    hidePanel();
    $('registry').hidden = true;
    $('dialogue').hidden = false;
    $('d-name').textContent = a.name;
    $('d-role').textContent = `${a.role} · ${store.harness(a)}`;
    $('d-you').hidden = true;
    $('d-mock').textContent = '';
    $('d-input').value = '';
    setTaskMode(false);
    setBusy(false);
    renderChoices();
    speak(a.voice.greeting);
    setMode('dialogue');
    // show a Paperclip reply that arrived after you left (or after a reload)
    const token = convo;
    adapter.missed(a).then((m) => {
      if (!m || token !== convo || busy) return;
      if (m.question) { $('d-you').hidden = false; $('d-you').textContent = `You asked: ${m.question}`; }
      speak(m.text);
      $('d-mock').textContent = m.note;
      adapter.markSeen(a, m.id);
    });
  }
  $('d-choices').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li && !busy) choices[+li.dataset.i][1]();
  });
  $('d-line').addEventListener('click', skipTyping);
  $('d-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = $('d-input').value.trim();
    if (!text || busy) return;
    $('d-input').value = '';
    if (taskMode) {
      setTaskMode(false);
      const token = convo;
      $('d-you').hidden = false;
      $('d-you').textContent = `You: New task — ${text}`;
      setBusy(true);
      speak('…');
      const t = await store.add({ assignee: agent.id, title: text, status: 'todo' });
      if (token !== convo) return;
      setBusy(false);
      speak(t
        ? `Added “${t.title}” to my To do column${t.ref ? ` as ${t.ref}` : ''}, pencilled in through ${fmt(t.end)}. You can adjust the dates on my Gantt.`
        : "That didn't go through — Paperclip rejected the new task.");
      $('d-mock').textContent = store.remote ? (t ? `Created in Paperclip · ${t.ref}` : '') : 'Demo data — Paperclip is not connected';
    } else {
      ask(text, { text });
    }
    $('d-input').blur();
  });

  // ---------------- panel ----------------
  const scopeTasks = () => (scope === 'team' ? store.activeTasks() : store.tasksFor(agent.id));

  function card(t) {
    const who = scope === 'team' ? `<span class="chip">${esc(agentById(t.assignee)?.name ?? t.assignee)}</span>` : '';
    return `<article class="card" draggable="true" data-id="${t.id}" style="--c:${statusOf(t.status).color}">
      ${esc(t.title)}
      <div class="meta">${t.ref ? `<span class="chip ref">${esc(t.ref)}</span>` : ''}${who}<span>${fmt(t.start)} – ${fmt(t.end)}</span>${t.blocked ? '<span class="chip blocked">Blocked</span>' : ''}</div>
    </article>`;
  }
  function renderKanban() {
    const tasks = scopeTasks();
    $('p-body').innerHTML = `<div class="kb">${STATUSES.map((s) => {
      const mine = tasks.filter((t) => t.status === s.id);
      return `<section class="col" data-status="${s.id}">
        <header><i style="background:${s.color}"></i>${s.label}<span>${mine.length}</span></header>
        <div class="cards">${mine.map(card).join('')}</div>
        <button class="add" data-add="${s.id}">+ Add task</button>
      </section>`;
    }).join('')}</div>`;
  }
  function renderGantt() {
    const tasks = scopeTasks().slice().sort((a, b) => a.assignee.localeCompare(b.assignee) || a.start.localeCompare(b.start));
    if (!tasks.length) { $('p-body').innerHTML = '<div class="empty">No tasks yet. Add one from the Kanban tab.</div>'; return; }
    const t0 = today();
    let min = tasks.reduce((m, t) => (t.start < m ? t.start : m), t0);
    let max = tasks.reduce((m, t) => (t.end > m ? t.end : m), t0);
    min = addDays(min, -2); max = addDays(max, 3);
    const n = Math.max(21, diffDays(max, min) + 1);
    const DW = 30;
    const days = Array.from({ length: n }, (_, i) => {
      const d = parse(addDays(min, i));
      const we = d.getDay() === 0 || d.getDay() === 6;
      const month = (i === 0 && d.getDate() < 26) || d.getDate() === 1 ? `<em>${d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</em>` : '';
      return `<div class="g-day${we ? ' we' : ''}" style="left:${i * DW}px;width:${DW}px">${month}${d.getDate()}</div>`;
    }).join('');
    const grid = Array.from({ length: n }, (_, i) => {
      const d = parse(addDays(min, i));
      const we = d.getDay() === 0 || d.getDay() === 6;
      return `<div class="g-day${we ? ' we' : ''}" style="left:${i * DW}px;width:${DW}px"></div>`;
    }).join('');
    const rows = tasks.map((t) => {
      const s = statusOf(t.status);
      const a = agentById(t.assignee);
      const left = diffDays(t.start, min) * DW, width = (diffDays(t.end, t.start) + 1) * DW - 4;
      const label = scope === 'team' ? `${a?.name ?? ''} · ${t.title}` : t.title;
      return `<div class="g-row"><div class="g-label" data-id="${t.id}" title="${esc(label)}"><i style="background:${a?.color ?? '#888'}"></i><span>${esc(label)}</span></div>
        <div class="g-track" style="width:${n * DW}px">${grid}<div class="g-bar${t.blocked ? ' blocked' : ''}" data-id="${t.id}" style="left:${left + 2}px;width:${width}px;--c:${s.color}" title="${esc(t.title)} · ${s.label} · ${fmt(t.start)} – ${fmt(t.end)}">${esc(s.label)}</div></div></div>`;
    }).join('');
    $('p-body').innerHTML = `<div class="gantt">
      <div class="g-row head"><div class="g-label" style="cursor:default;color:var(--dim)">${tasks.length} task${tasks.length === 1 ? '' : 's'}</div><div class="g-track" style="width:${n * DW}px">${days}</div></div>
      ${rows}
      <div class="g-today" style="left:${270 + diffDays(t0, min) * DW + DW / 2}px"></div>
    </div>`;
  }
  function renderPanel() {
    if (mode !== 'panel') return;
    $('p-dot').style.background = agent.color;
    $('p-name').textContent = scope === 'team' ? 'Whole team' : agent.name;
    $('p-role').textContent = scope === 'team' ? `${store.activeAgents().length} agents on shift` : `${agent.role} · ${store.harness(agent)}`;
    document.querySelectorAll('#panel [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('#panel [data-scope]').forEach((b) => b.classList.toggle('on', b.dataset.scope === scope));
    $('p-talk').textContent = `Talk to ${agent.name.split(' ')[0]}`;
    const scroll = [$('p-body').scrollLeft, $('p-body').scrollTop];
    if (tab === 'kanban') renderKanban(); else renderGantt();
    [$('p-body').scrollLeft, $('p-body').scrollTop] = scroll;
  }
  function openPanel(id, which = 'kanban') {
    const a = agentById(id);
    if (!a || !store.isActive(a)) return;
    convo++;
    agent = a;
    tab = which;
    scope = 'agent';
    clearInterval(typer);
    $('dialogue').hidden = true;
    $('registry').hidden = true;
    $('panel').hidden = false;
    setMode('panel');
    renderPanel();
  }
  function hidePanel() { $('panel').hidden = true; closeEditor(); }

  $('panel').addEventListener('click', (e) => {
    const t = e.target;
    if (t.dataset.tab) { tab = t.dataset.tab; renderPanel(); }
    else if (t.dataset.scope) { scope = t.dataset.scope; renderPanel(); }
    else if (t.dataset.add) openEditor(null, { assignee: agent.id, status: t.dataset.add });
    else if (t.id === 'p-close' || t.id === 'panel') close();
    else if (t.id === 'p-talk') openDialogue(agent.id);
    else {
      const el = t.closest('[data-id]');
      if (el) openEditor(el.dataset.id);
    }
  });
  // drag cards between columns
  let dragId = null;
  $('p-body').addEventListener('dragstart', (e) => {
    const c = e.target.closest('.card');
    if (!c) return;
    dragId = c.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
    requestAnimationFrame(() => c.classList.add('dragging'));
  });
  $('p-body').addEventListener('dragend', () => { dragId = null; document.querySelectorAll('.col.over, .card.dragging').forEach((n) => n.classList.remove('over', 'dragging')); });
  $('p-body').addEventListener('dragover', (e) => {
    const col = e.target.closest('.col');
    if (!col || !dragId) return;
    e.preventDefault();
    document.querySelectorAll('.col.over').forEach((n) => n !== col && n.classList.remove('over'));
    col.classList.add('over');
  });
  $('p-body').addEventListener('drop', (e) => {
    const col = e.target.closest('.col');
    const id = dragId ?? e.dataTransfer.getData('text/plain');
    if (!col || !id) return;
    e.preventDefault();
    store.update(id, { status: col.dataset.status });
  });

  // ---------------- editor ----------------
  // Edits an existing task (by id), or a draft that is only created on Save.
  function openEditor(id, draft = null) {
    const t0 = today();
    const t = draft ? { title: '', start: t0, end: addDays(t0, 3), blocked: false, ...draft } : store.get(id);
    if (!t) return;
    editing = draft ? 'new' : id;
    editingNew = !!draft;
    $('e-form').querySelector('h2').textContent = draft ? 'New task' : `Edit task${t.ref ? ` · ${t.ref}` : ''}`;
    $('e-delete').hidden = !!draft;
    $('e-delete').textContent = store.remote ? 'Cancel issue' : 'Delete';
    $('e-title').value = t.title;
    $('e-assignee').innerHTML = store.activeAgents().map((a) => `<option value="${a.id}">${esc(a.name)} — ${esc(a.role)}</option>`).join('');
    $('e-assignee').value = t.assignee;
    $('e-status').innerHTML = STATUSES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
    $('e-status').value = t.status;
    $('e-start').value = t.start;
    $('e-end').value = t.end;
    $('e-blocked').checked = t.blocked;
    $('editor').hidden = false;
    $('e-title').focus();
    $('e-title').select();
  }
  function closeEditor() { editing = null; editingNew = false; $('editor').hidden = true; }
  $('e-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editing, isNew = editingNew;
    const fields = {
      title: $('e-title').value.trim() || 'Untitled task', assignee: $('e-assignee').value, status: $('e-status').value,
      start: $('e-start').value, end: $('e-end').value, blocked: $('e-blocked').checked,
    };
    closeEditor();
    if (isNew) store.add(fields); else store.update(id, fields);
  });
  $('e-cancel').addEventListener('click', () => closeEditor());
  $('e-delete').addEventListener('click', () => { const id = editing; closeEditor(); store.remove(id); });
  $('editor').addEventListener('click', (e) => { if (e.target.id === 'editor') closeEditor(); });

  // ---------------- server-room registry ----------------
  let regDraft = [];
  let regDirty = false;
  const REG_LABELS = { rack: 'Rack', resource: 'Resource', type: 'Type', identifier: 'Identifier', region: 'Region', status: 'Status', notes: 'Notes' };
  function setRegDirty(d) { regDirty = d; $('r-save').disabled = !d; }
  function renderRegistry() {
    const info = store.registryInfo;
    $('r-sub').textContent = store.remote
      ? (info ? `Paperclip · ${info.ref} · document “infrastructure” · revision ${info.revision} · owned by ${agentById('backend')?.name ?? 'the backend dev'}`
        : 'No “Infrastructure registry” issue found in Paperclip')
      : 'Demo data · saved in this browser only';
    const cell = (r, i, k) => (k === 'status'
      ? `<td class="st"><i style="background:${STATUS_COLORS[r.status] ?? STATUS_COLORS.unknown}"></i><select data-i="${i}" data-k="status">${REG_STATUSES.map((s) => `<option${s === r.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>`
      : `<td><input data-i="${i}" data-k="${k}" value="${esc(r[k] ?? '')}" aria-label="${REG_LABELS[k]}" /></td>`);
    $('r-body').innerHTML = `<table class="reg">
      <thead><tr>${COLUMNS.map((k) => `<th>${REG_LABELS[k]}</th>`).join('')}<th></th></tr></thead>
      <tbody>${regDraft.map((r, i) => `<tr class="${i === 0 || regDraft[i - 1].rack !== r.rack ? 'first' : ''}">${COLUMNS.map((k) => cell(r, i, k)).join('')}<td class="rm"><button data-rm="${i}" aria-label="Remove ${esc(r.resource)}">✕</button></td></tr>`).join('')}</tbody>
    </table>
    <p class="reg-note">One rack is drawn per distinct <b>Rack</b> value, with one unit per row. ${store.remote ? 'Saving writes a new revision of the Paperclip document; the backend dev can also edit it there.' : ''} Don't put secrets, keys or passwords in this table.</p>`;
  }
  function openRegistry() {
    convo++;
    clearInterval(typer);
    $('dialogue').hidden = true;
    hidePanel();
    regDraft = store.registry.map((r) => ({ ...r }));
    setRegDirty(false);
    $('registry').hidden = false;
    setMode('registry');
    renderRegistry();
  }
  $('r-body').addEventListener('input', (e) => {
    const { i, k } = e.target.dataset;
    if (i === undefined) return;
    regDraft[+i][k] = e.target.value;
    setRegDirty(true);
    if (k === 'status') e.target.previousElementSibling.style.background = STATUS_COLORS[e.target.value];
  });
  $('registry').addEventListener('click', async (e) => {
    const t = e.target;
    if (t.dataset.rm !== undefined) { regDraft.splice(+t.dataset.rm, 1); setRegDirty(true); renderRegistry(); }
    else if (t.id === 'r-add') {
      regDraft.push({ rack: regDraft[regDraft.length - 1]?.rack ?? 'New rack', resource: '', type: '', identifier: '', region: '', status: 'planned', notes: '' });
      setRegDirty(true);
      renderRegistry();
      $('r-body').querySelector('tbody tr:last-child input[data-k="resource"]')?.focus();
    } else if (t.id === 'r-save') {
      const rows = regDraft.filter((r) => r.rack.trim() || r.resource.trim()).map((r) => ({ ...r, rack: r.rack.trim() || 'Unassigned' }));
      $('r-save').disabled = true;
      const ok = await store.saveRegistry(rows);
      if (mode !== 'registry') return;
      if (ok) { regDraft = store.registry.map((r) => ({ ...r })); setRegDirty(false); renderRegistry(); } else setRegDirty(true);
    } else if (t.id === 'r-close' || t.id === 'registry') close();
  });

  // ---------------- shared ----------------
  function close() {
    convo++;
    clearInterval(typer);
    $('dialogue').hidden = true;
    $('registry').hidden = true;
    hidePanel();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setMode('play');
  }
  function key(e) {
    if (mode === 'play') return false;
    if (e.key === 'Escape') {
      if (editing) closeEditor();
      else if (taskMode) { setTaskMode(false); $('d-input').blur(); }
      else close();
      return true;
    }
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '');
    if (mode === 'dialogue' && !typing) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= choices.length && !busy) { e.preventDefault(); choices[n - 1][1](); }
      else if (e.key === ' ' || e.key === 'Enter') skipTyping();
    }
    return true;
  }
  store.subscribe(() => {
    renderPanel();
    // pick up edits made in Paperclip while the table is open, unless there are unsaved changes here
    if (mode === 'dialogue' && agent && !busy) $('d-role').textContent = `${agent.role} · ${store.harness(agent)}`;
    if (mode === 'registry' && !regDirty) { regDraft = store.registry.map((r) => ({ ...r })); renderRegistry(); }
    if (agent && !store.isActive(agent) && mode !== 'play') close();
  });

  return { openDialogue, openPanel, openRegistry, close, key, get mode() { return mode; }, get agent() { return agent; } };
}
