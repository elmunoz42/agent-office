// Infrastructure registry: the lookup table the server room is built from.
// In Paperclip it is a Markdown table in the `infrastructure` document on the
// "Infrastructure registry" issue (owned by the backend dev). One rack per
// distinct Rack value, one unit per row.

export const COLUMNS = ['rack', 'resource', 'type', 'identifier', 'region', 'status', 'notes'];
const HEADERS = ['Rack', 'Resource', 'Type', 'Identifier', 'Region', 'Status', 'Notes'];

export const STATUS_COLORS = {
  online: '#34e27a', degraded: '#ffb020', offline: '#e5484d', planned: '#2c9bff', unknown: '#8b93a1',
};
export const STATUSES = Object.keys(STATUS_COLORS);

// Used only when Paperclip isn't connected.
export const DEFAULT_ROWS = [
  ['EC2', 'EC2 instance 1', 'AWS EC2'], ['EC2', 'EC2 instance 2', 'AWS EC2'],
  ['Amplify', 'Amplify app', 'AWS Amplify'], ['Gmail', 'Gmail', 'Google Gmail'], ['OpenAI GPT', 'OpenAI GPT', 'OpenAI API'],
].map(([rack, resource, type]) => ({ rack, resource, type, identifier: 'TBD', region: '-', status: 'unknown', notes: '' }));

const cells = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));

/** Pull the table out of the document, keeping the prose around it. */
export function parseRegistry(markdown) {
  const lines = (markdown ?? '').split('\n');
  const head = lines.findIndex((l) => l.trim().startsWith('|') && /rack/i.test(l) && /resource/i.test(l));
  if (head < 0) return { rows: [], pre: (markdown ?? '').trimEnd(), post: '' };
  const index = cells(lines[head]).map((h) => COLUMNS.indexOf(h.toLowerCase()));
  let end = head + 1;
  const rows = [];
  for (; end < lines.length && lines[end].trim().startsWith('|'); end++) {
    const c = cells(lines[end]);
    if (c.every((x) => /^:?-{2,}:?$/.test(x))) continue; // separator row
    const row = Object.fromEntries(COLUMNS.map((k) => [k, '']));
    index.forEach((col, i) => { if (col >= 0) row[COLUMNS[col]] = c[i] ?? ''; });
    row.status = STATUSES.includes(row.status.toLowerCase()) ? row.status.toLowerCase() : 'unknown';
    if (row.rack || row.resource) rows.push(row);
  }
  return { rows, pre: lines.slice(0, head).join('\n').trimEnd(), post: lines.slice(end).join('\n').trim() };
}

export function serializeRegistry(rows, pre = '# Infrastructure registry', post = '') {
  const esc = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim() || '-';
  const table = [
    `| ${HEADERS.join(' | ')} |`,
    `| ${HEADERS.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${COLUMNS.map((k) => esc(r[k])).join(' | ')} |`),
  ].join('\n');
  return `${pre}\n\n${table}\n${post ? `\n${post}\n` : ''}`;
}

/** Rows grouped into racks, in first-seen order. */
export function groupRacks(rows) {
  const racks = [];
  for (const r of rows) {
    const name = r.rack || 'Unassigned';
    let rack = racks.find((x) => x.name === name);
    if (!rack) racks.push((rack = { name, resources: [] }));
    rack.resources.push(r);
  }
  return racks;
}

export function brandColor(rack) {
  const s = `${rack.name} ${rack.resources.map((r) => r.type).join(' ')}`.toLowerCase();
  if (/openai|gpt/.test(s)) return '#10a37f';
  if (/gmail|google/.test(s)) return '#ea4335';
  if (/amplify/.test(s)) return '#c44fe0';
  if (/aws|ec2|amazon/.test(s)) return '#ff9900';
  return '#5b8def';
}
