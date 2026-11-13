// The house: a single-storey ranch with a living-room bullpen, three offices,
// a kitchen and an attached garage converted into a server room.
// Everything is axis-aligned boxes so collision is plain AABBs in the XZ plane.
import * as THREE from 'three';
import { canvasTex, mat, mesh, box, speckle, repeat } from './util.js';
import { TABLE, RESEARCH_TABLE } from './data.js';

export const H = 2.8; // wall height
const T = 0.2; // wall thickness

export const ROOMS = [
  { id: 'living', name: 'Living Room · Dev Bullpen', short: 'Bullpen', x0: -12, x1: 0, z0: -1, z1: 7, floor: 'wood' },
  { id: 'ceo', name: 'CEO Office · Richard', short: 'CEO', x0: -12, x1: -6, z0: -7, z1: -1, floor: 'blue' },
  { id: 'cfo', name: 'CFO Office', short: 'CFO', x0: -6, x1: 0, z0: -7, z1: -1, floor: 'green' },
  { id: 'marketing', name: 'Marketing Den', short: 'Marketing', x0: 0, x1: 6, z0: -7, z1: 1, floor: 'red' },
  { id: 'kitchen', name: 'Kitchen', short: 'Kitchen', x0: 0, x1: 6, z0: 1, z1: 7, floor: 'tile' },
  { id: 'garage', name: 'Garage · Server Room', short: 'Servers', x0: 6, x1: 14, z0: -3, z1: 7, floor: 'concrete' },
];

export function buildWorld(scene) {
  const colliders = [];
  const addCol = (x0, x1, z0, z1) => colliders.push({ x0, x1, z0, z1, on: true });
  const B = (w, h, d, m, x, y, z) => box(scene, w, h, d, m, x, y, z);
  const solid = (w, h, d, m, x, y, z) => { addCol(x - w / 2, x + w / 2, z - d / 2, z + d / 2); return B(w, h, d, m, x, y, z); };

  // ---------- materials ----------
  const M = {
    wall: mat(0xf1e9da),
    garageWall: mat(0x8f959c),
    trim: mat(0xffffff),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.28, roughness: 0.1 }),
    roof: mat(0x8a4b3a),
    ceiling: mat(0xfafafa),
    woodDark: mat(0x6b4a32),
    woodLight: mat(0xc79a6b),
    white: mat(0xf4f4f2),
    steel: mat(0xa9b0b8, { metalness: 0.5, roughness: 0.4 }),
    black: mat(0x17181c),
    couch: mat(0x5c7a9c),
    plant: mat(0x3f8f4f),
    pot: mat(0xb5623c),
  };
  const floorTex = {
    wood: canvasTex(256, 256, (c, w, h) => {
      for (let i = 0; i < 8; i++) {
        const l = 48 + Math.random() * 10;
        c.fillStyle = `hsl(28 45% ${l}%)`; c.fillRect(0, i * 32, w, 32);
        c.fillStyle = 'rgba(60,30,10,.35)'; c.fillRect(0, i * 32, w, 2);
        c.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32);
      }
    }),
    tile: canvasTex(128, 128, (c) => {
      c.fillStyle = '#e9e6df'; c.fillRect(0, 0, 128, 128);
      c.fillStyle = '#cfd6d8'; c.fillRect(0, 0, 64, 64); c.fillRect(64, 64, 64, 64);
      c.strokeStyle = '#b9bdbd'; c.lineWidth = 2; c.strokeRect(0, 0, 64, 64); c.strokeRect(64, 64, 64, 64);
    }),
    blue: canvasTex(128, 128, speckle('#56708f', ['#4d6684', '#617c9c'])),
    green: canvasTex(128, 128, speckle('#5f8473', ['#557868', '#6b917f'])),
    red: canvasTex(128, 128, speckle('#a35d52', ['#96544a', '#b0695d'])),
    concrete: canvasTex(128, 128, speckle('#55595f', ['#4b4f55', '#62666c'])),
    grass: canvasTex(128, 128, speckle('#6fae55', ['#63a04b', '#7dbb62', '#5c9647'], 1400)),
    asphalt: canvasTex(128, 128, speckle('#3d4045', ['#35383d', '#484b50'])),
  };
  const plane = (w, d, tex, x, y, z, rep = 1) => {
    const m = new THREE.MeshStandardMaterial({ map: repeat(tex, w / rep, d / rep), roughness: 0.9 });
    const p = mesh(new THREE.PlaneGeometry(w, d), m, x, y, z);
    p.rotation.x = -Math.PI / 2;
    scene.add(p);
    return p;
  };

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8f80, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.5);
  sun.position.set(12, 22, 14);
  scene.add(sun);
  const lamp = (x, z, color = 0xffe2b8, intensity = 9) => {
    const l = new THREE.PointLight(color, intensity, 11, 1.6);
    l.position.set(x, H - 0.35, z);
    scene.add(l);
    B(0.5, 0.06, 0.5, new THREE.MeshBasicMaterial({ color }), x, H - 0.03, z);
  };
  lamp(-9, 3); lamp(-3.5, 3); lamp(-9, -4); lamp(-3, -4); lamp(3, -3.5); lamp(3, 4);
  lamp(10, -0.5, 0x3fa2ff, 16); lamp(10, 4.5, 0x6fb8ff, 9);

  // ---------- ground & exterior ----------
  plane(120, 120, floorTex.grass, 0, 0, 0, 2);
  plane(8, 9, floorTex.concrete, 10, 0.01, 11.5, 2); // driveway
  plane(1.6, 9, floorTex.tile, -6, 0.01, 11.5, 1); // front path
  plane(120, 6, floorTex.asphalt, 0, 0.01, 19, 2); // street
  B(120, 0.12, 0.3, M.white, 0, 0.06, 15.9); // curb

  const tree = (x, z, s = 1) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 1.6 * s, 8), M.woodDark, x, 0.8 * s, z));
    scene.add(mesh(new THREE.SphereGeometry(1.1 * s, 12, 10), M.plant, x, 2.2 * s, z));
    scene.add(mesh(new THREE.SphereGeometry(0.8 * s, 12, 10), mat(0x4ba05c), x + 0.4 * s, 3.0 * s, z - 0.2 * s));
    addCol(x - 0.25, x + 0.25, z - 0.25, z + 0.25);
  };
  tree(-14.5, 10, 1.2); tree(-1, 12, 1); tree(16.5, 2, 1.3); tree(-15, -4, 1.1); tree(3, -11, 1.4); tree(-9, -11.5, 1);
  for (let i = 0; i < 7; i++) { // hedge along the front of the house
    const x = -11.3 + i * 0.75;
    if (x > -7.2 && x < -4.8) continue;
    scene.add(mesh(new THREE.SphereGeometry(0.45, 10, 8), M.plant, x, 0.4, 7.7));
  }
  for (let i = 0; i < 6; i++) scene.add(mesh(new THREE.SphereGeometry(0.45, 10, 8), M.plant, -4 + i * 0.8, 0.4, 7.7));
  addCol(-11.8, -7.2, 7.3, 8.1); addCol(-4.5, 0.5, 7.3, 8.1);

  // mailbox + lawn sign
  solid(0.1, 1.0, 0.1, M.woodDark, -3.4, 0.5, 15.2);
  B(0.24, 0.24, 0.5, mat(0x3b6fb5), -3.4, 1.1, 15.2);
  const sign = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#fffdf6'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#2b3a55'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = '#2b3a55'; c.textAlign = 'center';
    c.font = '700 64px system-ui, sans-serif'; c.fillText('AGENT OFFICE', w / 2, 112);
    c.font = '500 34px system-ui, sans-serif'; c.fillText('startup house · est. 2026', w / 2, 176);
  });
  const signMesh = mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshStandardMaterial({ map: sign, side: THREE.DoubleSide }), -8.6, 1.0, 12.5);
  scene.add(signMesh);
  solid(0.08, 1.4, 0.08, M.woodDark, -9.3, 0.7, 12.5); solid(0.08, 1.4, 0.08, M.woodDark, -7.9, 0.7, 12.5);

  // ---------- floors, ceilings, roof ----------
  for (const r of ROOMS) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    plane(w, d, floorTex[r.floor], (r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2, r.floor === 'wood' ? 2 : 1.2);
  }
  B(18, 0.08, 14, M.ceiling, -3, H + 0.04, 0);
  B(8, 0.08, 10, mat(0x6f757c), 10, H + 0.04, 2);
  B(19.2, 0.28, 15.2, M.roof, -3, H + 0.22, 0);
  B(8.8, 0.28, 11, M.roof, 10.2, H + 0.22, 2.1);
  B(19.4, 0.12, 15.4, M.trim, -3, H + 0.04, 0).scale.set(1, 1, 1);

  // ---------- walls ----------
  // wall from (ax,az) to (bx,bz), axis-aligned and increasing; openings are
  // { at: centre distance from the start, w, kind: 'door' | 'window' }.
  function wall(ax, az, bx, bz, openings = [], m = M.wall) {
    const horiz = az === bz;
    const len = horiz ? bx - ax : bz - az;
    const seg = (s, e, y0, y1, collide = true, sm = m, thick = T) => {
      if (e - s < 0.01) return;
      const mid = (s + e) / 2, l = e - s;
      const w = horiz ? l : thick, d = horiz ? thick : l;
      const x = horiz ? ax + mid : ax, z = horiz ? az : az + mid;
      B(w, y1 - y0, d, sm, x, (y0 + y1) / 2, z);
      if (collide) addCol(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
    };
    let cur = 0;
    for (const o of [...openings].sort((a, b) => a.at - b.at)) {
      const s = o.at - o.w / 2, e = o.at + o.w / 2;
      seg(cur, s, 0, H);
      if (o.kind === 'window') {
        seg(s, e, 0, 0.9);
        seg(s, e, 2.2, H, false);
        seg(s, e, 0.9, 2.2, false, M.glass, 0.04);
        seg(s, e, 0.88, 0.94, false, M.trim, T + 0.08);
      } else {
        seg(s, e, o.h ?? 2.15, H, false);
      }
      cur = e;
    }
    seg(cur, len, 0, H);
  }
  const win = (at, w = 1.8) => ({ at, w, kind: 'window' });
  const door = (at, w = 1.2, h) => ({ at, w, kind: 'door', h });

  // exterior shell
  wall(-12, -7, 6, -7, [win(3), win(9), win(15)]); // north
  wall(-12, -7, -12, 7, [win(3), win(10.2, 1.6)]); // west
  wall(-12, 7, 6, 7, [win(2.6, 1.4), door(6, 1.4), win(9.6, 2), win(15, 2.2)]); // south, front door at x=-6
  wall(6, -7, 6, -3); // east (marketing)
  wall(6, -3, 6, 7, [door(7, 1.2)], M.wall); // shared with garage, door at z=4
  wall(6, -3, 14, -3, [], M.garageWall); // garage north
  wall(14, -3, 14, 7, [], M.garageWall); // garage east
  wall(6, 7, 14, 7, [], M.garageWall); // garage south (roll-up door is decoration)
  // interior
  wall(-12, -1, 0, -1, [door(1), door(11)]); // offices | living room
  wall(-6, -7, -6, -1); // CEO | CFO
  wall(0, -7, 0, 7, [door(11, 4, 2.3)]); // spine; wide opening to kitchen z 2..6
  wall(0, 1, 6, 1, [door(2)]); // marketing | kitchen

  // garage roll-up door (closed) — both faces
  const rollTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#e8e6e0'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, i * 64, w, 4);
      for (let j = 0; j < 4; j++) { c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3; c.strokeRect(j * 64 + 8, i * 64 + 12, 48, 44); }
    }
  });
  const rollM = new THREE.MeshStandardMaterial({ map: rollTex, roughness: 0.7 });
  B(5.4, 2.3, 0.06, rollM, 10, 1.15, 7.13);
  B(5.4, 2.3, 0.06, rollM, 10, 1.15, 6.87);
  // front door leaf, swung open inward
  solid(0.06, 2.1, 1.2, mat(0xb23a3a), -6.72, 1.05, 6.3);
  B(0.04, 0.06, 0.06, M.steel, -6.67, 1.05, 5.85);

  // ---------- living room ----------
  B(3.4, 0.02, 2.6, mat(0xb9a58a), -1.9, 0.035, 1.5); // rug
  solid(0.9, 0.42, 2.0, M.couch, -2.6, 0.21, 1.5); // couch base
  B(0.25, 0.45, 2.0, M.couch, -2.93, 0.62, 1.5);
  B(0.9, 0.22, 0.2, M.couch, -2.6, 0.52, 0.55); B(0.9, 0.22, 0.2, M.couch, -2.6, 0.52, 2.45);
  B(0.5, 0.14, 0.5, mat(0xe9b44c), -2.55, 0.5, 1.0); // cushion
  solid(0.5, 0.38, 0.9, M.woodDark, -1.4, 0.19, 1.5); // coffee table
  B(0.3, 0.03, 0.22, M.steel, -1.4, 0.4, 1.4); // laptop
  B(0.06, 0.75, 1.3, M.black, -0.13, 1.55, 0.5); // TV
  B(0.02, 0.66, 1.2, new THREE.MeshBasicMaterial({ color: 0x1c3b5a }), -0.17, 1.55, 0.5);
  solid(0.4, 0.5, 1.5, M.woodLight, -0.32, 0.25, 0.5); // TV console
  // shared standing-height table: the contractors' desk (their laptops come with their stations)
  solid(TABLE.w, 0.06, TABLE.d, M.woodLight, TABLE.x, TABLE.h, TABLE.z);
  for (const sx of [-1, 1]) {
    B(0.08, TABLE.h - 0.03, 0.08, M.black, TABLE.x + sx * (TABLE.w / 2 - 0.15), (TABLE.h - 0.03) / 2, TABLE.z);
    B(0.1, 0.04, TABLE.d - 0.1, M.black, TABLE.x + sx * (TABLE.w / 2 - 0.15), 0.02, TABLE.z);
  }
  B(TABLE.w - 0.3, 0.05, 0.06, M.black, TABLE.x, TABLE.h - 0.25, TABLE.z); // crossbar
  B(0.36, 0.04, 0.36, mat(0xd9c7a0), TABLE.x, TABLE.h + 0.05, TABLE.z); // pizza box
  const plant = (x, z, s = 1) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.2 * s, 0.15 * s, 0.35 * s, 10), M.pot, x, 0.175 * s, z));
    scene.add(mesh(new THREE.SphereGeometry(0.34 * s, 10, 8), M.plant, x, 0.65 * s, z));
    scene.add(mesh(new THREE.SphereGeometry(0.24 * s, 10, 8), mat(0x4ba05c), x + 0.1 * s, 0.98 * s, z));
    addCol(x - 0.2, x + 0.2, z - 0.2, z + 0.2);
  };
  plant(-0.5, 6.5, 1.2); plant(-10.0, -0.55, 0.9);

  // ---------- kitchen ----------
  // standing research table (researchers' laptops come with their stations)
  {
    const T = RESEARCH_TABLE;
    solid(T.w, 0.06, T.d, M.woodLight, T.x, T.h, T.z);
    for (const sx of [-1, 1]) {
      B(0.08, T.h - 0.03, 0.08, M.black, T.x + sx * (T.w / 2 - 0.15), (T.h - 0.03) / 2, T.z);
      B(0.1, 0.04, T.d - 0.1, M.black, T.x + sx * (T.w / 2 - 0.15), 0.02, T.z);
    }
    B(T.w - 0.3, 0.05, 0.06, M.black, T.x, T.h - 0.25, T.z);
    for (let i = 0; i < 4; i++) B(0.24, 0.03, 0.32, mat([0xf4f4f2, 0xe9e2c8, 0xdfe6f0, 0xf4f4f2][i]), T.x + 0.55 + i * 0.03, T.h + 0.045 + i * 0.03, T.z + 0.12); // stack of papers
  }
  solid(5.0, 0.9, 0.6, M.white, 3.4, 0.45, 6.6);
  B(5.1, 0.05, 0.66, mat(0x3a3d42), 3.4, 0.925, 6.6);
  B(0.5, 0.02, 0.4, M.steel, 2.2, 0.955, 6.6); // sink
  B(0.25, 0.35, 0.22, M.black, 4.6, 1.12, 6.65); // coffee machine
  B(0.07, 0.1, 0.07, mat(0xd2553f), 4.25, 1.0, 6.6);
  solid(0.75, 1.9, 0.7, M.steel, 5.5, 0.95, 1.6); // fridge
  B(0.03, 0.6, 0.04, M.black, 5.1, 1.2, 1.38);
  solid(2.0, 0.9, 0.8, M.woodLight, 2.6, 0.45, 5.2); // island
  B(2.1, 0.05, 0.9, M.white, 2.6, 0.925, 5.2);
  scene.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0xd2553f), 2.3, 1.02, 5.2));
  scene.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0xe9b44c), 2.45, 1.02, 5.25));
  B(3.0, 0.6, 0.35, M.white, 3.4, 2.1, 6.72); // upper cabinets

  // ---------- CEO office ----------
  solid(1.0, 0.35, 2.0, M.woodDark, -11.3, 0.175, -5.8); // bed (founders sleep here)
  B(0.95, 0.16, 1.9, mat(0xdfe6f0), -11.3, 0.43, -5.8);
  B(0.7, 0.1, 0.4, M.white, -11.3, 0.55, -6.5);
  solid(0.35, 1.8, 1.4, M.woodDark, -6.35, 0.9, -3.2); // bookshelf
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++)
    B(0.2, 0.26, 0.12, mat([0xd2553f, 0x3b6fb5, 0xe9b44c, 0x4ba05c, 0xf4f4f2][(i * 3 + j) % 5]), -6.5, 0.32 + i * 0.42, -3.75 + j * 0.2);
  plant(-6.5, -1.6);

  // ---------- CFO office ----------
  solid(0.5, 1.3, 0.6, M.steel, -5.55, 0.65, -6.5); // filing cabinets
  solid(0.5, 1.3, 0.6, M.steel, -5.55, 0.65, -5.85);
  for (let i = 0; i < 3; i++) { B(0.02, 0.03, 0.2, M.black, -5.29, 0.3 + i * 0.4, -6.5); B(0.02, 0.03, 0.2, M.black, -5.29, 0.3 + i * 0.4, -5.85); }
  const chart = canvasTex(256, 192, (c, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b3a55'; c.font = '700 18px system-ui'; c.fillText('RUNWAY (months)', 14, 26);
    c.strokeStyle = '#e5484d'; c.lineWidth = 4; c.beginPath(); c.moveTo(16, 50);
    [[70, 70], [120, 96], [170, 120], [236, 164]].forEach(([x, y]) => c.lineTo(x, y)); c.stroke();
    c.strokeStyle = '#12a594'; c.beginPath(); c.moveTo(16, 50);
    [[70, 62], [120, 78], [170, 88], [236, 104]].forEach(([x, y]) => c.lineTo(x, y)); c.stroke();
    c.strokeStyle = '#999'; c.lineWidth = 2; c.strokeRect(14, 38, 226, 136);
  });
  const chartM = mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ map: chart }), -0.12, 1.6, -4);
  chartM.rotation.y = -Math.PI / 2; scene.add(chartM);
  plant(-5.5, -1.6);

  // ---------- marketing den ----------
  const poster = (text, sub, bg, x, y, z, ry) => {
    const t = canvasTex(256, 340, (c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.textAlign = 'center';
      c.font = '900 64px system-ui, sans-serif'; c.fillText(text, w / 2, 170);
      c.font = '600 22px system-ui, sans-serif'; c.fillText(sub, w / 2, 220);
    });
    const p = mesh(new THREE.PlaneGeometry(0.8, 1.06), new THREE.MeshStandardMaterial({ map: t }), x, y, z);
    p.rotation.y = ry; scene.add(p);
  };
  poster('SHIP IT', 'then tell everyone', '#e5484d', 5.88, 1.6, -4.6, -Math.PI / 2);
  poster('10×', 'is a mindset', '#5b8def', 5.88, 1.6, -3.4, -Math.PI / 2);
  poster('GROWTH', 'up and to the right', '#30a46c', 0.12, 1.6, -3.2, Math.PI / 2);
  const bean = mesh(new THREE.SphereGeometry(0.55, 14, 10), mat(0xe9b44c), 1.0, 0.3, -0.2); bean.scale.y = 0.6; scene.add(bean);
  addCol(0.55, 1.45, -0.65, 0.25);
  solid(0.06, 1.7, 0.06, M.black, 5.2, 0.85, -0.6); // ring light
  const ring = mesh(new THREE.TorusGeometry(0.25, 0.035, 8, 24), new THREE.MeshBasicMaterial({ color: 0xfff3d0 }), 5.2, 1.8, -0.6);
  ring.rotation.y = -0.8; scene.add(ring);
  plant(0.6, -6.4, 1.1);

  // ---------- garage / server room ----------
  // Racks are data-driven: setRacks() rebuilds them from the infrastructure
  // registry (one rack per group, one labelled unit per resource).
  const rackM = mat(0x16181d, { metalness: 0.4, roughness: 0.5 });
  const rackGroup = new THREE.Group();
  scene.add(rackGroup);
  const rackCols = [];
  let racks = [];
  const RACK_Z = -1.3;
  const fit = (c, text, max) => {
    let t = String(text ?? '');
    while (t.length > 1 && c.measureText(t).width > max) t = `${t.slice(0, -2)}…`;
    return t;
  };
  function drawLedStrip(r) {
    const c = r.tex.image.getContext('2d');
    const top = r.ledTop;
    c.fillStyle = '#0b0d11'; c.fillRect(0, top, 256, 512 - top);
    for (let y = top + 6; y < 500; y += 22) {
      c.fillStyle = '#191c22'; c.fillRect(10, y, 236, 16);
      for (let i = 0; i < 14; i++) {
        const v = Math.random();
        c.fillStyle = v < 0.5 ? '#34e27a' : v < 0.7 ? '#2c9bff' : v < 0.76 ? '#ffb020' : '#10301c';
        c.fillRect(18 + i * 10, y + 5, 6, 6);
      }
      c.fillStyle = '#2a2f38'; c.fillRect(170, y + 4, 66, 8);
    }
    r.tex.needsUpdate = true;
  }
  function drawRack(r) {
    const c = r.tex.image.getContext('2d');
    c.fillStyle = '#0b0d11'; c.fillRect(0, 0, 256, 512);
    c.fillStyle = r.color; c.fillRect(0, 0, 256, 46);
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.font = '700 26px system-ui, sans-serif';
    c.fillText(fit(c, r.rack.name.toUpperCase(), 236), 10, 33);
    const n = r.rack.resources.length;
    const h = Math.min(132, Math.floor(360 / Math.max(n, 1)));
    r.rack.resources.forEach((res, i) => {
      const y = 54 + i * (h + 6);
      c.fillStyle = '#1b2030'; c.fillRect(8, y, 240, h);
      c.fillStyle = r.color; c.fillRect(8, y, 5, h);
      c.fillStyle = statusColors[res.status] ?? statusColors.unknown;
      c.beginPath(); c.arc(232, y + 18, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.font = '700 19px system-ui, sans-serif';
      c.fillText(fit(c, res.resource || '(unnamed)', 196), 20, y + 24);
      c.fillStyle = '#9fb0cc'; c.font = '14px system-ui, sans-serif';
      if (h > 60) c.fillText(fit(c, res.type, 220), 20, y + 46);
      c.font = '13px ui-monospace, Menlo, monospace';
      if (h > 84) c.fillText(fit(c, `${res.identifier || '-'}`, 220), 20, y + 68);
      if (h > 106) c.fillText(fit(c, `${res.region && res.region !== '-' ? `${res.region} · ` : ''}${res.status}`, 220), 20, y + 90);
    });
    r.ledTop = 54 + n * (h + 6) + 2;
    drawLedStrip(r);
  }
  let statusColors = { unknown: '#8b93a1' };
  function setRacks(list, colors, brand) {
    statusColors = colors;
    for (const o of rackGroup.children.slice()) {
      rackGroup.remove(o);
      o.geometry.dispose();
      o.material.map?.dispose();
    }
    for (const col of rackCols.splice(0)) { const i = colliders.indexOf(col); if (i >= 0) colliders.splice(i, 1); }
    const n = list.length;
    const spacing = Math.min(1.45, 6.6 / Math.max(n, 1));
    const w = Math.min(1.0, spacing - 0.22);
    racks = list.map((rack, i) => {
      const x = 10 + (i - (n - 1) / 2) * spacing;
      const color = brand(rack);
      rackGroup.add(mesh(new THREE.BoxGeometry(w, 2.1, 0.9), rackM, x, 1.05, RACK_Z));
      const tex = canvasTex(256, 512);
      rackGroup.add(mesh(new THREE.PlaneGeometry(w - 0.08, 1.98), new THREE.MeshBasicMaterial({ map: tex }), x, 1.05, RACK_Z + 0.455));
      const sign = canvasTex(256, 64, (c) => {
        c.fillStyle = '#06101c'; c.fillRect(0, 0, 256, 64);
        c.fillStyle = color; c.fillRect(0, 56, 256, 8);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '700 30px system-ui, sans-serif';
        c.fillText(fit(c, rack.name, 240), 128, 40);
      });
      rackGroup.add(mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: sign }), x, 2.32, RACK_Z + 0.42));
      const col = { x0: x - w / 2, x1: x + w / 2, z0: RACK_Z - 0.45, z1: RACK_Z + 0.45, on: true };
      colliders.push(col); rackCols.push(col);
      const r = { rack, tex, x, z: RACK_Z, color, ledTop: 60 };
      drawRack(r);
      return r;
    });
  }
  B(7.0, 0.08, 0.5, M.steel, 10, 2.6, RACK_Z); // cable tray above the row
  B(0.06, 0.2, 0.06, M.steel, 6.8, 2.72, RACK_Z); B(0.06, 0.2, 0.06, M.steel, 13.2, 2.72, RACK_Z);
  [[0x2c9bff, -0.62], [0xffb020, -0.5], [0xe5484d, -0.38]].forEach(([c, z]) => B(6.6, 0.03, 0.05, mat(c), 10, 0.04, z));
  solid(0.9, 1.3, 0.7, mat(0xdfe3e8), 13.4, 0.65, -2.4); // cooling unit
  B(0.6, 0.4, 0.02, M.black, 13.4, 0.95, -2.04);
  solid(2.4, 0.9, 0.7, M.woodLight, 12.5, 0.45, 5.6); // workbench
  B(0.4, 0.3, 0.3, mat(0xd2553f), 11.8, 1.05, 5.6); B(0.5, 0.12, 0.3, M.steel, 12.9, 0.96, 5.6);
  solid(0.5, 0.5, 0.5, mat(0xa98455), 7.0, 0.25, 6.2); solid(0.5, 0.5, 0.5, mat(0xa98455), 7.6, 0.25, 6.3); B(0.5, 0.5, 0.5, mat(0xb8915f), 7.25, 0.75, 6.25);
  const statusTex = canvasTex(512, 256);
  const statusMesh = mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: statusTex }), 13.88, 1.7, 3.2);
  statusMesh.rotation.y = -Math.PI / 2; scene.add(statusMesh);
  B(0.06, 1.3, 2.5, M.black, 13.92, 1.7, 3.2);
  let statusInfo = { agents: 0, doing: 0, blocked: 0 };
  const drawStatus = (t) => {
    const c = statusTex.image.getContext('2d');
    c.fillStyle = '#06101c'; c.fillRect(0, 0, 512, 256);
    c.fillStyle = '#34e27a'; c.font = '700 30px ui-monospace, Menlo, monospace'; c.fillText('GARAGE CLUSTER · ONLINE', 20, 44);
    c.fillStyle = '#8fb8e8'; c.font = '22px ui-monospace, Menlo, monospace';
    c.fillText(`agents online   ${statusInfo.agents}`, 20, 90);
    c.fillText(`tasks running   ${statusInfo.doing}`, 20, 122);
    c.fillStyle = statusInfo.blocked ? '#ffb020' : '#8fb8e8';
    c.fillText(`blocked         ${statusInfo.blocked}`, 20, 154);
    c.fillStyle = '#2c9bff';
    for (let i = 0; i < 46; i++) {
      const v = 18 + 30 * (0.5 + 0.5 * Math.sin(i * 0.5 + t * 2)) + 12 * Math.sin(i * 1.7 + t);
      c.fillRect(20 + i * 10, 236 - v, 7, v);
    }
    statusTex.needsUpdate = true;
  };
  drawStatus(0);

  // Recurring tasks board: Paperclip routines (nightly audit, research brief,
  // weekly finance report...) on the east wall, north of the cluster screen.
  const ROUTINE_COLORS = { active: '#34e27a', running: '#2c9bff', paused: '#8b93a1' };
  const routineTex = canvasTex(1024, 640);
  const routineMesh = mesh(new THREE.PlaneGeometry(2.6, 1.625), new THREE.MeshBasicMaterial({ map: routineTex }), 13.88, 1.62, 0.25);
  routineMesh.rotation.y = -Math.PI / 2; scene.add(routineMesh);
  B(0.06, 1.74, 2.72, M.black, 13.92, 1.62, 0.25);
  let routineRows = [];
  let untilFn = () => '';
  const drawRoutines = () => {
    const c = routineTex.image.getContext('2d');
    c.fillStyle = '#06101c'; c.fillRect(0, 0, 1024, 640);
    c.fillStyle = '#ffb020'; c.fillRect(0, 0, 1024, 8);
    c.textAlign = 'left';
    c.fillStyle = '#ffb020'; c.font = '700 40px ui-monospace, Menlo, monospace';
    c.fillText('RECURRING TASKS', 32, 62);
    c.fillStyle = '#5f7391'; c.font = '22px ui-monospace, Menlo, monospace';
    c.textAlign = 'right'; c.fillText(`${routineRows.length} routine${routineRows.length === 1 ? '' : 's'}`, 992, 60);
    c.textAlign = 'left';
    if (!routineRows.length) {
      c.fillStyle = '#8fb8e8'; c.font = '28px system-ui, sans-serif';
      c.fillText('No routines yet. Add one in Paperclip → Routines.', 32, 140);
    }
    const shown = routineRows.slice(0, 6);
    const rowH = Math.min(132, Math.floor(540 / Math.max(shown.length, 1)));
    shown.forEach((r, i) => {
      const y = 92 + i * rowH;
      c.fillStyle = i % 2 ? '#0b1626' : '#0e1b2e'; c.fillRect(20, y, 984, rowH - 10);
      c.fillStyle = ROUTINE_COLORS[r.status] ?? ROUTINE_COLORS.paused; c.fillRect(20, y, 8, rowH - 10);
      c.beginPath(); c.arc(56, y + 36, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.font = '700 30px system-ui, sans-serif';
      c.fillText(fit(c, r.title, 600), 82, y + 46);
      c.fillStyle = '#9fb0cc'; c.font = '24px system-ui, sans-serif';
      if (rowH > 80) c.fillText(fit(c, `${r.agent} · ${r.schedule}`, 600), 82, y + 84);
      c.textAlign = 'right';
      const next = r.status === 'running' ? 'running now' : r.status === 'paused' ? 'paused' : untilFn(r.nextRunAt) || '—';
      c.fillStyle = r.status === 'running' ? '#2c9bff' : r.status === 'paused' ? '#8b93a1' : '#34e27a';
      c.font = '700 30px ui-monospace, Menlo, monospace'; c.fillText(next, 990, y + 46);
      c.fillStyle = '#5f7391'; c.font = '22px ui-monospace, Menlo, monospace';
      if (rowH > 80) c.fillText(fit(c, `last: ${r.last}`, 300), 990, y + 84);
      c.textAlign = 'left';
    });
    if (routineRows.length > shown.length) {
      c.fillStyle = '#5f7391'; c.font = '22px ui-monospace, Menlo, monospace';
      c.fillText(`+ ${routineRows.length - shown.length} more in Paperclip`, 32, 628);
    }
    routineTex.needsUpdate = true;
  };
  drawRoutines();

  let lastLed = 0, lastStatus = 0, lastRoutines = 0, ledIdx = 0;
  return {
    colliders,
    setStatus(info) { statusInfo = info; },
    /** Rows from routines.js routineRow(); `until(iso)` formats the countdown. */
    setRoutines(rows, until) { routineRows = rows; untilFn = until; drawRoutines(); },
    setRacks,
    /** The rack the player is standing in front of, if any. */
    rackNear(x, z) {
      if (z < RACK_Z + 0.4 || z > RACK_Z + 3.4) return null;
      let best = null, bd = 1.1;
      for (const r of racks) { const d = Math.abs(x - r.x); if (d < bd) { bd = d; best = r.rack; } }
      return best;
    },
    update(t) {
      if (racks.length && t - lastLed > 0.2) { lastLed = t; drawLedStrip(racks[ledIdx++ % racks.length]); }
      if (t - lastStatus > 0.25) { lastStatus = t; drawStatus(t); }
      if (t - lastRoutines > 15) { lastRoutines = t; drawRoutines(); } // keep countdowns fresh
    },
  };
}
