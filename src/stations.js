// One workstation per agent: standing desk, monitor (mini Gantt), a
// whiteboard showing their live Kanban, and the character themself.
import * as THREE from 'three';
import { canvasTex, mat, mesh, box } from './util.js';
import { makeCharacter, makeNameTag } from './characters.js';
import { STATUSES } from './data.js';
import { store, today, diffDays } from './store.js';

const BOARD_COLS = STATUSES.filter((s) => s.id !== 'backlog');
const clip = (c, text, max) => {
  if (c.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && c.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
};

function drawBoard(tex, agent) {
  const c = tex.image.getContext('2d');
  const W = tex.image.width, Hh = tex.image.height;
  const tasks = store.tasksFor(agent.id);
  c.fillStyle = '#fbfaf5'; c.fillRect(0, 0, W, Hh);
  c.fillStyle = agent.color; c.fillRect(0, 0, W, 56);
  c.fillStyle = '#fff'; c.font = '700 30px system-ui, sans-serif'; c.textAlign = 'left';
  c.fillText(`${agent.name} — ${agent.role}`, 18, 38);
  c.textAlign = 'right'; c.font = '600 20px system-ui, sans-serif';
  c.fillText(`${tasks.filter((t) => t.status !== 'done').length} open`, W - 18, 36);
  const cw = W / BOARD_COLS.length;
  BOARD_COLS.forEach((col, i) => {
    const x = i * cw;
    c.textAlign = 'left';
    c.fillStyle = col.color; c.fillRect(x + 10, 68, cw - 20, 5);
    c.fillStyle = '#39414f'; c.font = '700 19px system-ui, sans-serif';
    c.fillText(col.label.toUpperCase(), x + 10, 98);
    if (i) { c.fillStyle = '#e2ddd0'; c.fillRect(x, 64, 2, Hh - 72); }
    c.font = '600 16px system-ui, sans-serif';
    tasks.filter((t) => t.status === col.id).slice(0, 5).forEach((t, j) => {
      const y = 112 + j * 56;
      c.fillStyle = t.blocked ? '#ffd9d6' : ['#fff3b0', '#d6ecff', '#e3ffd9', '#f3e0ff'][(j + i) % 4];
      c.fillRect(x + 10, y, cw - 20, 48);
      c.fillStyle = col.color; c.fillRect(x + 10, y, 5, 48);
      c.fillStyle = '#2b3140';
      const words = t.title.split(' ');
      let line = '', lines = [];
      for (const w of words) {
        if (c.measureText(`${line} ${w}`).width > cw - 40 && line) { lines.push(line); line = w; } else line = line ? `${line} ${w}` : w;
      }
      lines.push(line);
      lines.slice(0, 2).forEach((l, k) => c.fillText(k === 1 && lines.length > 2 ? clip(c, `${l}…`, cw - 38) : clip(c, l, cw - 38), x + 22, y + 20 + k * 19));
    });
  });
  tex.needsUpdate = true;
}

function drawScreen(tex, agent) {
  const c = tex.image.getContext('2d');
  const W = tex.image.width, Hh = tex.image.height;
  const tasks = store.tasksFor(agent.id).filter((t) => t.status !== 'done').slice(0, 7);
  c.fillStyle = '#0d1420'; c.fillRect(0, 0, W, Hh);
  c.fillStyle = agent.color; c.fillRect(0, 0, W, 22);
  c.fillStyle = '#fff'; c.font = '700 14px system-ui, sans-serif'; c.fillText('GANTT', 8, 16);
  const t0 = today();
  tasks.forEach((t, i) => {
    const s = Math.max(-5, diffDays(t.start, t0)), e = Math.min(12, diffDays(t.end, t0));
    const col = STATUSES.find((x) => x.id === t.status).color;
    c.fillStyle = '#1a2434'; c.fillRect(8, 32 + i * 20, W - 16, 12);
    c.fillStyle = col; c.fillRect(8 + (s + 5) * ((W - 16) / 17), 32 + i * 20, Math.max(8, (e - s + 1) * ((W - 16) / 17)), 12);
  });
  c.fillStyle = '#ff5d5d'; c.fillRect(8 + 5 * ((W - 16) / 17), 26, 2, Hh - 32);
  tex.needsUpdate = true;
}

export function buildStation(agent) {
  const { x, z, ry, side } = agent.station;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;

  const deskM = mat(0xd8b88a), legM = mat(0x2a2d33, { metalness: 0.4, roughness: 0.5 }), dark = mat(0x17181c);
  // standing desk
  box(g, 1.6, 0.05, 0.75, deskM, 0, 1.03, 0.85);
  for (const s of [-1, 1]) { box(g, 0.07, 1.0, 0.07, legM, s * 0.68, 0.5, 0.85); box(g, 0.08, 0.04, 0.65, legM, s * 0.68, 0.02, 0.85); }
  // monitor (faces the agent) + keyboard + mug
  const screenTex = canvasTex(256, 176);
  box(g, 0.62, 0.4, 0.03, dark, -0.38, 1.36, 1.05);
  const screen = mesh(new THREE.PlaneGeometry(0.57, 0.35), new THREE.MeshBasicMaterial({ map: screenTex }), -0.38, 1.36, 1.033);
  screen.rotation.y = Math.PI; g.add(screen);
  box(g, 0.05, 0.14, 0.05, legM, -0.38, 1.12, 1.07); box(g, 0.22, 0.015, 0.14, legM, -0.38, 1.062, 1.07);
  box(g, 0.08, 0.08, 0.004, new THREE.MeshBasicMaterial({ color: agent.color }), -0.38, 1.36, 1.068);
  box(g, 0.42, 0.02, 0.14, dark, 0, 1.065, 0.72);
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 10), new THREE.MeshStandardMaterial({ color: agent.color }), 0.55, 1.1, 0.8));
  box(g, 0.24, 0.02, 0.3, mat(0xf4f4f2), 0.3, 1.065, 1.0).rotation.y = 0.2;

  // whiteboard on a stand, Kanban facing the room
  const bx = side * 1.55, bz = -0.35;
  const boardTex = canvasTex(800, 480);
  box(g, 1.7, 1.1, 0.04, mat(0xc9ced6, { metalness: 0.3 }), bx, 1.5, bz);
  g.add(mesh(new THREE.PlaneGeometry(1.62, 0.97), new THREE.MeshBasicMaterial({ map: boardTex }), bx, 1.52, bz + 0.022));
  box(g, 1.7, 0.04, 0.1, legM, bx, 0.94, bz + 0.03);
  for (const s of [-1, 1]) { box(g, 0.05, 0.95, 0.05, legM, bx + s * 0.78, 0.475, bz); box(g, 0.05, 0.04, 0.5, legM, bx + s * 0.78, 0.02, bz); }

  // the agent
  const char = makeCharacter(agent.look);
  g.add(char.group);
  const tag = makeNameTag(agent);
  tag.position.set(0, 1.63 * (agent.look.height ?? 1) + 0.42, 0);
  g.add(tag);

  // colliders: rotate local rects into world space (ry is a multiple of 90°)
  const cos = Math.round(Math.cos(ry)), sin = Math.round(Math.sin(ry));
  const rect = (lx, lz, w, d) => {
    const wx = x + lx * cos + lz * sin, wz = z - lx * sin + lz * cos;
    const hw = (Math.abs(cos) ? w : d) / 2, hd = (Math.abs(cos) ? d : w) / 2;
    return { x0: wx - hw, x1: wx + hw, z0: wz - hd, z1: wz + hd, on: true };
  };
  const colliders = [rect(0, 0.85, 1.6, 0.75), rect(bx, bz, 1.7, 0.12), rect(0, 0, 0.5, 0.5)];
  const boardPos = rect(bx, bz + 0.6, 0, 0);

  const redraw = () => { drawBoard(boardTex, agent); drawScreen(screenTex, agent); };
  redraw();

  return {
    agent, group: g, char, tag, colliders, redraw,
    pos: new THREE.Vector3(x, 0, z),
    boardPos: new THREE.Vector3(boardPos.x0, 0, boardPos.z0),
    ry, bodyYaw: 0, headYaw: 0, phase: Math.random() * 10,
  };
}
