// Client for the local Paperclip instance (via the /paperclip dev proxy).
// Endpoints and field names were taken from the running instance's
// /api/openapi.json (Paperclip 2026.1106.0).
const BASE = '/paperclip';
const COMPANY_NAME = 'Space Exploration News';
const CHAT_PREFIX = 'Office chat with ';
const CHAT_KEY = 'agent-office-chat-v1';
const REGISTRY_TITLE = 'Infrastructure registry';
const REGISTRY_DOC = 'infrastructure';

async function api(method, path, body, timeoutMs = 15000) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON (e.g. proxy error page) */ }
  if (!res.ok) throw new Error(data?.error || `Paperclip ${method} ${path} failed (${res.status})`);
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadChats = () => { try { return JSON.parse(localStorage.getItem(CHAT_KEY)) || {}; } catch { return {}; } };
const saveChats = (m) => { try { localStorage.setItem(CHAT_KEY, JSON.stringify(m)); } catch { /* ignore */ } };

/** Returns a connection object, or null when Paperclip isn't reachable. */
export async function connectPaperclip() {
  let company;
  try {
    const companies = await api('GET', '/companies', null, 2000);
    if (!Array.isArray(companies) || !companies.length) return null;
    company = companies.find((c) => c.name === COMPANY_NAME) ?? companies[0];
  } catch {
    return null;
  }
  const cid = company.id;

  return {
    company,
    isChatIssue: (issue) => issue.title?.startsWith(CHAT_PREFIX),
    listAgents: () => api('GET', `/companies/${cid}/agents`),
    listIssues: () => api('GET', `/companies/${cid}/issues`),
    createIssue: (body) => api('POST', `/companies/${cid}/issues`, body),
    patchIssue: (id, body) => api('PATCH', `/issues/${id}`, body),

    // The server-room lookup table: a Markdown document on a standing issue.
    async getRegistry(issues) {
      const issue = issues.find((i) => i.title?.startsWith(REGISTRY_TITLE) && i.status !== 'cancelled');
      if (!issue) return null;
      try {
        const doc = await api('GET', `/issues/${issue.id}/documents/${REGISTRY_DOC}`);
        return { issueId: issue.id, ref: issue.identifier, body: doc.body, revisionId: doc.latestRevisionId, revision: doc.latestRevisionNumber };
      } catch { return null; }
    },
    putRegistry: (issueId, body, baseRevisionId) => api('PUT', `/issues/${issueId}/documents/${REGISTRY_DOC}`, {
      title: 'Infrastructure registry', format: 'markdown', body, baseRevisionId, changeSummary: 'Edited from the 3D office server room',
    }),

    // Free-text chat = a comment on a standing per-agent issue. The agent
    // answers with a comment when Paperclip runs it; we wait for that reply.
    async chat(agent, text, { waitMs = 120000 } = {}) {
      const remote = await api('GET', `/agents/${agent.remote.id}`);
      // An agent only answers if Paperclip may run it: not paused, and allowed
      // to wake on demand. Otherwise the message would sit unanswered.
      const canWake = remote.runtimeConfig?.heartbeat?.wakeOnDemand !== false;
      if (remote.status === 'paused' || !canWake) {
        return {
          text: `${agent.name} isn't switched on in Paperclip yet, so I didn't send that. I can still answer the three quick questions from my board.`,
          note: `Not sent — agent is ${remote.status === 'paused' ? 'paused' : 'not allowed to wake on demand'} in Paperclip`,
        };
      }
      const chats = loadChats();
      let issue = null;
      if (chats[remote.id]) { try { issue = await api('GET', `/issues/${chats[remote.id]}`); } catch { issue = null; } }
      if (!issue || issue.status === 'cancelled') {
        issue = await api('POST', `/companies/${cid}/issues`, {
          title: CHAT_PREFIX + agent.name,
          description: 'Direct questions from the board, asked from the 3D office. Answer each new comment with one short comment. Do not change files or other issues unless a comment asks you to.',
          status: 'todo', priority: 'medium', assigneeAgentId: remote.id,
        });
        chats[remote.id] = issue.id;
        saveChats(chats);
      }
      const mine = await api('POST', `/issues/${issue.id}/comments`, { body: text, reopen: true });
      const sentAt = new Date(mine?.createdAt ?? Date.now()).getTime();
      const deadline = Date.now() + waitMs;
      while (Date.now() < deadline) {
        await sleep(3000);
        const comments = await api('GET', `/issues/${issue.id}/comments`);
        const reply = comments
          .filter((c) => c.authorType === 'agent' && new Date(c.createdAt).getTime() >= sentAt)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
        if (reply) return { text: reply.body, note: `Live reply from Paperclip · ${issue.identifier}` };
      }
      return {
        text: `I've sent that to ${agent.name} in Paperclip (${issue.identifier}), but there's no reply yet. It will show up on that issue.`,
        note: `Delivered to Paperclip · ${issue.identifier} · no reply within ${Math.round(waitMs / 1000)}s`,
      };
    },
  };
}
