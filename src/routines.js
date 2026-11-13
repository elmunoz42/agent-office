// Recurring tasks (Paperclip routines) for the garage wall display.
// Turns a routine into a display row: who runs it, when (in words), when next,
// and how the last run went.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TZ_SHORT = {
  'America/Los_Angeles': 'PT', 'America/Denver': 'MT', 'America/Chicago': 'CT',
  'America/New_York': 'ET', UTC: 'UTC', 'Etc/UTC': 'UTC',
};

const clock = (h, m) => {
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${ap}` : `${h12}${ap}`;
};

/** "0 2 * * *" -> "Daily 2am PT"; falls back to the raw expression. */
export function describeCron(expr, tz) {
  const zone = TZ_SHORT[tz] ?? (tz ? tz.split('/').pop().replace(/_/g, ' ') : '');
  const f = String(expr ?? '').trim().split(/\s+/);
  if (f.length !== 5) return expr || 'manual';
  const [min, hour, dom, mon, dow] = f;
  const at = /^\d+$/.test(min) && /^\d+$/.test(hour) ? `${clock(+hour, +min)} ${zone}`.trim() : null;
  if (!at) {
    if (/^\*\/\d+$/.test(min) && hour === '*') return `Every ${min.slice(2)} min`;
    if (min === '0' && /^\*\/\d+$/.test(hour)) return `Every ${hour.slice(2)} h`;
    return expr;
  }
  if (dom === '*' && mon === '*' && dow === '*') return `Daily ${at}`;
  if (dom === '*' && mon === '*' && /^[0-6](,[0-6])*$/.test(dow)) {
    const days = dow.split(',').map((d) => DAYS[+d]);
    const FULL = { Sun: 'Sundays', Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays', Fri: 'Fridays', Sat: 'Saturdays' };
    return `${days.length === 1 ? FULL[days[0]] : days.join(', ')} ${at}`;
  }
  if (dom === '*' && mon === '*' && dow === '1-5') return `Weekdays ${at}`;
  if (/^\d+$/.test(dom) && mon === '*' && dow === '*') return `Monthly, day ${dom}, ${at}`;
  return `${expr} (${zone})`;
}

/** "in 3h 20m", "in 2d", "now", or "" when there is no next run. */
export function untilText(iso, now = Date.now()) {
  if (!iso) return '';
  const s = Math.round((new Date(iso).getTime() - now) / 1000);
  if (s <= 30) return 'due now';
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d >= 1) return `in ${d}d ${h % 24}h`;
  if (h >= 1) return `in ${h}h ${String(m % 60).padStart(2, '0')}m`;
  return `in ${m}m`;
}

/** Paperclip routine -> display row. `agentName(remoteId)` maps the assignee. */
export function routineRow(r, agentName) {
  const trig = (r.triggers ?? []).filter((t) => t.kind === 'schedule' || t.cronExpression);
  const live = trig.filter((t) => t.enabled !== false);
  const next = live.map((t) => t.nextRunAt).filter(Boolean).sort()[0] ?? null;
  const t0 = live[0] ?? trig[0];
  const last = r.lastRun?.status ?? r.lastRun?.issueStatus ?? trig.map((t) => t.lastResult).find(Boolean) ?? null;
  return {
    id: r.id,
    title: r.title,
    agent: agentName(r.assigneeAgentId) ?? 'Unassigned',
    schedule: t0 ? describeCron(t0.cronExpression, t0.timezone) : 'manual only',
    nextRunAt: r.status === 'active' ? next : null,
    status: r.activeIssue ? 'running' : r.status === 'active' && live.length ? 'active' : 'paused',
    last: last ? String(last).replace(/_/g, ' ') : 'never run',
  };
}

// Shown when Paperclip isn't connected.
export const DEMO_ROUTINES = [
  { id: 'demo-research', title: 'Nightly research brief', agent: 'Monica', schedule: 'Daily 11pm PT', offsetH: 5, status: 'active', last: 'never run' },
  { id: 'demo-security', title: 'Nightly security audit (if code changed)', agent: 'Jian-Yang', schedule: 'Daily 2am PT', offsetH: 8, status: 'active', last: 'never run' },
  { id: 'demo-finance', title: 'Weekly finance report', agent: 'Jared', schedule: 'Sundays 2am PT', offsetH: 40, status: 'active', last: 'never run' },
].map(({ offsetH, ...r }) => ({ ...r, nextRunAt: new Date(Date.now() + offsetH * 3600e3).toISOString() }));
