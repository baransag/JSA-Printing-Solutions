import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ============================================================
   JSA — Cinematic printing studio
   One WebGL scene, five production stations on a camera rail.
   Every animation is a pure function of station-local time `t`.
   ============================================================ */

export const SCENES = [
  { title: 'Sticker printing', note: 'A label roll feeds through the press and printed stickers emerge.' },
  { title: 'Hang tag production', note: 'Cardstock is printed, die-cut, then fitted with eyelets and string.' },
  { title: 'Printed & woven labels', note: 'Garment labels are produced, cut and stacked — printed vs woven.' },
  { title: 'Business cards & foil', note: 'Cards are hot-stamped with gold foil and stacked.' },
  { title: 'Sticker showcase', note: 'A finished sheet leaves the press and stickers peel off.' },
] as const;
export const DURATIONS = [9, 10, 9.5, 9.5, 10.5];
const SPACING = 17;

type V3 = [number, number, number];
interface Key { t: number; p: V3; l: V3; h: number }
interface Station { x: number; group: THREE.Group; update(t: number): void; cam(t: number): { p: V3; l: V3; h: number } }

/* ---------- tiny helpers ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eo = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const T2 = Math.PI * 2;

function path(keys: Key[]) {
  return (t: number) => {
    if (t <= keys[0].t) return { p: keys[0].p, l: keys[0].l, h: keys[0].h };
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i].t) {
        const a = keys[i - 1], b = keys[i], k = eio(seg(t, a.t, b.t));
        const m = (u: V3, v: V3): V3 => [lerp(u[0], v[0], k), lerp(u[1], v[1], k), lerp(u[2], v[2], k)];
        return { p: m(a.p, b.p), l: m(a.l, b.l), h: lerp(a.h, b.h, k) };
      }
    }
    const e = keys[keys.length - 1];
    return { p: e.p, l: e.l, h: e.h };
  };
}

const std = (color: number, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const gold = () => std(0xc9a04c, 0.26, 1);
const steel = () => std(0xc9cfcc, 0.28, 0.9);

function shade<T extends THREE.Mesh>(m: T) { m.castShadow = true; m.receiveShadow = true; return m; }
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = shade(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m;
}
/** cylinder whose axis is Z (a roller across the machine) */
function roller(r: number, len: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const geo = new THREE.CylinderGeometry(r, r, len, 36); geo.rotateX(Math.PI / 2);
  const m = shade(new THREE.Mesh(geo, mat)); m.position.set(x, y, z); return m;
}
function flat(w: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; return m;
}
function cv(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] as const;
}
function tex(c: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = THREE.RepeatWrapping; }
  return t;
}
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function goldGrad(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, '#F5DC93'); gr.addColorStop(0.45, '#B58A3C'); gr.addColorStop(0.7, '#E6C577'); gr.addColorStop(1, '#8a6523');
  return gr;
}
function table(g: THREE.Group, w = 12.6) {
  g.add(box(w, 0.5, 5.8, std(0xe8dfc9, 0.7), 0.5, 0.25, 0));
  g.add(box(w + 0.04, 0.05, 5.84, gold(), 0.5, 0.47, 0));
}

/* ---------- fictional sticker artwork (no real brands) ---------- */
function drawSticker(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number) {
  const cx = x + w / 2, cy = y + h / 2, m = Math.min(w, h);
  const font = (s: number, wt = 800) => { g.font = `${wt} ${s}px "Plus Jakarta Sans", Arial, sans-serif`; };
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  switch (v % 6) {
    case 0: // round product badge
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, m / 2, 0, T2); g.fill();
      g.fillStyle = '#E4572E'; g.beginPath(); g.arc(cx, cy, m * 0.46, 0, T2); g.fill();
      g.strokeStyle = '#FFF3E0'; g.lineWidth = m * 0.025; g.beginPath(); g.arc(cx, cy, m * 0.38, 0, T2); g.stroke();
      g.fillStyle = '#FFF3E0'; font(m * 0.17); g.fillText('FRESH', cx, cy + m * 0.06);
      g.fillStyle = '#2F9E6E'; g.beginPath(); g.ellipse(cx, cy - m * 0.17, m * 0.06, m * 0.12, 0.7, 0, T2); g.fill();
      g.fillStyle = '#FFD166'; font(m * 0.07, 600); g.fillText('SMALL BATCH', cx, cy + m * 0.23); break;
    case 1: // barcode label
      g.fillStyle = '#fff'; rr(g, x, y + h * 0.18, w, h * 0.64, m * 0.06); g.fill();
      g.strokeStyle = '#d4d4cb'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#111'; { let bx = x + w * 0.1, i = 0; while (bx < x + w * 0.9) { const bw = ((i * 7) % 3 + 1) * m * 0.011 + m * 0.006; g.fillRect(bx, y + h * 0.27, bw, h * 0.3); bx += bw + m * 0.012 + ((i * 5) % 3) * m * 0.006; i++; } }
      g.font = `600 ${m * 0.07}px monospace`; g.fillText('SKU 204817', cx, y + h * 0.67); break;
    case 2: // packaging caution
      g.fillStyle = '#fff'; rr(g, x, y, w, h, m * 0.12); g.fill();
      g.fillStyle = '#F4C430'; rr(g, x + m * 0.03, y + m * 0.03, w - m * 0.06, h - m * 0.06, m * 0.1); g.fill();
      g.fillStyle = '#1b1b1b'; font(m * 0.15); g.fillText('HANDLE', cx, cy - m * 0.12); g.fillText('WITH CARE', cx, cy + m * 0.07);
      g.fillRect(cx - m * 0.18, cy + m * 0.22, m * 0.36, m * 0.03);
      g.beginPath(); g.moveTo(cx, cy - m * 0.42); g.lineTo(cx - m * 0.08, cy - m * 0.32); g.lineTo(cx + m * 0.08, cy - m * 0.32); g.fill(); break;
    case 3: // brand sticker, emerald + gold
      g.fillStyle = '#fff'; rr(g, x, y, w, h, m * 0.2); g.fill();
      g.fillStyle = '#0F5C4D'; rr(g, x + m * 0.03, y + m * 0.03, w - m * 0.06, h - m * 0.06, m * 0.18); g.fill();
      g.strokeStyle = '#C9A04C'; g.lineWidth = m * 0.015; rr(g, x + m * 0.09, y + m * 0.09, w - m * 0.18, h - m * 0.18, m * 0.12); g.stroke();
      g.fillStyle = goldGrad(g, x, y, x + w, y + h); font(m * 0.25, 700); g.fillText('MIRA', cx, cy - m * 0.03);
      font(m * 0.07, 600); g.fillText('S T U D I O', cx, cy + m * 0.17); break;
    case 4: // natural teal circle
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, m / 2, 0, T2); g.fill();
      g.fillStyle = '#1B998B'; g.beginPath(); g.arc(cx, cy, m * 0.46, 0, T2); g.fill();
      g.fillStyle = '#FFF'; font(m * 0.2); g.fillText('100%', cx, cy - m * 0.08); font(m * 0.115, 700); g.fillText('NATURAL', cx, cy + m * 0.1);
      g.fillStyle = '#FFD166'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? m * 0.03 : m * 0.07, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(cx + Math.cos(a) * r, cy + m * 0.26 + Math.sin(a) * r); } g.fill(); break;
    default: // burgundy promo
      g.fillStyle = '#fff'; rr(g, x, y + h * 0.1, w, h * 0.8, m * 0.14); g.fill();
      g.fillStyle = '#7B1E2B'; rr(g, x + m * 0.03, y + h * 0.1 + m * 0.03, w - m * 0.06, h * 0.8 - m * 0.06, m * 0.12); g.fill();
      g.fillStyle = '#F8F4EC'; font(m * 0.28); g.fillText('NEW', cx, cy - m * 0.07);
      g.fillStyle = '#F5DC93'; font(m * 0.15, 700); g.fillText('SAVE 20%', cx, cy + m * 0.15);
  }
  g.restore();
}
function stickerTexture(v: number) {
  const [c, g] = cv(256, 256); drawSticker(g, 14, 14, 228, 228, v); return tex(c);
}

/* =================== STATION 1 — sticker press =================== */
function buildStickerPress(x: number, mobile: boolean): Station {
  const group = new THREE.Group(); group.position.x = x; table(group);
  const V = 0.9, X0 = -3.9, L = 8.1, W = 1.8, Y = 0.765;
  const PXU = mobile ? 100 : 136, CW = Math.round(L * PXU), CH = Math.round(W * PXU);
  const [wc, wg] = cv(CW, CH); const webTex = tex(wc);
  const web = flat(L, W, new THREE.MeshStandardMaterial({ map: webTex, roughness: 0.42 }), X0 + L / 2, Y, 0);
  group.add(box(8, 0.14, 1.95, std(0x1d2e29, 0.4, 0.2), 0.2, 0.67, 0), web);

  // unwind roll
  const R = 1, rollY = Y + R;
  const roll = new THREE.Group(); roll.position.set(X0, rollY, 0);
  roll.add(roller(R, 1.9, std(0xfbfbf6, 0.85)), roller(0.32, 2.1, std(0x0f5c4d, 0.5)));
  roll.add(box(0.05, 0.04, 1.92, std(0x0f5c4d, 0.6), R + 0.005, 0, 0));
  for (let i = 0; i < 3; i++) { const sp = box(0.55, 0.06, 2.12, std(0xb58a3c, 0.4, 0.8)); sp.rotation.z = (i * Math.PI) / 3; roll.add(sp); }
  group.add(roll);
  for (const s of [-1, 1]) group.add(box(0.18, rollY - 0.45, 0.16, std(0x0a4035, 0.5), X0, 0.5 + (rollY - 0.5) / 2 - 0.1, s * 1.12));

  // pinch rollers (rubber), driven with the web
  const rubber = std(0x232826, 0.7);
  const pinch = [-1.9, 2.9].map(px => {
    const r = roller(0.18, 2.1, rubber, px, Y + 0.2, 0); group.add(r);
    for (const s of [-1, 1]) group.add(box(0.26, 0.5, 0.14, std(0x0a4035, 0.5), px, Y + 0.33, s * 1.1));
    return r;
  });

  // print gantry
  const HX = 0.4, emerald = std(0x0f5c4d, 0.45, 0.1), ivory = std(0xf3ecd9, 0.55);
  for (const s of [-1, 1]) {
    group.add(box(0.4, 1.5, 0.4, emerald, HX, 1.25, s * 1.25));
    group.add(box(0.42, 0.06, 0.42, gold(), HX, 1.99, s * 1.25));
  }
  group.add(box(0.7, 0.36, 3.1, ivory, HX, 2.15, 0));
  group.add(box(0.72, 0.05, 3.12, gold(), HX, 1.95, 0));
  const carriage = new THREE.Group(); carriage.position.set(HX, 1.65, 0);
  carriage.add(box(0.8, 0.42, 0.62, std(0x1d2e29, 0.4, 0.3)));
  [0x1fb5d8, 0xd6336c, 0xf2c230, 0x1a1a1a].forEach((c, i) => carriage.add(box(0.14, 0.2, 0.34, std(c, 0.35), -0.27 + i * 0.18, -0.3, 0)));
  carriage.add(box(0.8, 0.02, 0.62, gold(), 0, 0.22, 0));
  group.add(carriage);

  // UV dryer + take-up cabinet
  group.add(box(1.2, 0.45, 2.15, emerald, 2.0, 1.35, 0), box(1.22, 0.04, 2.17, gold(), 2.0, 1.12, 0));
  group.add(box(1.15, 0.03, 1.9, new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc46b, emissiveIntensity: 0.55 }), 2.0, 1.1, 0));
  for (const s of [-1, 1]) group.add(box(0.2, 0.85, 0.2, emerald, 2.0, 0.92, s * 1.1));
  group.add(box(1.7, 2.1, 2.5, emerald, 5.05, 1.55, 0), box(1.72, 0.06, 2.52, gold(), 5.05, 1.1, 0));
  group.add(box(0.08, 0.2, 2.0, std(0x050505, 0.8), 4.2, Y - 0.01, 0));
  group.add(box(0.1, 0.62, 1.1, ivory, 4.18, 1.95, 0.0));

  const clipRect = Math.round(PXU * (HX - X0));
  const pitch = Math.round(PXU * 1.45), stW = Math.round(PXU * 1.22), stH = Math.round(CH * 0.8);
  return {
    x, group, update(t) {
      const scroll = V * t * PXU;
      wg.fillStyle = '#fbfbf7'; wg.fillRect(0, 0, CW, CH);
      wg.fillStyle = '#e9e9e1'; wg.fillRect(0, 5, CW, 2); wg.fillRect(0, CH - 7, CW, 2);
      wg.save(); wg.beginPath(); wg.rect(clipRect, 0, CW - clipRect, CH); wg.clip();
      const off = scroll % pitch;
      for (let k = -1; k < Math.ceil(CW / pitch) + 1; k++) {
        const px = off + k * pitch, idx = Math.round((scroll - off) / pitch) - k + 60;
        const sx = px + (pitch - stW) / 2, sy = (CH - stH) / 2;
        drawSticker(wg, sx, sy, stW, stH, idx);
        wg.strokeStyle = 'rgba(150,150,140,.55)'; wg.lineWidth = 1.2; rr(wg, sx - 2, sy - 2, stW + 4, stH + 4, 10); wg.stroke();
      }
      wg.restore();
      wg.fillStyle = 'rgba(0,0,0,.07)'; wg.fillRect(clipRect - 2, 0, 3, CH); // print line
      webTex.needsUpdate = true;
      roll.rotation.z = (V * t) / R;
      pinch.forEach(r => (r.rotation.z = (V * t) / 0.18));
      carriage.position.z = Math.sin(t * 5.2) * 0.8;
    },
    cam: path([
      { t: 0, p: [0.9, 5.6, 12], l: [0.7, 0.7, 0], h: 5.4 },
      { t: 4.5, p: [1.6, 4.3, 9], l: [1.6, 0.9, 0], h: 4.2 },
      { t: 9, p: [2.6, 3.3, 8.2], l: [2.8, 0.9, 0], h: 3.6 },
    ]),
  };
}

/* =================== STATION 2 — hang tags =================== */
function drawTagInk(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number) {
  const col = v % 2 ? '#0F5C4D' : '#7B1E2B';
  g.save(); g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(x + 10, y + 10, w - 20, h - 20);
  g.fillStyle = col; g.fillRect(x + 10, y + h * 0.66, w - 20, h * 0.34 - 10);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#F8F4EC'; g.font = `700 ${w * 0.17}px Cinzel, serif`; g.fillText('JSA', x + w / 2, y + h * 0.78);
  g.font = `500 ${w * 0.07}px "Plus Jakarta Sans", sans-serif`; g.fillText('PRINTING', x + w / 2, y + h * 0.88);
  g.fillStyle = col; g.font = `600 ${w * 0.13}px "Cormorant Garamond", serif`; g.fillText('Signature', x + w / 2, y + h * 0.4);
  g.font = `500 ${w * 0.07}px "Plus Jakarta Sans", sans-serif`; g.fillText('COLLECTION', x + w / 2, y + h * 0.5);
  g.strokeStyle = goldGrad(g, x, y, x + w, y + h); g.lineWidth = 4; g.beginPath(); g.arc(x + w / 2, y + h * 0.14, w * 0.115, 0, T2); g.stroke();
  g.restore();
}
function buildTags(x: number, mobile: boolean): Station {
  void mobile;
  const group = new THREE.Group(); group.position.x = x; table(group);
  const emerald = std(0x0f5c4d, 0.45, 0.1);
  group.add(box(10.4, 0.1, 3.9, std(0x1d2e29, 0.45, 0.2), 0.3, 0.55, 0));
  const SY = 0.64, SW = 4.6, SD = 3.3, HX = -2.2, PX = 2.4;
  // clipping plane: keep x > head
  const printClip = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const [sc, sg] = cv(920, 660);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) drawTagInk(sg, 20 + i * 220 + 0, 10 + j * 320 + 0, 190, 290, i + j);
  const sheetTex = tex(sc);
  const sheet = new THREE.Group(); sheet.position.set(-7.5, SY, 0);
  sheet.add(box(SW, 0.04, SD, std(0xf8f4ec, 0.8), 0, 0, 0));
  const ink = flat(SW, SD, new THREE.MeshStandardMaterial({ map: sheetTex, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, clippingPlanes: [printClip] }), 0, 0.022, 0);
  sheet.add(ink); group.add(sheet);

  // print bridge
  for (const s of [-1, 1]) group.add(box(0.36, 1.3, 0.36, emerald, HX, 1.2, s * 2.1));
  group.add(box(0.6, 0.3, 4.6, std(0xf3ecd9, 0.5), HX, 1.95, 0));
  const printBar = box(0.16, 0.12, 3.5, std(0x7b1e2b, 0.4, 0.2), HX, 1.5, 0); group.add(printBar);
  const feed = roller(0.16, 3.8, std(0x232826, 0.7), -4.1, 0.78, 0); group.add(feed);
  // die-cut press
  const pillarX = [-0.3, 5.1];
  for (const px of pillarX) for (const s of [-1, 1]) group.add(box(0.34, 2.4, 0.34, emerald, px, 1.7, s * 2.1));
  group.add(box(5.8, 0.34, 0.5, std(0xf3ecd9, 0.5), 2.4, 2.75, 2.1), box(5.8, 0.34, 0.5, std(0xf3ecd9, 0.5), 2.4, 2.75, -2.1));
  const platen = new THREE.Group(); platen.position.set(PX, 1.8, 0);
  platen.add(box(4.9, 0.22, 3.5, steel(), 0, 0, 0), box(4.92, 0.05, 3.52, gold(), 0, -0.13, 0));
  for (const dx of [-1.6, 1.6]) { const rod = roller(0.1, 1.2, steel(), dx, 0.7, 0); rod.rotation.x = Math.PI / 2; platen.add(rod); }
  group.add(platen);

  // tags
  const tagShape = new THREE.Shape(); const tw = 0.95, th = 1.45, c = 0.2;
  tagShape.moveTo(-tw / 2 + c, th / 2); tagShape.lineTo(tw / 2 - c, th / 2); tagShape.lineTo(tw / 2, th / 2 - c);
  tagShape.lineTo(tw / 2, -th / 2); tagShape.lineTo(-tw / 2, -th / 2); tagShape.lineTo(-tw / 2, th / 2 - c); tagShape.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0.56, 0.07, 0, T2, true); tagShape.holes.push(hole);
  const tagGeo = new THREE.ExtrudeGeometry(tagShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
  tagGeo.translate(0, 0, -0.025);
  const tagMatBody = std(0xf8f4ec, 0.8);
  const eyeletMat = gold();
  const curve = new THREE.CatmullRomCurve3([new V(0, 0.56, 0.03), new V(0.14, 0.9, 0.1), new V(0.1, 1.2, 0.14), new V(-0.02, 1.34, 0.1), new V(-0.2, 1.1, 0.05), new V(-0.08, 0.78, 0.02), new V(0, 0.56, 0.0)]);
  const tags = Array.from({ length: 8 }, (_, n) => {
    const i = n % 4, j = Math.floor(n / 4);
    const g = new THREE.Group();
    g.add(shade(new THREE.Mesh(tagGeo, tagMatBody)));
    const [tc, tg] = cv(190, 290); drawTagInk(tg, 0, 0, 190, 290, i + j);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(tw, th), new THREE.MeshStandardMaterial({ map: tex(tc), transparent: true, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }));
    face.position.z = 0.034; g.add(face);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 14, 32), eyeletMat); eye.position.set(0, 0.56, 0.03); eye.castShadow = true; g.add(eye);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.012, 6), std(0xe9dcc0, 0.95)); g.add(tube);
    g.visible = false; group.add(g);
    return { g, eye, tube, i, j, n };
  });
  const tubeIdx = tags[0].tube.geometry.index!.count;

  return {
    x, group, update(t) {
      // sheet travel
      const a = eio(seg(t, 0, 3.2)), b = eio(seg(t, 3.2, 4.5));
      const cx = t < 3.2 ? lerp(-7.5, 0.2, a) : lerp(0.2, PX, b);
      sheet.position.x = cx; printClip.constant = -HX;
      feed.rotation.z = (-cx * 1.5) / 0.16;
      const pressDown = eio(seg(t, 4.6, 5.05)) - eio(seg(t, 5.4, 5.9));
      platen.position.y = lerp(1.8, 0.88, clamp(pressDown));
      printBar.position.y = 1.5 - 0.05 * Math.abs(Math.sin(t * 6));
      const swap = t >= 5.45;
      sheet.visible = !swap;
      tags.forEach(tg => {
        tg.g.visible = swap;
        if (!swap) return;
        const { i, j, n } = tg;
        const sep = eio(seg(t, 5.5, 7.0)), lean = eio(seg(t, 6.0, 7.4));
        const bx = PX + (i - 1.5) * 1.1, bz = (j - 0.5) * 1.6;
        const fx = 2.0 + (i - 1.5) * 1.3, fz = (j - 0.5) * 1.5 + 0.3;
        tg.g.position.set(lerp(bx, fx, sep), lerp(SY, 1.05 + j * 0.25 + Math.sin(t * 1.3 + n) * 0.04 * sep, sep), lerp(bz, fz, sep));
        tg.g.rotation.set(-Math.PI / 2 + 0.75 * lean, 0, Math.sin(t * 0.9 + n) * 0.03 * lean);
        const e = eo(seg(t, 6.7 + n * 0.12, 7.4 + n * 0.12));
        tg.eye.scale.setScalar(Math.max(0.001, e));
        tg.tube.geometry.setDrawRange(0, Math.floor(((tubeIdx * eio(seg(t, 7.3 + n * 0.1, 8.8))) / 6)) * 6);
      });
    },
    cam: path([
      { t: 0, p: [0.6, 5.8, 12], l: [0.6, 0.7, 0], h: 5.8 },
      { t: 5.2, p: [1.2, 5.0, 10.5], l: [1.6, 0.7, 0], h: 5.2 },
      { t: 8.5, p: [2.2, 3.4, 8], l: [2.0, 1.0, 0], h: 3.4 },
    ]),
  };
}
const V = THREE.Vector3;

/* =================== STATION 3 — printed & woven labels =================== */
function buildLabels(x: number, mobile: boolean): Station {
  void mobile;
  const group = new THREE.Group(); group.position.x = x; table(group);
  group.add(box(9.2, 0.1, 4.2, std(0x1d2e29, 0.45, 0.2), 0.7, 0.55, 0));
  const P = 1.5, X0 = -5.2, CUT = 2.3, L = CUT - X0, WD = 1.1, V_ = 0.8, Y = 0.64, HX = -2.6;
  const emerald = std(0x0f5c4d, 0.45, 0.1);
  const lanes = [{ z: 1.05, woven: false }, { z: -1.05, woven: true }];

  const mk = (woven: boolean) => {
    const [bc, bg] = cv(300, 220), [oc, og] = cv(300, 220);
    if (!woven) {
      bg.fillStyle = '#F2ECDC'; bg.fillRect(0, 0, 300, 220);
      for (let y = 0; y < 220; y += 3) { bg.fillStyle = `rgba(255,255,255,${0.1 + 0.08 * Math.sin(y)})`; bg.fillRect(0, y, 300, 1); }
      bg.fillStyle = 'rgba(0,0,0,.05)'; bg.fillRect(0, 0, 300, 5); bg.fillRect(0, 215, 300, 5);
      og.textAlign = 'center'; og.textBaseline = 'middle';
      og.fillStyle = '#7B1E2B'; og.font = '700 52px Cinzel, serif'; og.fillText('ATELIER', 150, 85);
      og.fillStyle = '#0F5C4D'; og.fillRect(60, 118, 180, 3);
      og.font = '600 19px "Plus Jakarta Sans", sans-serif'; og.fillText('100% COTTON', 150, 145); og.fillText('SIZE  M', 150, 172);
    } else {
      bg.fillStyle = '#0F5C4D'; bg.fillRect(0, 0, 300, 220);
      for (let y = 0; y < 220; y += 2) for (let xx = (y % 4) ? 0 : 2; xx < 300; xx += 4) { bg.fillStyle = (xx / 2 + y) % 3 ? '#157360' : '#0a4a3e'; bg.fillRect(xx, y, 3, 2); }
      bg.fillStyle = '#F8F4EC'; bg.fillRect(0, 0, 300, 7); bg.fillRect(0, 213, 300, 7);
      og.strokeStyle = goldGrad(og, 0, 0, 300, 220); og.lineWidth = 4; og.strokeRect(24, 26, 252, 168);
      og.fillStyle = goldGrad(og, 0, 0, 300, 220); og.textAlign = 'center'; og.textBaseline = 'middle';
      og.font = '700 50px Cinzel, serif'; og.fillText('ATELIER', 150, 90);
      og.font = '600 18px "Plus Jakarta Sans", sans-serif'; og.fillText('W O V E N   L A B E L', 150, 140);
      og.globalCompositeOperation = 'destination-out'; og.fillStyle = 'rgba(0,0,0,.4)';
      for (let y = 0; y < 220; y += 3) og.fillRect(0, y, 300, 1);
    }
    return { bc, oc };
  };

  const labelGeo = new THREE.BoxGeometry(P, 0.035, WD);
  const lanesObj = lanes.map(ln => {
    const { bc, oc } = mk(ln.woven);
    const bt = tex(bc, true), ot = tex(oc, true);
    [bt, ot].forEach(t => t.repeat.set(L / P, 1));
    const baseMat = new THREE.MeshStandardMaterial({ map: bt, roughness: ln.woven ? 0.95 : 0.35, metalness: 0, bumpMap: ln.woven ? bt : null, bumpScale: 1.4 });
    group.add(flat(L, WD, baseMat, X0 + L / 2, Y, ln.z));
    const clip = new THREE.Plane(new THREE.Vector3(1, 0, 0), -HX);
    group.add(flat(L, WD, new THREE.MeshStandardMaterial({ map: ot, transparent: true, roughness: ln.woven ? 0.4 : 0.5, metalness: ln.woven ? 0.6 : 0, polygonOffset: true, polygonOffsetFactor: -2, clippingPlanes: [clip] }), X0 + L / 2, Y + 0.002, ln.z));
    // supply spool
    const sp = new THREE.Group(); sp.position.set(X0, Y + 0.55, ln.z);
    sp.add(roller(0.55, WD + 0.1, std(ln.woven ? 0x0f5c4d : 0xf2ecdc, 0.85)), roller(0.18, WD + 0.4, std(0xb58a3c, 0.4, 0.8)));
    const mark = box(0.05, 0.03, WD + 0.12, std(ln.woven ? 0xf8f4ec : 0x7b1e2b, 0.6), 0.56, 0, 0); sp.add(mark); group.add(sp);
    // head: ink module vs loom reed
    const head = new THREE.Group(); head.position.set(HX, 1.25, ln.z);
    if (!ln.woven) head.add(box(0.5, 0.45, WD + 0.4, std(0x7b1e2b, 0.4, 0.2)), box(0.2, 0.1, WD, std(0x1d2e29, 0.4), 0, -0.28, 0));
    else { head.add(box(0.5, 0.2, WD + 0.4, std(0xf3ecd9, 0.5)), box(0.04, 0.4, WD + 0.4, gold(), -0.2, -0.2, 0)); for (let q = 0; q < 14; q++) head.add(box(0.02, 0.32, 0.015, gold(), 0.1, -0.22, -WD / 2 + q * (WD / 13))); }
    group.add(head);
    // pooled cut pieces
    const [pc, pg] = cv(300, 220); pg.drawImage(bc, 0, 0); pg.drawImage(oc, 0, 0);
    const pt = tex(pc);
    const pieces = Array.from({ length: 5 }, (_, n) => {
      const m = shade(new THREE.Mesh(labelGeo, [std(ln.woven ? 0x0a4a3e : 0xe8e0cc, 0.9), std(0x0, 1), std(0xe8e0cc, 0.9), std(0xe8e0cc, 0.9), new THREE.MeshStandardMaterial({ map: pt, roughness: ln.woven ? 0.9 : 0.4, bumpMap: ln.woven ? pt : null, bumpScale: 1.2 }), std(0xe8e0cc, 0.9)]));
      m.visible = false; group.add(m); return { m, n };
    });
    return { ln, bt, ot, sp, head, pieces };
  });

  const guide = roller(0.16, 4.3, std(0x232826, 0.7), -4.0, 0.78, 0); group.add(guide);
  const guide2 = roller(0.16, 4.3, std(0x232826, 0.7), 0.9, 0.78, 0); group.add(guide2);
  for (const s of [-1, 1]) {
    group.add(box(0.36, 1.3, 0.36, emerald, HX, 1.2, s * 2.3));
    group.add(box(0.36, 2.0, 0.36, emerald, CUT + 0.05, 1.5, s * 2.3));
  }
  group.add(box(0.5, 0.3, 4.9, std(0xf3ecd9, 0.5), HX, 1.9, 0), box(0.5, 0.3, 4.9, std(0xf3ecd9, 0.5), CUT + 0.05, 2.5, 0));
  const blade = box(0.06, 0.45, 4.0, steel(), CUT + 0.05, 1.7, 0); group.add(blade);

  return {
    x, group, update(t) {
      const off = -(V_ * t) / P;
      lanesObj.forEach(o => {
        o.bt.offset.x = off; o.ot.offset.x = off;
        o.sp.rotation.z = (V_ * t) / 0.55;
        o.head.position.y = 1.25 - 0.1 * Math.pow(Math.abs(Math.sin((Math.PI * V_ * t) / P)), 3);
        o.pieces.forEach(p => {
          const ts = p.n * (P / V_);
          p.m.visible = t >= ts;
          if (!p.m.visible) return;
          const free = CUT - P / 2 + V_ * (t - ts), pile = 3.7 + p.n * 0.38 + (o.ln.woven ? 0.05 : 0);
          const arr = free >= pile;
          p.m.position.set(Math.min(free, pile), Y + 0.025 + (arr ? p.n * 0.032 : 0.0) + 0.01, o.ln.z + (arr ? (p.n % 2 ? 0.05 : -0.05) : 0));
          p.m.rotation.y = arr ? (p.n % 2 ? 0.05 : -0.04) * eo(seg(free, pile, pile + 0.001)) : 0;
        });
      });
      guide.rotation.z = (V_ * t) / 0.16; guide2.rotation.z = (V_ * t) / 0.16;
      const cutPhase = ((V_ * t) / P) % 1;
      const d = Math.min(cutPhase, 1 - cutPhase); // near boundary => blade down
      blade.position.y = lerp(1.7, 0.7, clamp(1 - d / 0.07));
    },
    cam: path([
      { t: 0, p: [0.6, 5.6, 11.8], l: [0.5, 0.7, 0], h: 5.9 },
      { t: 5, p: [1.2, 4.6, 9.8], l: [1.6, 0.7, 0], h: 4.8 },
      { t: 9, p: [2.4, 3.8, 8.6], l: [3.2, 0.8, 0], h: 3.6 },
    ]),
  };
}

/* =================== STATION 4 — business cards + foil =================== */
function buildCards(x: number, mobile: boolean): Station {
  void mobile;
  const group = new THREE.Group(); group.position.x = x; table(group);
  const emerald = std(0x0f5c4d, 0.45, 0.1), dark = std(0x0b3d33, 0.5, 0.2);
  const CW = 2.6, CD = 1.5, TH = 0.06;
  const faces = [{ bg: '#F8F4EC', ink: '#7B1E2B' }, { bg: '#0F5C4D', ink: '#F8F4EC' }, { bg: '#7B1E2B', ink: '#F8F4EC' }];
  const mkFace = (f: { bg: string; ink: string }) => {
    const [c, g] = cv(520, 300); g.fillStyle = f.bg; g.fillRect(0, 0, 520, 300);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${i % 2 ? '255,255,255' : '0,0,0'},.03)`; g.fillRect(Math.random() * 520, Math.random() * 300, 2, 2); }
    g.fillStyle = f.ink; g.textAlign = 'right'; g.font = '600 24px "Plus Jakarta Sans", sans-serif'; g.fillText('NAME SURNAME', 480, 222);
    g.font = '400 17px "Plus Jakarta Sans", sans-serif'; g.fillText('Position · Department', 480, 250); g.fillText('+00 000 0000000', 480, 274);
    const [fc, fg] = cv(520, 300);
    fg.strokeStyle = goldGrad(fg, 0, 0, 520, 300); fg.lineWidth = 4; fg.strokeRect(18, 18, 484, 264);
    fg.fillStyle = goldGrad(fg, 0, 0, 520, 300); fg.font = '700 96px Cinzel, serif'; fg.textAlign = 'left'; fg.textBaseline = 'alphabetic'; fg.fillText('JSA', 44, 120);
    fg.font = '500 20px "Plus Jakarta Sans", sans-serif'; fg.fillText('PRINTING SOLUTIONS', 48, 156);
    return { face: tex(c), foil: tex(fc) };
  };
  const edge = std(0xefe6d2, 0.9);
  const mkCard = (f: { bg: string; ink: string }, withFoil: boolean) => {
    const { face, foil } = mkFace(f);
    const g = new THREE.Group();
    g.add(shade(new THREE.Mesh(new THREE.BoxGeometry(CW, TH, CD), [edge, edge, new THREE.MeshStandardMaterial({ map: face, roughness: 0.75 }), edge, edge, edge])));
    // BoxGeometry: +y face is index 2
    let fm: THREE.MeshStandardMaterial | null = null;
    if (withFoil) {
      fm = new THREE.MeshStandardMaterial({ map: foil, transparent: true, opacity: 0, metalness: 1, roughness: 0.25, bumpMap: foil, bumpScale: 3, polygonOffset: true, polygonOffsetFactor: -2 });
      const p = flat(CW, CD, fm, 0, TH / 2 + 0.001, 0); g.add(p);
    }
    return { g, fm };
  };
  // left stack (base) + right area
  const LX = -3.9, RX = 4.0, BX = 0.3;
  for (let i = 0; i < 5; i++) { const c = mkCard(faces[(i + 1) % 3], false); c.g.position.set(LX + (i % 2) * 0.01, 0.5 + TH / 2 + i * TH, 0); group.add(c.g); }
  const active = faces.map((f, i) => { const c = mkCard(f, true); group.add(c.g); return { ...c, i }; });

  // press
  group.add(box(3.4, 0.18, 2.2, dark, BX, 0.59, 0));
  for (const px of [BX - 1.7, BX + 1.7]) for (const s of [-1, 1]) group.add(box(0.3, 2.1, 0.3, emerald, px, 1.5, s * 1.3));
  group.add(box(3.7, 0.4, 3.1, std(0xf3ecd9, 0.5), BX, 2.7, 0), box(3.72, 0.05, 3.12, gold(), BX, 2.48, 0));
  const platen = new THREE.Group(); platen.position.set(BX, 1.75, 0);
  platen.add(box(2.0, 0.28, 1.4, steel(), 0, 0, 0), box(2.02, 0.04, 1.42, gold(), 0, -0.15, 0));
  const piston = roller(0.12, 0.9, steel(), 0, 0.55, 0); piston.rotation.x = Math.PI / 2; platen.add(piston);
  group.add(platen);
  const foilStrip = box(3.7, 0.006, 1.25, std(0xd8b25a, 0.15, 1), BX, 1.05, 0); group.add(foilStrip);
  const spools = [-1.9, 1.9].map(dx => { const s = roller(0.2, 1.3, std(0xb58a3c, 0.35, 0.9), BX + dx, 1.05, 0); group.add(s); return s; });

  const T0 = 0.6, GAP = 2.4;
  const finalY = (i: number) => 0.5 + TH / 2 + i * TH;
  return {
    x, group, update(t) {
      let press = 0;
      active.forEach(a => {
        const ts = T0 + a.i * GAP, stackY = 0.5 + TH / 2 + (5 + (2 - a.i)) * TH;
        const s1 = eio(seg(t, ts, ts + 0.9)), s2 = eio(seg(t, ts + 1.75, ts + 2.65));
        const bedY = 0.68 + TH / 2 + 0.001;
        const px = t < ts + 1.75 ? lerp(LX, BX, s1) : lerp(BX, RX, s2);
        let py = t < ts + 1.75 ? lerp(stackY, bedY, s1) + Math.sin(Math.PI * s1) * 0.25 : lerp(bedY, finalY(a.i), s2) + Math.sin(Math.PI * s2) * 0.25;
        if (t < ts) py = stackY;
        a.g.position.set(px, py, 0);
        press = Math.max(press, eio(seg(t, ts + 0.95, ts + 1.3)) - eio(seg(t, ts + 1.45, ts + 1.85)));
        if (a.fm) a.fm.opacity = eio(seg(t, ts + 1.35, ts + 1.75));
      });
      platen.position.y = lerp(1.75, 0.88, clamp(press));
      spools.forEach(s => { s.rotation.z = t * 0.5; });
      foilStrip.position.y = 1.05 - 0.2 * clamp(press) * 0.0;
    },
    cam: path([
      { t: 0, p: [0.0, 5.2, 11.4], l: [0.1, 0.8, 0], h: 5.7 },
      { t: 5.0, p: [0.4, 4.4, 9.2], l: [0.6, 0.8, 0], h: 4.6 },
      { t: 8.2, p: [3.9, 2.5, 4.6], l: [3.9, 0.7, 0], h: 2.1 },
      { t: 9.5, p: [4.3, 2.0, 3.6], l: [4.0, 0.7, 0], h: 1.7 },
    ]),
  };
}

/* =================== STATION 5 — sticker showcase =================== */
function buildShowcase(x: number, mobile: boolean): Station {
  void mobile;
  const group = new THREE.Group(); group.position.x = x; table(group);
  const emerald = std(0x0f5c4d, 0.45, 0.1), ivory = std(0xf3ecd9, 0.55);
  // machine (partially visible, back of the scene)
  group.add(box(10, 2.9, 2.2, emerald, 0.5, 1.95, -3.3), box(10.02, 0.12, 2.22, gold(), 0.5, 1.1, -3.3), box(10.02, 0.18, 2.22, ivory, 0.5, 3.45, -3.3));
  group.add(box(5.1, 0.2, 0.14, std(0x050505, 0.8), 0, 0.68, -2.17));
  group.add(box(2.2, 0.9, 0.08, ivory, 3.4, 2.25, -2.18), box(1.9, 0.5, 0.04, std(0x143a32, 0.3, 0.2), 3.4, 2.3, -2.12));
  for (let i = 0; i < 4; i++) group.add(box(0.1, 0.1, 0.04, i % 2 ? gold() : std(0xe4572e, 0.4), 2.7 + i * 0.3, 1.85, -2.14));
  // top rollers peeking out
  group.add(roller(0.28, 5.6, steel(), 0, 3.7, -3.3));

  const SWD = 4.2, SLN = 3.0, CLIP = -2.17;
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, 1), -CLIP);
  const [lc, lg] = cv(840, 600); lg.fillStyle = '#f7f7f1'; lg.fillRect(0, 0, 840, 600);
  lg.strokeStyle = '#d6d6cc'; lg.lineWidth = 2;
  for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) rr(lg, (c + 0.5) * 204 - 90 + 6, 3 + r * 196 + 8, 180, 180, 16), lg.stroke();
  const sheet = new THREE.Group(); sheet.position.set(0, 0.55, -3.7);
  sheet.add(box(SWD, 0.02, SLN, new THREE.MeshStandardMaterial({ map: tex(lc), roughness: 0.5, clippingPlanes: [clip] }), 0, 0, 0));
  const stTex = Array.from({ length: 6 }, (_, i) => stickerTexture(i));
  const peelOrder = [1, 6, 8, 3, 10];
  const targets: [number, number, number][] = [[-3.1, 0.2, 0.4], [3.1, 0.1, -0.5], [-2.4, 1.9, 0.3], [2.2, 2.0, -0.4], [0.2, 2.4, 0.2]];
  const stickers = Array.from({ length: 12 }, (_, k) => {
    const c = k % 4, r = Math.floor(k / 4);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: stTex[k % 6], transparent: true, alphaTest: 0.4, roughness: 0.3, side: THREE.DoubleSide, clippingPlanes: [clip] }));
    m.castShadow = true; m.receiveShadow = true;
    const hx = (c - 1.5) * 1.02, hz = (r - 1) * 0.98; m.position.set(hx, 0.014, hz); m.rotation.x = -Math.PI / 2; sheet.add(m);
    return { m, hx, hz, peel: peelOrder.indexOf(k) };
  });
  group.add(sheet);
  // finished roll at right with a printed flap
  const [rc, rg] = cv(768, 256); rg.fillStyle = '#fbfbf7'; rg.fillRect(0, 0, 768, 256); for (let i = 0; i < 3; i++) drawSticker(rg, 18 + i * 250, 18, 220, 220, i + 3);
  const rollG = new THREE.Group(); rollG.position.set(4.5, 0.5 + 0.55, 0.9);
  rollG.add(roller(0.55, 1.5, std(0xfbfbf6, 0.85)), roller(0.2, 1.6, emerald));
  group.add(rollG);
  const flap = flat(2.2, 0.73, new THREE.MeshStandardMaterial({ map: tex(rc), roughness: 0.4 }), 3.3, 0.52, 0.9 + 0.55 + 0.05); group.add(flap);
  rollG.rotation.z = 0.0;

  return {
    x, group, update(t) {
      const feed = eio(seg(t, 0.2, 3.4)), push = eio(seg(t, 3.6, 4.8));
      sheet.position.z = t < 3.6 ? lerp(-3.7, -0.7, feed) : lerp(-0.7, 0.8, push);
      sheet.position.y = 0.55;
      stickers.forEach(s => {
        if (s.peel < 0) return;
        const u = eio(seg(t, 5.2 + s.peel * 0.45, 6.8 + s.peel * 0.45));
        const [tx, tz, rot] = targets[s.peel];
        s.m.position.set(lerp(s.hx, tx, u), 0.014 + Math.sin(Math.PI * u) * 0.65, lerp(s.hz, tz, u));
        s.m.rotation.set(-Math.PI / 2 + Math.sin(Math.PI * u) * 0.7, 0, rot * u);
      });
      rollG.rotation.z = Math.max(0, t - 7) * 0.0;
    },
    cam: path([
      { t: 0, p: [0.2, 3.4, 6.6], l: [0.2, 0.9, -1.8], h: 3.5 },
      { t: 3.4, p: [0.3, 3.6, 7.0], l: [0.3, 0.8, -0.6], h: 3.6 },
      { t: 5.0, p: [0.2, 4.4, 6.4], l: [0.2, 0.5, 0.6], h: 3.4 },
      { t: 8.0, p: [1.4, 5.2, 9.2], l: [0.9, 0.5, 0.0], h: 5.4 },
    ]),
  };
}

/* ======================= React wrapper ======================= */
export default function Hero3D({ index, onFail }: { index: number; onFail: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const goto = useRef<(i: number) => void>(() => undefined);
  const lastIndex = useRef(0);

  useEffect(() => {
    const el = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { onFail(); return; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
    const FOV = 34, camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
    const key = new THREE.DirectionalLight(0xfff0d8, 2.4); key.castShadow = true; key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 8, bottom: -8, near: 1, far: 40 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    scene.add(key, key.target, new THREE.AmbientLight(0xffffff, 0.35));
    const fill = new THREE.PointLight(0x4fd1b4, 30, 40); scene.add(fill);

    const stations: Station[] = [buildStickerPress, buildTags, buildLabels, buildCards, buildShowcase].map((b, i) => b(i * SPACING, mobile));
    stations.forEach(s => scene.add(s.group));

    // state
    const clock = new THREE.Clock();
    let cur = 0, prev = -1, switchAt = -10, enterAt = 0.5, prevEnter = 0;
    const camP = new V(), camL = new V();
    let fadeTimer = 0;
    let W = 1, H = 1, stacked = false;

    const fit = () => {
      W = el.clientWidth; H = el.clientHeight || 1; stacked = window.innerWidth <= 980;
      renderer.setSize(W, H); camera.aspect = W / H;
      if (stacked) camera.clearViewOffset(); else camera.setViewOffset(W, H, -W * 0.2, 0, W, H);
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);

    const place = (i: number, t: number) => {
      const s = stations[i], c = s.cam(t);
      const p = new V(...c.p), l = new V(...c.l); p.x += s.x; l.x += s.x;
      const frac = stacked ? 1 : 0.6, halfW = c.h * (stacked ? 0.82 : 1);
      const need = (halfW * 1.08) / (Math.tan((FOV * Math.PI) / 360) * camera.aspect * frac);
      const dir = p.clone().sub(l), len = dir.length();
      if (len < need) p.copy(l).add(dir.multiplyScalar(need / len));
      return { p, l, h: c.h };
    };
    camP.set(...place(0, 0).p.toArray() as V3); camL.set(...place(0, 0).l.toArray() as V3);

    goto.current = (i: number) => {
      if (i === cur) return;
      const now = clock.getElapsedTime();
      const wrap = Math.abs(i - cur) > 1;
      const delay = reduced ? 0.05 : 0.9;
      prev = cur; prevEnter = enterAt; cur = i;
      if (wrap || reduced) {
        renderer.domElement.style.opacity = '0';
        window.clearTimeout(fadeTimer);
        fadeTimer = window.setTimeout(() => {
          const t0 = place(i, 0); camP.copy(t0.p); camL.copy(t0.l);
          switchAt = -10; prev = -1; enterAt = clock.getElapsedTime() + 0.2;
          renderer.domElement.style.opacity = '1';
        }, 420);
        enterAt = now + 10;
      } else { switchAt = now; enterAt = now + delay; }
    };

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }); io.observe(el);
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) { return; }
      const now = clock.getElapsedTime();
      const lt = Math.max(0, now - enterAt);
      stations[cur].update(Math.min(lt, DURATIONS[cur] + 1));
      if (prev >= 0 && now - switchAt < 1.6) stations[prev].update(Math.max(0, now - prevEnter));
      const tg = place(cur, lt);
      const k = eio(clamp((now - switchAt) / 1.4));
      if (switchAt > 0 && now - switchAt < 1.4) {
        const from = fromState;
        camP.copy(from.p).lerp(tg.p, k); camP.y += Math.sin(k * Math.PI) * 1.4; camL.copy(from.l).lerp(tg.l, k);
      } else { camP.copy(tg.p); camL.copy(tg.l); fromState.p.copy(camP); fromState.l.copy(camL); }
      camera.position.copy(camP); camera.lookAt(camL);
      key.position.set(camL.x + 5, 9, 7); key.target.position.set(camL.x, 0, 0); key.target.updateMatrixWorld();
      fill.position.set(camL.x - 7, 3, -3);
      renderer.render(scene, camera);
    };
    const fromState = { p: camP.clone(), l: camL.clone() };
    // capture the camera pose at the moment of a switch
    const baseGoto = goto.current;
    goto.current = (i: number) => { fromState.p.copy(camP); fromState.l.copy(camL); baseGoto(i); };
    loop();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.clearTimeout(fadeTimer);
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => x.dispose());
      });
      pm.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [onFail]);

  useEffect(() => { if (lastIndex.current !== index) { lastIndex.current = index; goto.current(index); } }, [index]);

  return <div className="hero3d" ref={mount} aria-hidden="true" />;
}
