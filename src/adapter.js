// Agent bridge: the one place the 3D office asks an agent something.
//
// Connected to Paperclip (see paperclip.js / store.connect):
//   - the three quick questions are answered from the agent's live Paperclip
//     issues, instantly and without starting an agent run;
//   - free text is posted to the agent in Paperclip and the reply awaited.
// Not connected: everything is simulated from the demo tasks.
import { store, today, diffDays } from './store.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const list = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
const quote = (t) => `“${t.title}”`;

function when(task) {
  const d = diffDays(task.end, today());
  if (d < 0) return `${-d} day${d === -1 ? '' : 's'} overdue`;
  if (d === 0) return 'due today';
  return `due in ${d} day${d === 1 ? '' : 's'}`;
}

function classify(text) {
  const s = text.toLowerCase();
  if (/\b(block|stuck|blocker|waiting on)/.test(s)) return 'blockers';
  if (/\b(when|eta|deadline|ship|due|timeline|schedule)/.test(s)) return 'eta';
  if (/\b(status|working on|doing|progress|update|up to)/.test(s)) return 'status';
  if (/\b(hi|hello|hey|morning|yo)\b/.test(s)) return 'hello';
  if (/\b(budget|runway|burn|cost|money|spend)/.test(s)) return 'money';
  if (/\b(server|garage|deploy|infra|cluster|outage|down)/.test(s)) return 'infra';
  return 'other';
}

function reply(agent, intent) {
  const tasks = store.tasksFor(agent.id);
  const doing = tasks.filter((t) => t.status === 'doing');
  const review = tasks.filter((t) => t.status === 'review');
  const todo = tasks.filter((t) => t.status === 'todo');
  const blocked = tasks.filter((t) => t.blocked && t.status !== 'done');
  const v = agent.voice;

  switch (intent) {
    case 'status': {
      if (!doing.length && !review.length) {
        return todo.length
          ? `Nothing in flight right now. Next up is ${quote(todo[0])}.`
          : 'My board is clear. Give me something to do.';
      }
      const parts = [];
      if (doing.length) parts.push(`${v.status} ${list(doing.map(quote))}.`);
      if (review.length) parts.push(`${review.length} in review: ${list(review.map(quote))}.`);
      if (todo.length) parts.push(`${todo.length} more queued up.`);
      return parts.join(' ');
    }
    case 'blockers':
      return blocked.length
        ? `Yes. ${list(blocked.map(quote))} ${blocked.length > 1 ? 'are' : 'is'} blocked. I need a decision before I can move.`
        : v.clear;
    case 'eta': {
      const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'backlog').sort((a, b) => a.end.localeCompare(b.end));
      if (!open.length) return 'Nothing scheduled. The Gantt is wide open.';
      const [next, ...rest] = open;
      return `Next to land is ${quote(next)} — ${when(next)}.${rest.length ? ` After that, ${quote(rest[0])}, ${when(rest[0])}.` : ''}`;
    }
    case 'hello':
      return v.greeting;
    case 'money':
      return agent.id === 'cfo'
        ? "We have runway, provided nobody buys another rack for the garage. I'll send you the three scenarios."
        : "That's a Wendell question. He's in the office past the living room, probably updating a spreadsheet.";
    case 'infra':
      return agent.id === 'backend'
        ? "The cluster in the garage is fine. It's always fine. I built it."
        : 'Ask Soren. He treats the garage servers like pets.';
    default:
      return pick(v.fallback);
  }
}

export const adapter = {
  /** @returns {Promise<{text: string, note: string}>} the reply and where it came from */
  async chat(agent, { intent, text }) {
    if (!store.remote) {
      await sleep(350 + Math.random() * 450);
      return { text: reply(agent, intent ?? classify(text ?? '')), note: 'Simulated reply — Paperclip is not connected' };
    }
    if (intent) {
      await sleep(250);
      return { text: reply(agent, intent), note: "Answered from this agent's live Paperclip issues (no agent run)" };
    }
    return store.remote.chat(agent, text);
  },
};
