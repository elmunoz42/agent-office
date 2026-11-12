import * as THREE from 'three';

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (draw) draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts });

export function mesh(geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  return o;
}

export function box(parent, w, h, d, m, x, y, z) {
  const o = mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
  parent.add(o);
  return o;
}

export function speckle(base, dots, n = 900) {
  return (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = dots[i % dots.length];
      ctx.globalAlpha = 0.25 + Math.random() * 0.4;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    ctx.globalAlpha = 1;
  };
}

export function repeat(tex, rx, ry) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
