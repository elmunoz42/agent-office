// Single source of truth for tasks. Kanban, Gantt and the in-world boards are
// all views over this store.
//
// Two modes:
//   - connected: roster and tasks come from Paperclip (agents + issues) and
//     edits are written back to it. Paperclip issues have no planned dates,
//     so Gantt start/end are kept as a local overlay per issue.
//   - demo: when Paperclip isn't reachable, seeded tasks in localStorage.
import { AGENTS, SEED_TASKS, agentById } from './data.js';
import { DEFAULT_ROWS, parseRegistry, serializeRegistry } from './registry.js';

const KEY = 'agent-office-v1';
const DATES_KEY = 'agent-office-dates-v1';
const REGISTRY_KEY = 'agent-office-registry-v1';
const MAX_CONTRACTORS = AGENTS.filter((a) => a.slot).length;

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s) => new Date(`${s}T12:00:00`);
export const today = () => iso(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);

let nextId = 1;
const newId = () => `t${Date.now().toString(36)}${nextId++}`;
const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };

function seed() {
  const t0 = today();
  return {
    contractors: 2,
    tasks: SEED_TASKS.map(([assignee, title, status, s, e, blocked]) => ({
      id: newId(), assignee, title, status, start: addDays(t0, s), end: addDays(t0, e), blocked: !!blocked,
    })),
  };
}
const saved = readJson(KEY);
const local = saved && Array.isArray(saved.tasks) ? saved : seed();

// ---- Paperclip mode ----
let remote = null;
let remoteTasks = [];
let remoteSig = '';
// Server-room lookup table. Connected: the Paperclip document; otherwise local.
let registry = { rows: readJson(REGISTRY_KEY) ?? DEFAULT_ROWS, info: null, pre: undefined, post: '' };
const dates = readJson(DATES_KEY) || {};
// Paperclip status <-> office column. "blocked" is a status in Paperclip but a
// flag here: a blocked issue sits in To do (or In progress once started).
const TO_COL = { backlog: 'backlog', todo: 'todo', in_progress: 'doing', in_review: 'review', done: 'done' };
const FROM_COL = { backlog: 'backlog', todo: 'todo', doing: 'in_progress', review: 'in_review', done: 'done' };

function mapIssue(i, byRemoteId) {
  const agent = byRemoteId.get(i.assigneeAgentId);
  if (!agent || i.status === 'cancelled' || i.hiddenAt || remote.isChatIssue(i)) return null;
  const blocked = i.status === 'blocked';
  const d = dates[i.id] ?? {};
  const start = d.start ?? iso(new Date(i.startedAt ?? i.createdAt));
  let end = d.end ?? (i.completedAt ? iso(new Date(i.completedAt)) : addDays(start, 4));
  if (end < start) end = start;
  return {
    id: i.id, ref: i.identifier, assignee: agent.id, title: i.title, priority: i.priority,
    status: blocked ? (i.startedAt ? 'doing' : 'todo') : TO_COL[i.status] ?? 'todo',
    blocked, start, end,
  };
}

// Which coding agent Paperclip runs this agent on, for display.
function harnessName(ra) {
  const c = ra.adapterConfig ?? {};
  const key = ra.adapterType === 'paperclip_runner' ? (c.provider === 'acpx' ? c.acpxAgent : c.provider) : ra.adapterType;
  return { codex: 'Codex', codex_local: 'Codex', claude: 'Claude Code', claude_local: 'Claude Code' }[key] ?? key ?? 'agent';
}

const listeners = new Set();
const errorListeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const fail = (err) => { console.warn('[office]', err); errorListeners.forEach((fn) => fn(err.message || String(err))); };
function commitLocal() { writeJson(KEY, local); emit(); }

async function refresh() {
  if (!remote) return;
  const [agents, issues] = await Promise.all([remote.listAgents(), remote.listIssues()]);
  const byRemoteId = new Map();
  for (const a of AGENTS) a.remote = null;
  for (const ra of agents) {
    const a = agentById(ra.metadata?.officeId);
    if (!a || ra.status === 'terminated') continue;
    a.remote = { id: ra.id, status: ra.status, harness: harnessName(ra) };
    a.name = ra.name;
    if (ra.title) a.role = ra.title;
    byRemoteId.set(ra.id, a);
  }
  const tasks = issues.map((i) => mapIssue(i, byRemoteId)).filter(Boolean);
  const reg = await remote.getRegistry(issues);
  registry = reg
    ? { ...parseRegistry(reg.body), info: { issueId: reg.issueId, ref: reg.ref, revisionId: reg.revisionId, revision: reg.revision } }
    : { rows: [], info: null, pre: undefined, post: '' };
  const sig = JSON.stringify([tasks, AGENTS.map((a) => a.remote), registry.rows, registry.info?.revisionId]);
  remoteTasks = tasks;
  if (sig !== remoteSig) { remoteSig = sig; emit(); }
}
// Apply a change locally right away, write it to Paperclip, then re-read.
async function write(optimistic, send) {
  optimistic?.();
  emit();
  try { await send(); } catch (err) { fail(err); }
  remoteSig = '';
  try { await refresh(); } catch (err) { fail(err); }
}

const tasks = () => (remote ? remoteTasks : local.tasks);

export const store = {
  maxContractors: MAX_CONTRACTORS,
  get remote() { return remote; },
  get contractors() { return remote ? AGENTS.filter((a) => a.slot && a.remote).length : local.contractors; },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  onError(fn) { errorListeners.add(fn); },

  /** Switch to Paperclip as the source of truth. */
  async connect(connection) {
    remote = connection;
    await refresh();
    setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 6000);
  },
  refresh,

  isActive: (agent) => (remote ? !!agent.remote
    : (!agent.slot || agent.slot <= local.contractors) && (!agent.researchSlot || agent.researchSlot === 1)),
  activeAgents: () => AGENTS.filter((a) => store.isActive(a)),
  harness: (agent) => (remote && agent.remote
    ? `Paperclip · ${agent.remote.harness} · ${agent.remote.status}`
    : agent.harness),
  tasksFor: (agentId) => tasks().filter((t) => t.assignee === agentId),
  activeTasks: () => {
    const ids = new Set(store.activeAgents().map((a) => a.id));
    return tasks().filter((t) => ids.has(t.assignee));
  },
  get: (id) => tasks().find((t) => t.id === id),

  async add(task) {
    const t0 = today();
    const t = { title: 'New task', status: 'todo', start: t0, end: addDays(t0, 3), blocked: false, ...task };
    if (!remote) {
      t.id = newId();
      local.tasks.push(t);
      commitLocal();
      return t;
    }
    try {
      const issue = await remote.createIssue({
        title: t.title, status: t.blocked ? 'blocked' : FROM_COL[t.status], priority: 'medium',
        assigneeAgentId: agentById(t.assignee).remote.id,
      });
      dates[issue.id] = { start: t.start, end: t.end };
      writeJson(DATES_KEY, dates);
      remoteSig = '';
      await refresh();
      return store.get(issue.id) ?? { ...t, id: issue.id, ref: issue.identifier };
    } catch (err) { fail(err); return null; }
  },

  async update(id, patch) {
    const t = store.get(id);
    if (!t) return;
    const next = { ...t, ...patch };
    if (next.end < next.start) next.end = next.start;
    if (!remote) { Object.assign(t, next); commitLocal(); return; }

    const body = {};
    if (next.title !== t.title) body.title = next.title;
    if (next.status !== t.status || next.blocked !== t.blocked) body.status = next.blocked ? 'blocked' : FROM_COL[next.status];
    if (next.assignee !== t.assignee) body.assigneeAgentId = agentById(next.assignee).remote.id;
    if (next.start !== t.start || next.end !== t.end) {
      dates[id] = { start: next.start, end: next.end };
      writeJson(DATES_KEY, dates);
    }
    await write(() => Object.assign(t, next), async () => { if (Object.keys(body).length) await remote.patchIssue(id, body); });
  },

  async remove(id) {
    if (!remote) {
      const i = local.tasks.findIndex((t) => t.id === id);
      if (i >= 0) { local.tasks.splice(i, 1); commitLocal(); }
      return;
    }
    // Cancel rather than hard-delete, so the issue and its history stay in Paperclip.
    await write(() => { remoteTasks = remoteTasks.filter((t) => t.id !== id); }, () => remote.patchIssue(id, { status: 'cancelled' }));
  },

  // ---- server-room registry ----
  get registry() { return registry.rows; },
  /** { ref, revision } of the Paperclip document, or null when local / missing. */
  get registryInfo() { return registry.info; },
  async saveRegistry(rows) {
    if (!remote) {
      registry = { ...registry, rows };
      writeJson(REGISTRY_KEY, rows);
      emit();
      return true;
    }
    if (!registry.info) { fail(new Error('No "Infrastructure registry" issue found in Paperclip.')); return false; }
    let ok = true;
    try {
      await remote.putRegistry(registry.info.issueId, serializeRegistry(rows, registry.pre, registry.post), registry.info.revisionId);
    } catch (err) { ok = false; fail(err); }
    remoteSig = '';
    try { await refresh(); } catch (err) { fail(err); }
    return ok;
  },

  setContractors(n) {
    if (remote) return; // hiring and firing happen in Paperclip
    const v = Math.max(0, Math.min(MAX_CONTRACTORS, n));
    if (v !== local.contractors) { local.contractors = v; commitLocal(); }
  },
  reset() { if (!remote) { Object.assign(local, seed()); commitLocal(); } },
};
