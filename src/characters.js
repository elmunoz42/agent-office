// Stylised low-poly people built from capsules and spheres. Origin at the
// feet, facing +Z. Returns handles for the parts that get animated.
import * as THREE from 'three';
import { mat, mesh, canvasTex } from './util.js';

export function makeCharacter(look) {
  const g = new THREE.Group();
  const b = look.build ?? 1;
  const skin = mat(look.skin, { roughness: 0.7 });
  const top = mat(look.top);
  const pants = mat(look.pants);
  const hairM = mat(look.hair, { roughness: 0.95 });
  const dark = mat(0x1b1b1f);
  const style = look.topStyle ?? 'tee';

  // legs + shoes
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.CapsuleGeometry(0.085 * b, 0.62, 4, 10), pants, s * 0.105 * b, 0.42, 0));
    g.add(mesh(new THREE.BoxGeometry(0.13, 0.08, 0.27), mat(look.shoes ?? 0x2a2a2e), s * 0.105 * b, 0.04, 0.04));
  }

  // torso
  const torso = mesh(new THREE.CapsuleGeometry(0.2, 0.32, 6, 14), top, 0, 1.12, 0);
  torso.scale.set(b, 1, 0.68 * b);
  g.add(torso);
  if (style === 'vest' || style === 'jacket') {
    const outerM = mat(style === 'vest' ? look.vest : look.top);
    torso.material = mat(style === 'jacket' ? look.under ?? 0xf4f1e8 : look.top);
    for (const s of [-1, 1]) { // two open front panels + a back
      const p = mesh(new THREE.CapsuleGeometry(0.2, 0.3, 6, 12), outerM, s * 0.075 * b, 1.12, 0);
      p.scale.set(0.68 * b, 1.02, 0.74 * b);
      g.add(p);
    }
  }
  if (style === 'hoodie') {
    const hood = mesh(new THREE.SphereGeometry(0.13, 12, 10), top, 0, 1.47, -0.1);
    hood.scale.set(1.25 * b, 0.75, 0.8);
    g.add(hood);
    g.add(mesh(new THREE.BoxGeometry(0.24 * b, 0.1, 0.02), mat(look.top, { roughness: 1 }), 0, 0.98, 0.14 * b));
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.012, 0.14, 0.012), mat(0xf4f4f2), s * 0.04, 1.33, 0.135 * b));
  }
  if (style === 'shirt') {
    g.add(mesh(new THREE.BoxGeometry(0.2 * b, 0.05, 0.16), mat(0xf4f4f2), 0, 1.47, 0.02));
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.SphereGeometry(0.012, 6, 6), mat(0xf4f4f2), 0, 1.32 - i * 0.12, 0.137 * b));
  }
  if (look.chain) {
    const chain = mesh(new THREE.TorusGeometry(0.095, 0.009, 6, 20), mat(0xe9c046, { metalness: 0.8, roughness: 0.3 }), 0, 1.4, 0.05);
    chain.rotation.x = 1.15;
    g.add(chain);
  }

  // arms (pivot at the shoulder so they can swing forward to type)
  const sleeveM = style === 'vest' ? torso.material : top;
  const arm = (s) => {
    const p = new THREE.Group();
    p.position.set(s * 0.265 * b, 1.37, 0);
    p.rotation.z = s * 0.09;
    if (style === 'tee') {
      p.add(mesh(new THREE.CapsuleGeometry(0.055, 0.44, 4, 8), skin, 0, -0.27, 0));
      p.add(mesh(new THREE.CapsuleGeometry(0.066, 0.12, 4, 8), top, 0, -0.1, 0));
    } else {
      p.add(mesh(new THREE.CapsuleGeometry(0.06, 0.44, 4, 8), sleeveM, 0, -0.27, 0));
    }
    p.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), skin, 0, -0.57, 0));
    g.add(p);
    return p;
  };
  const armL = arm(-1), armR = arm(1);

  // neck + head
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 10), skin, 0, 1.49, 0));
  const head = new THREE.Group();
  head.position.set(0, 1.63, 0);
  g.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.145, 20, 16), skin);
  skull.scale.set(0.95, 1.1, 1);
  head.add(skull);
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.031, 10, 8), mat(0xffffff, { roughness: 0.3 }), s * 0.052, 0.02, 0.12));
    head.add(mesh(new THREE.SphereGeometry(0.016, 8, 8), dark, s * 0.052, 0.02, 0.146));
    head.add(mesh(new THREE.BoxGeometry(0.045, 0.008, 0.01), hairM, s * 0.052, 0.072, 0.132));
    head.add(mesh(new THREE.SphereGeometry(0.028, 8, 8), skin, s * 0.14, 0.0, 0.0));
  }
  head.add(mesh(new THREE.SphereGeometry(0.02, 8, 8), skin, 0, -0.02, 0.148));
  head.add(mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), mat(0x9c4a48), 0, -0.075, 0.136));

  // hair
  const cap = (theta = 0.44, tilt = -0.3) => {
    const c = mesh(new THREE.SphereGeometry(0.156, 18, 12, 0, Math.PI * 2, 0, Math.PI * theta), hairM, 0, 0.012, -0.006);
    c.scale.set(0.97, 1.1, 1.03);
    c.rotation.x = tilt;
    head.add(c);
  };
  switch (look.hairStyle) {
    case 'short': cap(); break;
    case 'swoop':
      cap();
      { const tuft = mesh(new THREE.SphereGeometry(0.07, 10, 8), hairM, 0.03, 0.14, 0.09); tuft.scale.set(1.4, 0.7, 1); head.add(tuft); }
      break;
    case 'long':
      cap(0.46, -0.25);
      head.add(mesh(new THREE.BoxGeometry(0.27, 0.34, 0.09), hairM, 0, -0.12, -0.105));
      for (const s of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(0.035, 0.26, 0.12), hairM, s * 0.14, -0.08, -0.03));
      break;
    case 'bun':
      cap();
      head.add(mesh(new THREE.SphereGeometry(0.065, 10, 8), hairM, 0, 0.15, -0.1));
      break;
    case 'curly':
      for (let i = 0; i < 22; i++) {
        const a = i * 2.399, r = 0.035 + 0.1 * Math.sqrt(i / 22);
        const x = Math.cos(a) * r, z = Math.sin(a) * r - 0.02;
        const y = 0.165 - (x * x + z * z) * 4.2;
        if (z > 0.085 && y < 0.1) continue;
        head.add(mesh(new THREE.SphereGeometry(0.052, 8, 6), hairM, x, y, z));
      }
      break;
    default: break; // bald
  }
  if (look.beard) {
    const beard = mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, Math.PI * 0.57, Math.PI * 0.43), hairM, 0, 0, 0.012);
    beard.scale.set(0.96, 1.12, 1);
    head.add(beard);
    head.add(mesh(new THREE.BoxGeometry(0.055, 0.012, 0.012), mat(0x9c4a48), 0, -0.075, 0.158));
  }
  if (look.glasses) {
    for (const s of [-1, 1]) head.add(mesh(new THREE.TorusGeometry(0.036, 0.006, 6, 18), dark, s * 0.052, 0.02, 0.146));
    head.add(mesh(new THREE.BoxGeometry(0.035, 0.008, 0.008), dark, 0, 0.025, 0.148));
  }

  // soft blob shadow
  const shadow = mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }), 0, 0.03, 0);
  shadow.rotation.x = -Math.PI / 2;
  g.add(shadow);

  g.scale.setScalar(look.height ?? 1);
  return { group: g, head, armL, armR, torso };
}

export function makeNameTag(agent) {
  const tex = canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = 'rgba(12,16,26,.78)';
    c.beginPath(); c.roundRect(6, 10, w - 12, h - 20, 26); c.fill();
    c.fillStyle = agent.color; c.beginPath(); c.arc(48, h / 2, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.font = '700 40px system-ui, sans-serif'; c.fillText(agent.name, 76, 60);
    c.fillStyle = '#b8c2d6'; c.font = '500 26px system-ui, sans-serif'; c.fillText(agent.role, 76, 96);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(1.2, 0.3, 1);
  return s;
}
