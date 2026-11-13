import * as THREE from 'three';
import './style.css';
import { buildWorld, ROOMS } from './world.js';
import { AGENTS } from './data.js';
import { store } from './store.js';
import { buildStation, buildSharedBoard } from './stations.js';
import { initUI } from './ui.js';
import { connectPaperclip } from './paperclip.js';
import { groupRacks, brandColor, STATUS_COLORS } from './registry.js';
import { untilText } from './routines.js';
import { wrapAngle } from './util.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ff);
scene.fog = new THREE.Fog(0x9fd3ff, 45, 110);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 200);

// Use Paperclip as the source of truth when it's running; otherwise demo data.
const paperclip = await connectPaperclip();
if (paperclip) {
  try { await store.connect(paperclip); } catch (err) { console.warn('[office] Paperclip connect failed', err); }
}
$('source').textContent = store.remote ? `Paperclip · ${paperclip.company.name}` : 'Demo data · Paperclip not running';
$('source').classList.toggle('live', !!store.remote);
$('crew').classList.toggle('readonly', !!store.remote);
let toastTimer = 0;
store.onError((msg) => {
  $('toast').classList.remove('info');
  $('toast').textContent = msg;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6000);
});

const world = buildWorld(scene);
const stations = AGENTS.map((a) => {
  const s = buildStation(a);
  scene.add(s.group);
  world.colliders.push(...s.colliders);
  return s;
});
const stationOf = (id) => stations.find((s) => s.agent.id === id);
// the contractors' Kanban hangs on the south wall, facing their table
const contractorBoard = buildSharedBoard(AGENTS.filter((a) => a.slot), { x: -7.85, y: 1.55, z: 6.86, ry: Math.PI });
scene.add(contractorBoard.group);
// the researchers' Kanban hangs on the kitchen wall behind their table
const researchBoard = buildSharedBoard(AGENTS.filter((a) => a.researchSlot), { x: 3.9, y: 1.55, z: 1.08, ry: 0 }, 'Research');
scene.add(researchBoard.group);

let rackSig = null;
let lastRoutineSig = null;
function syncStore() {
  // rebuild the server racks only when the registry actually changed
  const sig = JSON.stringify(store.registry);
  if (sig !== rackSig) { rackSig = sig; world.setRacks(groupRacks(store.registry), STATUS_COLORS, brandColor); }
  for (const s of stations) {
    const on = store.isActive(s.agent);
    s.group.visible = on;
    s.colliders.forEach((c) => { c.on = on; });
    if (on) s.redraw();
  }
  contractorBoard.redraw();
  researchBoard.redraw();
  const tasks = store.activeTasks();
  world.setStatus({
    agents: store.activeAgents().length,
    doing: tasks.filter((t) => t.status === 'doing').length,
    blocked: tasks.filter((t) => t.blocked && t.status !== 'done').length,
  });
  const routineSig = JSON.stringify(store.routines);
  if (routineSig !== lastRoutineSig) { lastRoutineSig = routineSig; world.setRoutines(store.routines, untilText); }
  $('c-count').textContent = store.contractors;
}
store.subscribe(syncStore);
syncStore();

// ---------------- player ----------------
const EYE = 1.65, RADIUS = 0.3;
const player = { x: -6, z: 13.5, yaw: 0, pitch: 0 };
const keys = new Set();
let started = false;

function blocked(x, z) {
  for (const c of world.colliders) {
    if (!c.on) continue;
    const dx = x - Math.max(c.x0, Math.min(x, c.x1));
    const dz = z - Math.max(c.z0, Math.min(z, c.z1));
    if (dx * dx + dz * dz < RADIUS * RADIUS) return true;
  }
  return false;
}
function movePlayer(dt) {
  const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
  player.yaw += turn * 2.2 * dt;
  const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const r = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  if (!f && !r) return;
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 5.6 : 3.2) * dt / Math.hypot(f, r);
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  const dx = (-sin * f + cos * r) * speed, dz = (-cos * f - sin * r) * speed;
  if (!blocked(player.x + dx, player.z)) player.x += dx;
  if (!blocked(player.x, player.z + dz)) player.z += dz;
  player.x = Math.max(-40, Math.min(40, player.x));
  player.z = Math.max(-30, Math.min(21, player.z));
}

// ---------------- UI + input ----------------
let talkingTo = null;
const ui = initUI({
  onMode(mode, agent) {
    keys.clear();
    talkingTo = mode === 'dialogue' && agent ? stationOf(agent.id) : null;
    if (mode === 'play') { if (started) lock(); } else if (document.pointerLockElement) document.exitPointerLock();
    setTimeout(lockHint, 150);
  },
});
function lock() {
  try { const p = canvas.requestPointerLock(); if (p?.catch) p.catch(() => {}); } catch { /* not available */ }
}
function start() {
  if (started) return;
  started = true;
  $('start').hidden = true;
  lock();
  setTimeout(lockHint, 150);
}
$('enter').addEventListener('click', start);
// Browsers can refuse to re-capture the mouse right after Esc; tell the player how to get it back.
const lockHint = () => { $('lockhint').hidden = !(started && ui.mode === 'play' && document.pointerLockElement !== canvas); };
document.addEventListener('pointerlockchange', lockHint);
document.addEventListener('pointerlockerror', lockHint);
canvas.addEventListener('click', () => { if (ui.mode === 'play') lock(); });
document.addEventListener('mousemove', (e) => {
  if (ui.mode !== 'play' || !started) return;
  const locked = document.pointerLockElement === canvas;
  if (!locked && !(e.buttons & 1 && e.target === canvas)) return;
  player.yaw -= e.movementX * 0.0023;
  player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - e.movementY * 0.0023));
});

let nearest = null;
let nearRack = null; // server rack the player is standing in front of
window.addEventListener('keydown', (e) => {
  if (ui.key(e)) return;
  if (!started) { if (e.code === 'Enter' || e.code === 'Space') start(); return; }
  if (e.repeat) { keys.add(e.code); return; }
  // some keyboard layouts / automation report symbols by key rather than code
  const code = e.key === '=' || e.key === '+' ? 'Equal' : e.key === '-' || e.key === '_' ? 'Minus' : e.code;
  switch (code) {
    case 'KeyE': if (nearest) ui.openDialogue(nearest.agent.id); break;
    case 'KeyF': if (nearest) ui.openPanel(nearest.agent.id, 'kanban'); else if (nearRack) ui.openRegistry(); break;
    case 'Minus': store.setContractors(store.contractors - 1); break;
    case 'Equal': store.setContractors(store.contractors + 1); break;
    default: keys.add(e.code);
  }
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
$('c-minus').addEventListener('click', () => store.setContractors(store.contractors - 1));
$('c-plus').addEventListener('click', () => store.setContractors(store.contractors + 1));

// If a contractor desk appears on top of the player, nudge them out.
store.subscribe(() => {
  for (let i = 0; i < 40 && blocked(player.x, player.z); i++) { player.x += 0.15; player.z -= 0.1; }
});

// ---------------- NPCs ----------------
const tmp = new THREE.Vector3();
function updateNPCs(dt, t) {
  nearest = null;
  let best = 3.0;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  for (const s of stations) {
    if (!s.group.visible) continue;
    const dx = player.x - s.pos.x, dz = player.z - s.pos.z;
    const dist = Math.hypot(dx, dz);
    const talking = talkingTo === s;

    // find who the player is facing (the agent, or their whiteboard)
    const bd = Math.hypot(player.x - s.boardPos.x, player.z - s.boardPos.z);
    const d = Math.min(dist, bd + 0.4);
    const facing = (-dx * fx - dz * fz) / (dist || 1);
    if (d < best && (facing > 0.25 || bd < 1.4)) { best = d; nearest = s; }

    // body turns to the player while talking; head tracks them when close
    const toPlayer = Math.atan2(dx, dz);
    const bodyTarget = talking ? wrapAngle(toPlayer - s.ry) : 0;
    s.bodyYaw += wrapAngle(bodyTarget - s.bodyYaw) * Math.min(1, dt * 5);
    s.char.group.rotation.y = s.bodyYaw;
    const rel = wrapAngle(toPlayer - s.ry - s.bodyYaw);
    const headTarget = dist < 5 && Math.abs(rel) < 1.9 ? Math.max(-1.1, Math.min(1.1, rel)) : 0;
    s.headYaw += (headTarget - s.headYaw) * Math.min(1, dt * 4);
    s.char.head.rotation.y = s.headYaw;
    s.char.head.rotation.x = Math.sin(t * 0.7 + s.phase) * 0.04 + (talking ? Math.sin(t * 3.1) * 0.03 : 0);

    // idle breathing; typing unless they're in a conversation
    const h = s.agent.look.height ?? 1;
    s.char.torso.scale.y = 1 + Math.sin(t * 1.8 + s.phase) * 0.015;
    s.char.group.position.y = Math.sin(t * 1.8 + s.phase) * 0.004 * h;
    // connected: only type while Paperclip says the agent is actually running
    const typing = !talking && (!s.agent.remote || s.agent.remote.status === 'running') ? 1 : 0;
    const aim = (side) => typing ? -1.05 + Math.sin(t * 11 + s.phase + side * 1.7) * 0.07 : (talking && side > 0 ? -0.25 + Math.sin(t * 2.4) * 0.15 : 0);
    s.char.armL.rotation.x += (aim(-1) - s.char.armL.rotation.x) * Math.min(1, dt * 8);
    s.char.armR.rotation.x += (aim(1) - s.char.armR.rotation.x) * Math.min(1, dt * 8);
    s.tag.visible = dist < 9 && !talking;
  }
}

// ---------------- camera ----------------
let blend = 0; // 0 = first person, 1 = conversation framing
const qPlay = new THREE.Quaternion(), qTalk = new THREE.Quaternion();
const pPlay = new THREE.Vector3(), pTalk = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const rig = new THREE.Object3D();
function updateCamera(dt) {
  euler.set(player.pitch, player.yaw, 0);
  qPlay.setFromEuler(euler);
  pPlay.set(player.x, EYE, player.z);
  if (talkingTo) {
    const s = talkingTo;
    const h = s.agent.look.height ?? 1;
    let dx = player.x - s.pos.x, dz = player.z - s.pos.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const dist = 1.25; // inside the desk line, so furniture never blocks the shot
    const rx = dz, rz = -dx; // camera-right when looking at the NPC
    pTalk.set(s.pos.x + dx * dist + rx * 0.12, 1.56 * h, s.pos.z + dz * dist + rz * 0.12);
    rig.position.copy(pTalk);
    rig.lookAt(tmp.set(s.pos.x + rx * 0.3, 1.5 * h, s.pos.z + rz * 0.3));
    rig.rotateY(Math.PI); // Object3D.lookAt points +Z at the target; cameras look down -Z
    qTalk.copy(rig.quaternion);
  }
  blend += ((talkingTo ? 1 : 0) - blend) * Math.min(1, dt * 6);
  if (blend < 0.002) blend = 0;
  const k = blend * blend * (3 - 2 * blend);
  camera.position.copy(pPlay).lerp(pTalk, k);
  camera.quaternion.copy(qPlay).slerp(qTalk, k);
  const fov = 70 - 22 * k;
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

// ---------------- HUD ----------------
const mm = $('minimap').getContext('2d');
const MX = (x) => (x + 13.5) * 9.2 + 4, MZ = (z) => (z + 8) * 9.2 + 8;
function drawMinimap() {
  mm.clearRect(0, 0, 260, 170);
  mm.font = '600 9px system-ui, sans-serif';
  mm.textAlign = 'center';
  for (const r of ROOMS) {
    const inside = player.x > r.x0 && player.x < r.x1 && player.z > r.z0 && player.z < r.z1;
    mm.fillStyle = inside ? 'rgba(255,180,84,.28)' : 'rgba(255,255,255,.08)';
    mm.strokeStyle = 'rgba(255,255,255,.45)';
    mm.fillRect(MX(r.x0), MZ(r.z0), (r.x1 - r.x0) * 9.2, (r.z1 - r.z0) * 9.2);
    mm.strokeRect(MX(r.x0) + 0.5, MZ(r.z0) + 0.5, (r.x1 - r.x0) * 9.2, (r.z1 - r.z0) * 9.2);
    mm.fillStyle = 'rgba(255,255,255,.6)';
    mm.fillText(r.short.toUpperCase(), MX((r.x0 + r.x1) / 2), MZ(r.z1) - 5);
  }
  for (const s of stations) {
    if (!s.group.visible) continue;
    mm.fillStyle = s.agent.color;
    mm.beginPath(); mm.arc(MX(s.pos.x), MZ(s.pos.z), 3.5, 0, Math.PI * 2); mm.fill();
  }
  mm.save();
  mm.translate(MX(player.x), MZ(Math.min(player.z, 9.2)));
  mm.rotate(-player.yaw);
  mm.fillStyle = '#fff';
  mm.beginPath(); mm.moveTo(0, -7); mm.lineTo(5, 5); mm.lineTo(0, 2); mm.lineTo(-5, 5); mm.closePath(); mm.fill();
  mm.restore();
}
let lastPrompt = null, lastRoom = null;
function updateHUD() {
  const room = ROOMS.find((r) => player.x > r.x0 && player.x < r.x1 && player.z > r.z0 && player.z < r.z1);
  const name = room ? room.name : 'Front Yard';
  if (name !== lastRoom) { lastRoom = name; $('room').textContent = name; }
  nearRack = nearest ? null : world.rackNear(player.x, player.z);
  const showing = ui.mode === 'play' && started;
  const p = !showing ? null : nearest ? nearest.agent.id : nearRack ? `rack:${nearRack.name}` : null;
  if (p !== lastPrompt) {
    lastPrompt = p;
    $('prompt').hidden = !p;
    if (nearest && p) $('prompt').innerHTML = `<kbd>E</kbd>Talk to ${nearest.agent.name} <kbd>F</kbd>Kanban &amp; Gantt`;
    else if (p) $('prompt').textContent = '', $('prompt').insertAdjacentHTML('afterbegin', '<kbd>F</kbd>'), $('prompt').append(`Server registry · ${nearRack.name}`);
  }
  drawMinimap();
}

// ---------------- loop ----------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (ui.mode === 'play' && started) movePlayer(dt);
  updateNPCs(dt, t);
  world.update(t);
  updateCamera(dt);
  updateHUD();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);

// Debug / automation hook (also handy from the devtools console).
window.__office = {
  player, store, ui, stations,
  start,
  teleport(x, z, yaw = player.yaw, pitch = 0) { Object.assign(player, { x, z, yaw, pitch }); },
  talk: (id) => ui.openDialogue(id),
  board: (id, tab) => ui.openPanel(id, tab),
  registry: () => ui.openRegistry(),
  world,
  step: (dt = 0.016) => frame(dt),
};
