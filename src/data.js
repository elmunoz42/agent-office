// Roster, desk placement and seed tasks. Characters are original archetypes
// (founder-CEO, sardonic backend, flashy frontend, loud marketing, careful CFO).

export const STATUSES = [
  { id: 'backlog', label: 'Backlog', color: '#8b93a1' },
  { id: 'todo', label: 'To do', color: '#4c8dff' },
  { id: 'doing', label: 'In progress', color: '#f5a623' },
  { id: 'review', label: 'Review', color: '#b06cf0' },
  { id: 'done', label: 'Done', color: '#3ecf8e' },
];

const PI = Math.PI;

export const AGENTS = [
  {
    id: 'hermes', name: 'Hermes', role: 'CEO', harness: 'Hermes agent', color: '#5b8def',
    station: { x: -9, z: -5.5, ry: 0, side: 1 },
    look: { skin: 0xf0c9a8, hair: 0x5a3b22, hairStyle: 'curly', top: 0x7d8794, topStyle: 'hoodie', pants: 0x2f3b55, height: 1.0, build: 0.9 },
    voice: {
      greeting: "Oh — hey. Sorry, I was halfway through rewriting the roadmap. Again. What do you need?",
      status: "Okay, so, right now I'm on",
      clear: "Nothing's blocking me. Which, honestly, makes me nervous.",
      fallback: [
        "Right. Yes. I'll fold that into the roadmap and loop in the team.",
        "That's… actually a good point. Let me think about how that changes priorities.",
        "I hear you. I'll delegate it — probably to whoever looks least busy.",
      ],
    },
  },
  {
    id: 'backend', name: 'Soren Black', role: 'Senior Backend Dev', harness: 'Paperclip · Codex harness', color: '#e5484d',
    station: { x: -8.8, z: -0.3, ry: 0, side: 1 },
    look: { skin: 0xe8c4a0, hair: 0x15151a, hairStyle: 'long', top: 0x1d1d22, topStyle: 'tee', pants: 0x26262b, glasses: true, height: 1.03, build: 0.95 },
    voice: {
      greeting: "What. I'm in the middle of a migration.",
      status: "If you must know, I'm on",
      clear: "Nothing is blocking me. Other people's code is merely slowing me down.",
      fallback: [
        "Fine. It will be done correctly, which is slower than done badly.",
        "I'll add it to the list of things only I can be trusted with.",
        "Noted. The servers in the garage agree with me, for what it's worth.",
      ],
    },
  },
  {
    id: 'frontend', name: 'Kiran Mehta', role: 'Senior Frontend Dev', harness: 'Paperclip · Codex harness', color: '#f5a623',
    station: { x: -5.6, z: -0.3, ry: 0, side: 1 },
    look: { skin: 0xb9824f, hair: 0x18120e, hairStyle: 'swoop', top: 0x8c2f39, topStyle: 'jacket', under: 0xf4f1e8, pants: 0x1f2937, chain: true, height: 0.97, build: 1.0 },
    voice: {
      greeting: "Tell me you're here to admire the new transitions. Sixty frames a second. Buttery.",
      status: "Glad you asked. I'm shipping",
      clear: "Zero blockers. I am, as usual, carrying the UI on my back.",
      fallback: [
        "Easy. I'll have it looking better than the spec by tomorrow.",
        "Sure, and I'll make it responsive, because unlike some people I care about users.",
        "Done. Well — not done. But mentally, done.",
      ],
    },
  },
  {
    id: 'marketing', name: 'Ezra Blum', role: 'Marketing', harness: 'Paperclip · Codex harness', color: '#30a46c',
    station: { x: 3, z: -5.5, ry: 0, side: 1 },
    look: { skin: 0xf2cdb0, hair: 0x6b4423, hairStyle: 'short', beard: true, top: 0x2f7f86, topStyle: 'shirt', pants: 0xc9b48a, height: 1.02, build: 1.22 },
    voice: {
      greeting: "There they are! I was just telling the entire internet about us. They're listening. Probably.",
      status: "Big things. Huge. Currently I'm on",
      clear: "Blocked? Me? I don't get blocked, I get inspired to pivot.",
      fallback: [
        "Love it. I'm already drafting the launch thread in my head.",
        "Bold. Visionary. I'll take it from here and add a tagline.",
        "Great note. I'm going to pretend that was my idea in the announcement.",
      ],
    },
  },
  {
    id: 'cfo', name: 'Wendell Park', role: 'CFO', harness: 'Paperclip · Codex harness', color: '#12a594',
    station: { x: -3, z: -5.5, ry: 0, side: 1 },
    look: { skin: 0xf3dcc9, hair: 0xb99a6b, hairStyle: 'short', top: 0xdfe6f0, topStyle: 'vest', vest: 0x3d4a5c, pants: 0x4a4f57, height: 1.08, build: 0.82 },
    voice: {
      greeting: "Good to see you. I've prepared three scenarios. Two of them are survivable.",
      status: "Happily. At present I'm working through",
      clear: "No blockers, though I'd gently flag that our burn rate is its own kind of blocker.",
      fallback: [
        "Of course. I'll model the cost and have a one-pager on your desk by morning.",
        "Understood. I'll make sure it's in the budget, or that the budget is in it.",
        "Wonderful. I've taken the liberty of adding it to the forecast already.",
      ],
    },
  },
  ...[
    { name: 'Juno', x: -11.3, z: 3.2, ry: PI / 2, side: 1, look: { skin: 0x8d5a3b, hair: 0x1a1210, hairStyle: 'bun', top: 0x4f6bd8, topStyle: 'tee', pants: 0x2b2f3a } },
    { name: 'Tabs', x: -2.6, z: 6.3, ry: PI, side: 1, look: { skin: 0xf1c7a3, hair: 0xc8632b, hairStyle: 'short', top: 0x4c9a52, topStyle: 'hoodie', pants: 0x3a3f4a, glasses: true } },
    { name: 'Pixel', x: -9.2, z: 6.3, ry: PI, side: -1, look: { skin: 0xd9a777, hair: 0x2a1f3d, hairStyle: 'long', top: 0xc65b9a, topStyle: 'tee', pants: 0x22252e } },
    { name: 'Rook', x: -11.3, z: 5.9, ry: PI / 2, side: 1, look: { skin: 0xc68b5e, hair: 0x101014, hairStyle: 'bald', beard: true, top: 0xd0a43a, topStyle: 'shirt', pants: 0x30343c } },
  ].map((c, i) => ({
    id: `contractor-${i + 1}`, slot: i + 1, name: c.name, role: 'Contract Dev', harness: 'Paperclip · Codex harness', color: '#8e6ff7',
    station: { x: c.x, z: c.z, ry: c.ry, side: c.side },
    look: { height: 0.95 + i * 0.02, build: 0.95, ...c.look },
    voice: {
      greeting: `Hey! ${c.name} here — just pulled the latest branch. What's up?`,
      status: "Sure thing. I've got",
      clear: "No blockers on my side. Send more tickets whenever.",
      fallback: [
        "Got it. I'll pick that up right after this ticket.",
        "Can do. I'll open a PR and tag the seniors for review.",
        "Sounds good — logging it so it doesn't get lost.",
      ],
    },
  })),
];

export const agentById = (id) => AGENTS.find((a) => a.id === id);

// [assignee, title, status, startOffsetDays, endOffsetDays, blocked?]
export const SEED_TASKS = [
  ['hermes', 'Draft Q1 product roadmap', 'doing', -3, 2],
  ['hermes', 'Investor update email', 'todo', 1, 3],
  ['hermes', 'Decide pricing tiers with CFO', 'review', -2, 0],
  ['hermes', 'Hire criteria for next contractor', 'backlog', 5, 8],
  ['hermes', 'Kickoff: v1 launch plan', 'done', -9, -6],

  ['backend', 'Migrate job queue to Postgres', 'doing', -4, 1],
  ['backend', 'Rate-limit public API', 'todo', 2, 5],
  ['backend', 'Rebuild garage cluster failover', 'doing', -1, 4, true],
  ['backend', 'Auth service token rotation', 'review', -3, 0],
  ['backend', 'Schema for billing events', 'backlog', 6, 10],
  ['backend', 'Set up CI on self-hosted runners', 'done', -10, -6],

  ['frontend', 'Onboarding flow redesign', 'doing', -2, 3],
  ['frontend', 'Dashboard charts (live data)', 'todo', 3, 7],
  ['frontend', 'Design-system tokens v2', 'review', -5, 0],
  ['frontend', 'Mobile nav polish', 'backlog', 7, 9],
  ['frontend', 'Landing page hero', 'done', -8, -5],

  ['marketing', 'Launch announcement thread', 'doing', -1, 2],
  ['marketing', 'Product Hunt assets', 'todo', 2, 6],
  ['marketing', 'Customer story: beta user', 'backlog', 6, 11],
  ['marketing', 'Newsletter #4', 'review', -2, 0],
  ['marketing', 'Rename the tagline (again)', 'done', -7, -6],

  ['cfo', 'Runway forecast — 3 scenarios', 'doing', -3, 1],
  ['cfo', 'Cloud + GPU spend audit', 'todo', 1, 4],
  ['cfo', 'Contractor invoices (Nov)', 'review', -1, 0],
  ['cfo', 'Pricing model sensitivity', 'backlog', 4, 9],
  ['cfo', 'Close October books', 'done', -9, -5],

  ['contractor-1', 'Webhook retry worker', 'doing', -2, 2],
  ['contractor-1', 'Flaky e2e test cleanup', 'todo', 2, 4],
  ['contractor-1', 'Docs: API quickstart', 'backlog', 5, 7],
  ['contractor-2', 'Settings page forms', 'doing', -1, 3],
  ['contractor-2', 'Empty states + skeletons', 'review', -3, 0],
  ['contractor-2', 'Accessibility pass', 'todo', 3, 6],
  ['contractor-3', 'CSV import pipeline', 'todo', 0, 4],
  ['contractor-3', 'Admin audit log view', 'backlog', 4, 8],
  ['contractor-4', 'Stripe webhook handlers', 'todo', 0, 3],
  ['contractor-4', 'Load-test job queue', 'backlog', 3, 6],
];
