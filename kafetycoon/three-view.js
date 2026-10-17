// Köşe Kafe Tycoon: 3B görünümler (kafe ve şehir).
// Three.js, depodaki sabit sürümden (vendor/three) yüklenir. Dışarıdan hiçbir model, doku veya betik çekilmez.
// Oyun durumunu yalnızca okur; hiçbir şeyi değiştirmez.
import * as THREE from 'three';

const U = 20;            // 1 birim = 20 piksel (2B sahnenin ölçeği)
const MACH_COL = ['#aeb4bd', '#c9a36a', '#d28a3c', '#e6b94a', '#5fb7d9', '#b07ae0', '#f0f0f0'];

/* ---------- Ortak yardımcılar ---------- */
const matCache = new Map();
function mat(color) {
  let m = matCache.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); matCache.set(color, m); }
  return m;
}
function ghost(color, opacity) {
  const key = 'g' + color + opacity;
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }); matCache.set(key, m); }
  return m;
}
function add(parent, geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function box(parent, w, h, d, color, x, y, z) { return add(parent, new THREE.BoxGeometry(w, h, d), mat(color), x, y, z); }
function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    ms.forEach((m) => { if (m.map) m.dispose(); });
  });
  (g.userData.tex || []).forEach((t) => t.dispose());
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function shared(geo) { geo.userData.shared = true; return geo; }

const G = {
  torso: shared(new THREE.CapsuleGeometry(0.27, 0.5, 4, 8)),
  head: shared(new THREE.SphereGeometry(0.25, 12, 10)),
  hair: shared(new THREE.SphereGeometry(0.265, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
  leg: shared(new THREE.BoxGeometry(0.15, 0.45, 0.17)),
  shadow: shared(new THREE.CircleGeometry(0.42, 16)),
  cup: shared(new THREE.CylinderGeometry(0.07, 0.055, 0.14, 8)),
  star: shared(new THREE.OctahedronGeometry(0.17)),
  warn: shared(new THREE.SphereGeometry(0.1, 8, 6)),
};

/* ---------- Ana fonksiyon ---------- */
export function createView3D(canvas, bridge, options = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    throw new Error('WebGL kullanılamıyor');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1.1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b5a48, 1.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(-6, 12, 8);
  scene.add(sun);
  const bgColor = new THREE.Color();
  scene.background = bgColor;

  // Yağmur (yağmurlu gün olayında şehir görünümünde)
  const rain = (() => {
    const n = 160, pos = new Float32Array(n * 6), seed = [];
    for (let i = 0; i < n; i++) seed.push([(Math.random() - 0.5) * 22, Math.random() * 8, (Math.random() - 0.5) * 14]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.5 }));
    ls.frustumCulled = false; ls.visible = false;
    scene.add(ls);
    return { ls, pos, seed, n };
  })();

  let mode = 'cafe';
  let autoCamera = options.autoCamera !== false;
  let cafeGroup = null, cityGroup = null, cafeSig = '', citySig = '';
  const dyn = { baristas: [], steam: [], cars: [], heli: null, yacht: null };
  const custMap = new Map();
  const customerLayer = new THREE.Group();
  scene.add(customerLayer);

  function fit(widthU, depthU, heightU, elevDeg, lookY, lookZ) {
    const elev = THREE.MathUtils.degToRad(elevDeg);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const needV = (depthU * Math.sin(elev) + heightU * Math.cos(elev)) * 1.1;
    const needH = (widthU * 1.04) / camera.aspect;
    const dist = (Math.max(needV, needH) / 2) / Math.tan(fov / 2);
    camera.userData.base = { dist, elev, lookY, lookZ };
    placeCamera(0);
  }
  function placeCamera(sway) {
    const b = camera.userData.base;
    if (!b) return;
    camera.position.set(sway, Math.sin(b.elev) * b.dist + b.lookY, Math.cos(b.elev) * b.dist + b.lookZ);
    camera.lookAt(0, b.lookY, b.lookZ);
  }

  /* ---------- Kafe: sabit parçalar ---------- */
  function buildCafe() {
    const S = bridge.S, H = bridge.getH(), D = H / U;
    const wx = (x) => (x - 180) / U, wz = (y) => (y - H / 2) / U;
    const g = new THREE.Group();
    g.userData.tex = [];
    dyn.baristas = []; dyn.steam = [];

    const floorTex = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#8b6b4d'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#7a5c40'; c.lineWidth = 2;
      for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      for (let r = 0; r < 4; r++) { const x = (r % 2) * 64 + 32; c.beginPath(); c.moveTo(x, r * 32); c.lineTo(x, r * 32 + 32); c.stroke(); }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(18 / 3.2, D / 3.2);
    g.userData.tex.push(floorTex);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, D), new THREE.MeshLambertMaterial({ map: floorTex }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);

    // duvarlar
    box(g, 18.6, 2.8, 0.3, '#254540', 0, 1.4, -D / 2 - 0.15);
    box(g, 0.3, 2.0, D, '#2d504a', -9.15, 1.0, 0);
    box(g, 0.3, 2.0, D, '#2d504a', 9.15, 1.0, 0);
    box(g, 18.6, 0.5, 0.32, '#1d3834', 0, 0.25, -D / 2 - 0.14);

    // tabela (kafe adı)
    const label = String(S.name || 'Kafe').toLocaleUpperCase('tr');
    const signTex = canvasTex(512, 128, (c, w, h) => {
      c.fillStyle = '#e58a3d'; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 22); c.fill();
      c.fillStyle = '#2b1608'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 64;
      do { c.font = '800 ' + fs + 'px system-ui, sans-serif'; fs -= 4; } while (c.measureText(label).width > w - 48 && fs > 20);
      c.fillText(label, w / 2, h / 2 + 3);
    });
    g.userData.tex.push(signTex);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(wx(90), 2.0, -D / 2 + 0.02);
    g.add(sign);

    // tezgah
    box(g, 10, 0.95, 1.1, '#a86f3f', wx(130), 0.475, wz(86));
    box(g, 10.2, 0.1, 1.3, '#e8cfa6', wx(130), 1.0, wz(84));

    // baristalar ve makineler
    for (let i = 0; i < 3; i++) {
      const lx = bridge.LANES_X[i];
      if (i >= S.bar) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 20), ghost('#ffffff', 0.35));
        ring.rotation.x = -Math.PI / 2; ring.position.set(wx(lx - 8), 0.02, wz(62));
        g.add(ring);
        continue;
      }
      const m = box(g, 1.0, 0.9, 0.8, MACH_COL[Math.min(S.mach, 6)], wx(lx + 22), 1.5, wz(58));
      add(m, new THREE.SphereGeometry(0.1, 8, 6), mat('#e58a3d'), 0, 0.15, 0.42);
      const bar = new THREE.Group();
      add(bar, G.torso, mat('#f4f1ea'), 0, 0.95, 0);
      add(bar, new THREE.BoxGeometry(0.5, 0.55, 0.3), mat('#c0572e'), 0, 0.85, 0.12);
      add(bar, G.head, mat('#e0b48f'), 0, 1.62, 0);
      add(bar, G.hair, mat('#2b1d14'), 0, 1.64, 0);
      bar.position.set(wx(lx - 8), 0, wz(60));
      g.add(bar);
      dyn.baristas[i] = bar;
      const puffs = [];
      for (let k = 0; k < 2; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), ghost('#ffffff', 0.5));
        p.position.set(wx(lx + 20), 2.1, wz(58));
        p.visible = false; g.add(p); puffs.push(p);
      }
      dyn.steam[i] = puffs;
    }

    // pasta vitrini
    box(g, 3.8, 0.7, 1.0, '#a86f3f', wx(288), 0.35, wz(74));
    const glass = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.9, 0.9), ghost('#bfe6ff', S.cas ? 0.28 : 0.12));
    glass.position.set(wx(288), 1.15, wz(74));
    g.add(glass);
    const foodCols = ['#ff9ecd', '#e6b94a', '#c0572e', '#f4f1ea', '#7bd389', '#b388eb', '#ffb36b'];
    const foods = Math.min(S.cas ? 8 : 0, 8);
    for (let i = 0; i < foods; i++) {
      add(g, new THREE.SphereGeometry(0.2, 8, 6), mat(foodCols[i % 7]), wx(288) - 1.3 + (i % 4) * 0.85, 0.95 + Math.floor(i / 4) * 0.55, wz(74));
    }

    // masalar ve sandalyeler
    const cap = bridge.ROOMS[S.room].tabs;
    for (let t = 0; t < cap; t++) {
      const [px, py] = bridge.tablePos(t), x = wx(px), z = wz(py);
      if (t >= S.tab) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.12, 28), ghost('#ffffff', 0.3));
        ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z);
        g.add(ring);
        continue;
      }
      add(g, new THREE.CylinderGeometry(0.12, 0.12, 0.75, 8), mat('#c9a074'), x, 0.375, z);
      add(g, new THREE.CylinderGeometry(1.15, 1.15, 0.09, 24), mat('#ddb98a'), x, 0.78, z);
      for (const s of [-1, 1]) {
        const cx = x + s * 1.1;
        box(g, 0.6, 0.12, 0.6, '#3f7d73', cx, 0.5, z - 0.1);
        box(g, 0.6, 0.55, 0.1, '#3f7d73', cx, 0.8, z - 0.38);
        box(g, 0.08, 0.5, 0.08, '#2c5a52', cx - 0.24, 0.25, z - 0.1);
        box(g, 0.08, 0.5, 0.08, '#2c5a52', cx + 0.24, 0.25, z - 0.1);
      }
    }

    // dekor: bitkiler ve tablolar
    const plants = [[20, 128], [340, 128], [20, H - 24], [340, H - 24]];
    for (let j = 0; j < 4; j++) {
      if (S.dec <= j) continue;
      const x = wx(plants[j][0]), z = wz(plants[j][1]);
      add(g, new THREE.CylinderGeometry(0.4, 0.3, 0.55, 10), mat('#9b5a3a'), x, 0.28, z);
      for (let k = 0; k < 4; k++) add(g, new THREE.SphereGeometry(0.34, 8, 6), mat('#4fae6a'), x + (k - 1.5) * 0.18, 0.95 + (k % 2) * 0.3, z + (k % 2 ? 0.1 : -0.1));
    }
    if (S.dec >= 5) {
      const frameCols = ['#5fb7d9', '#e6b94a', '#b07ae0'];
      for (let i = 0; i < 3; i++) {
        box(g, 1.1, 1.3, 0.08, '#e8cfa6', wx(180 + i * 30 + 11), 2.1, -D / 2 + 0.05);
        box(g, 0.8, 1.0, 0.1, frameCols[i], wx(180 + i * 30 + 11), 2.1, -D / 2 + 0.07);
      }
    }
    // kapı paspası
    box(g, 2.8, 0.04, 0.6, '#3b2a1e', 0, 0.03, D / 2 - 0.35);

    // kafe sahibi (karakter sekmesindeki görünüm)
    const AVc = bridge.AV, av = S.avatar;
    if (AVc && av) {
      const o = new THREE.Group();
      const skin = AVc.skins[av.skin] || AVc.skins[0], hairC = AVc.hairs[av.hair] || AVc.hairs[0], shirt = (AVc.shirts[av.shirt] || AVc.shirts[0])[0];
      add(o, G.torso, mat(shirt), 0, 0.95, 0);
      add(o, new THREE.BoxGeometry(0.42, 0.5, 0.08), mat('#f4f1ea'), 0, 0.85, 0.24);
      add(o, G.head, mat(skin), 0, 1.62, 0);
      add(o, G.hair, mat(hairC), 0, 1.64, 0);
      if (av.hstyle === 1) { add(o, new THREE.BoxGeometry(0.1, 0.5, 0.3), mat(hairC), -0.25, 1.45, -0.05); add(o, new THREE.BoxGeometry(0.1, 0.5, 0.3), mat(hairC), 0.25, 1.45, -0.05); }
      if (av.hstyle === 2) add(o, new THREE.SphereGeometry(0.14, 8, 6), mat(hairC), 0, 1.95, 0);
      add(o, G.leg, mat('#2b2b3a'), -0.1, 0.22, 0); add(o, G.leg, mat('#2b2b3a'), 0.1, 0.22, 0);
      if (av.acc === 1) { for (const sx of [-0.1, 0.1]) { const t = add(o, new THREE.TorusGeometry(0.07, 0.014, 6, 12), mat('#2b2b3a'), sx, 1.65, 0.24); t.rotation.y = 0; } }
      if (av.acc === 2) add(o, new THREE.CylinderGeometry(0.3, 0.3, 0.14, 12), mat('#c0572e'), 0, 1.3, 0);
      if (av.acc === 3) { add(o, new THREE.TorusGeometry(0.27, 0.025, 6, 14, Math.PI), mat('#2b2b3a'), 0, 1.66, 0); add(o, new THREE.SphereGeometry(0.07, 6, 6), mat('#2b2b3a'), -0.27, 1.62, 0); add(o, new THREE.SphereGeometry(0.07, 6, 6), mat('#2b2b3a'), 0.27, 1.62, 0); }
      if (av.hat === 1) { add(o, new THREE.CylinderGeometry(0.27, 0.28, 0.14, 12), mat('#e5634d'), 0, 1.9, 0); add(o, new THREE.BoxGeometry(0.3, 0.03, 0.22), mat('#e5634d'), 0, 1.84, 0.25); }
      if (av.hat === 2) { add(o, new THREE.CylinderGeometry(0.24, 0.22, 0.3, 12), mat('#f4f1ea'), 0, 2.0, 0); add(o, new THREE.SphereGeometry(0.3, 10, 8), mat('#f4f1ea'), 0, 2.25, 0); }
      if (av.hat === 3) { add(o, new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12), mat('#1a1a22'), 0, 2.08, 0); add(o, new THREE.CylinderGeometry(0.34, 0.34, 0.04, 14), mat('#1a1a22'), 0, 1.9, 0); }
      if (av.hat === 4) { add(o, new THREE.CylinderGeometry(0.26, 0.24, 0.22, 5), mat('#ffd23f'), 0, 1.98, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(o, new THREE.ConeGeometry(0.06, 0.16, 5), mat('#ffd23f'), Math.cos(a) * 0.25, 2.17, Math.sin(a) * 0.25); } }
      add(o, G.shadow, ghost('#000000', 0.25), 0, 0.012, 0).rotation.x = -Math.PI / 2;
      o.position.set(wx(238), 0, wz(118));
      g.add(o);
    }
    return g;
  }

  /* ---------- Şehir ---------- */
  const CITY_Z = (y) => (y - 125) / U;
  const CITY_X = (x) => (x - 180) / U;

  function building(parent, texList, xPx, basePx, wPx, hPx, color, roof) {
    const w = wPx / U, h = hPx / U, d = Math.max(1.4, w * 0.85);
    const x = CITY_X(xPx), z = CITY_Z(basePx) - d / 2;
    const rows = Math.max(1, Math.floor(h / 0.7)), cols = Math.max(1, Math.floor(w / 0.6));
    const winTex = canvasTex(cols * 16, rows * 16, (c, cw, ch) => {
      c.fillStyle = color; c.fillRect(0, 0, cw, ch);
      c.fillStyle = 'rgba(255,240,170,0.9)';
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) c.fillRect(k * 16 + 4, r * 16 + 4, 8, 8);
    });
    texList.push(winTex);
    const side = mat(color);
    const front = new THREE.MeshLambertMaterial({ map: winTex });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, front, side]);
    body.position.set(x, h / 2, z);
    parent.add(body);
    if (roof === 'gable') {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0, d * 0.78, 0.6, 4), mat('#9b4a3a'));
      r.rotation.y = Math.PI / 4; r.scale.set(w / d * 1.0, 1, 1);
      r.position.set(x, h + 0.3, z);
      parent.add(r);
    } else {
      add(parent, new THREE.BoxGeometry(w + 0.1, 0.12, d + 0.1), mat('#40454f'), x, h + 0.06, z);
    }
    return body;
  }
  function slotBox(parent, xPx, basePx, wPx, hPx) {
    const w = wPx / U, h = hPx / U, d = Math.max(1.4, w * 0.85);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    e.position.set(CITY_X(xPx), h / 2, CITY_Z(basePx) - d / 2);
    parent.add(e);
  }

  function buildCity() {
    const S = bridge.S, has = S.assets || {};
    const g = new THREE.Group();
    g.userData.tex = [];
    dyn.cars = []; dyn.heli = null; dyn.yacht = null;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), mat('#4a8d5c'));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.01, 0.5);
    g.add(ground);
    // yol
    box(g, 26, 0.04, 1.4, '#3a3d48', 0, 0.02, 0.05);
    for (let i = -12; i < 13; i += 1.4) box(g, 0.7, 0.045, 0.07, '#d8d8d8', i, 0.025, 0.05);
    box(g, 26, 0.06, 0.2, '#b9b4a5', 0, 0.03, -0.75);
    box(g, 26, 0.06, 0.2, '#b9b4a5', 0, 0.03, 0.85);
    // deniz
    const water = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.4), new THREE.MeshLambertMaterial({ color: '#3a8fbd' }));
    water.rotation.x = -Math.PI / 2; water.position.set(CITY_X(310) + 0.4, 0.005, CITY_Z(200));
    g.add(water);
    box(g, 0.2, 0.15, 5.4, '#8a7350', CITY_X(262), 0.08, CITY_Z(200));
    // tepeler
    for (const [hx, hz, hs] of [[-7, -5.2, 3.2], [3, -5.8, 4], [9, -5.0, 2.6]]) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(hs, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#5f9a7a'));
      hill.scale.y = 0.45; hill.position.set(hx, 0, hz);
      g.add(hill);
    }

    const T = g.userData.tex;
    const def = [
      ['studio', 34, 106, 28, 26, '#c9a27a', 'flat'], ['flat', 88, 106, 34, 42, '#9fb3c8', 'flat'],
      ['house', 148, 106, 42, 32, '#d98f6a', 'gable'], ['villa', 222, 106, 58, 40, '#ece6d6', 'flat'],
      ['mansion', 312, 106, 72, 56, '#d6c7a8', 'gable'], ['land', 34, 214, 40, 10, '#c7b183', 'flat'],
      ['office', 96, 214, 34, 84, '#6b8fb3', 'flat'], ['mall', 188, 214, 96, 46, '#b69fd0', 'flat'],
    ];
    def.forEach(([id, x, base, w, h, col, roof]) => { if (has[id]) building(g, T, x, base, w, h, col, roof); else slotBox(g, x, base, w, h); });
    building(g, T, 250, 214, 22, 30, '#e58a3d', 'flat');   // senin kafen

    // arabalar
    const carDefs = [
      { id: 'scooter', col: '#e5634d', len: 14, hh: 7, sp: 52, dir: 1, y: 134, off: 20 },
      { id: 'hatch', col: '#4cc9f0', len: 24, hh: 9, sp: 38, dir: -1, y: 121, off: 90 },
      { id: 'sedan', col: '#6fd6a2', len: 28, hh: 9, sp: 46, dir: 1, y: 135, off: 160 },
      { id: 'sport', col: '#ffd23f', len: 28, hh: 8, sp: 90, dir: -1, y: 122, off: 40 },
    ];
    carDefs.forEach((c) => {
      if (!has[c.id]) return;
      const car = new THREE.Group();
      const L = c.len / U * 1.1, Hh = Math.max(0.3, c.hh / U * 1.1);
      box(car, L, Hh, 0.55, c.col, 0, Hh / 2 + 0.06, 0);
      box(car, L * 0.5, Hh * 0.7, 0.5, '#bfe6ff', 0, Hh + 0.3, 0);
      box(car, L * 0.8, 0.12, 0.62, '#1a1a22', 0, 0.06, 0);
      car.position.y = 0.02;
      g.add(car);
      dyn.cars.push({ car, def: c });
    });
    // helikopter
    if (has.heli) {
      const hel = new THREE.Group();
      const body = add(hel, new THREE.SphereGeometry(0.5, 12, 8), mat('#d4443a'), 0, 0, 0);
      body.scale.set(1.5, 0.8, 0.9);
      box(hel, 1.2, 0.12, 0.12, '#d4443a', -1.2, 0.1, 0);
      const rotor = box(hel, 2.6, 0.04, 0.14, '#222', 0, 0.55, 0);
      hel.position.set(0, 3.2, -3.2);
      g.add(hel);
      dyn.heli = { hel, rotor };
    }
    // yat
    if (has.yacht) {
      const y = new THREE.Group();
      box(y, 3.2, 0.5, 1.1, '#f4f1ea', 0, 0.25, 0);
      box(y, 3.2, 0.1, 1.12, '#e58a3d', 0, 0.38, 0);
      box(y, 1.4, 0.55, 0.8, '#dff1f6', -0.1, 0.8, 0);
      box(y, 0.9, 0.22, 0.82, '#5a8bb0', -0.1, 0.85, 0);
      y.position.set(CITY_X(310) + 0.3, 0.1, CITY_Z(207));
      g.add(y);
      dyn.yacht = y;
    }
    return g;
  }

  /* ---------- Müşteriler ---------- */
  function makeCustomer(c) {
    const g = new THREE.Group();
    const body = add(g, G.torso, mat(c.vip ? '#2b2b3a' : c.shirt), 0, 0.95, 0);
    add(g, G.head, mat(c.skin), 0, 1.62, 0);
    add(g, G.hair, mat(c.hair), 0, 1.64, 0);
    const legs = [add(g, G.leg, mat('#2b2b3a'), -0.1, 0.22, 0), add(g, G.leg, mat('#2b2b3a'), 0.1, 0.22, 0)];
    const sh = add(g, G.shadow, ghost('#000000', 0.25), 0, 0.012, 0);
    sh.rotation.x = -Math.PI / 2;
    const cup = add(g, G.cup, mat('#f4f1ea'), 0.32, 1.0, 0.12);
    cup.visible = false;
    const star = add(g, G.star, mat('#ffd23f'), 0, 2.15, 0);
    star.visible = !!c.vip;
    const warn = add(g, G.warn, mat('#ff7a66'), 0.32, 2.0, 0);
    warn.visible = false;
    g.userData = { body, legs, cup, star, warn, px: null, pz: null, yaw: 0 };
    return g;
  }

  function updateCustomers(dt, clock) {
    const H = bridge.getH();
    const seen = new Set();
    for (const c of bridge.customers) {
      seen.add(c);
      let g = custMap.get(c);
      if (!g) { g = makeCustomer(c); custMap.set(c, g); customerLayer.add(g); }
      const u = g.userData;
      const x = (c.x - 180) / U, z = (c.y - H / 2) / U;
      const seated = c.state === 'eat';
      if (u.px !== null) {
        const dx = x - u.px, dz = z - u.pz;
        if (dx * dx + dz * dz > 1e-6) {
          const target = Math.atan2(dx, dz);
          let diff = target - u.yaw;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          u.yaw += diff * Math.min(1, dt * 10);
        }
      }
      if (seated) u.yaw = 0;
      u.px = x; u.pz = z;
      g.position.set(x, seated ? -0.28 : 0, z);
      g.rotation.y = u.yaw;
      const walking = c.moving && !seated;
      g.position.y += walking ? Math.abs(Math.sin(clock * 10 + c.ph)) * 0.07 : 0;
      u.legs[0].visible = u.legs[1].visible = !seated;
      u.legs[0].rotation.x = walking ? Math.sin(clock * 10 + c.ph) * 0.6 : 0;
      u.legs[1].rotation.x = walking ? -Math.sin(clock * 10 + c.ph) * 0.6 : 0;
      u.cup.visible = !!c.cup && !seated;
      u.warn.visible = c.state === 'queue' && !c.serving && c.wait > 12;
      if (u.star.visible) u.star.rotation.y = clock * 2;
    }
    for (const [c, g] of custMap) {
      if (!seen.has(c)) { customerLayer.remove(g); custMap.delete(c); }
    }
  }

  /* ---------- Güncelleme ve çizim ---------- */
  function signatureCafe() {
    const S = bridge.S;
    return [S.tab, S.bar, S.mach, S.cas, S.dec, S.room, S.name, JSON.stringify(S.avatar || {})].join('|');
  }
  function signatureCity() {
    const S = bridge.S;
    return Object.keys(S.assets || {}).filter((k) => S.assets[k]).sort().join(',');
  }

  function update(dt, wantMode) {
    const clock = bridge.clock();
    if (wantMode && wantMode !== mode) { mode = wantMode; cafeSig = citySig = ''; }
    if (mode === 'cafe') {
      const sig = signatureCafe() + '|' + bridge.getH();
      if (sig !== cafeSig) {
        if (cafeGroup) { scene.remove(cafeGroup); disposeGroup(cafeGroup); }
        cafeGroup = buildCafe();
        scene.add(cafeGroup);
        cafeSig = sig;
        if (autoCamera) fit(18.6, bridge.getH() / U, 2.4, 56, 0.5, 0.4);
      }
    } else if (!cityGroup || signatureCity() !== citySig) {
      if (cityGroup) { scene.remove(cityGroup); disposeGroup(cityGroup); }
      cityGroup = buildCity();
      scene.add(cityGroup);
      citySig = signatureCity();
      if (autoCamera) fit(22, 10.5, 3.2, 42, 0.6, 0.9);
    }
    if (cafeGroup) cafeGroup.visible = mode === 'cafe';
    if (cityGroup) cityGroup.visible = mode === 'city';
    customerLayer.visible = mode === 'cafe';
    // gün içi ışık (sabah sıcak, akşam karanlık) ve olay etkisi
    {
      const Sd = bridge.S, dl = bridge.dayLen || 90, t = Math.min(Sd.dayT || 0, dl) / dl;
      let k = 1;
      if (t < 0.12) k = 0.8 + 0.2 * (t / 0.12); else if (t > 0.68) k = 1 - Math.min(0.5, (t - 0.68) / 0.32 * 0.5);
      if (Sd.ev === 1) k *= 0.85;
      hemi.intensity = 1.0 * k; sun.intensity = 1.3 * k;
      bgColor.set(mode === 'cafe' ? '#14201f' : '#a9d7ea').multiplyScalar(0.4 + 0.6 * k);
      const raining = mode === 'city' && Sd.ev === 1;
      rain.ls.visible = raining;
      if (raining) {
        for (let i = 0; i < rain.n; i++) {
          const s = rain.seed[i], y = (((s[1] - clock * 9) % 8) + 8) % 8, o = i * 6;
          rain.pos[o] = s[0]; rain.pos[o + 1] = y; rain.pos[o + 2] = s[2];
          rain.pos[o + 3] = s[0] - 0.1; rain.pos[o + 4] = y - 0.45; rain.pos[o + 5] = s[2];
        }
        rain.ls.geometry.attributes.position.needsUpdate = true;
      }
    }

    if (mode === 'cafe') {
      updateCustomers(dt, clock);
      dyn.baristas.forEach((b, i) => {
        if (!b) return;
        const busy = !!bridge.lanes[i].cur;
        b.position.y = busy ? Math.sin(clock * 9) * 0.04 : 0;
        const puffs = dyn.steam[i] || [];
        puffs.forEach((p, k) => {
          p.visible = busy;
          if (busy) { const ph = (clock * 1.5 + k * 0.5) % 1; p.position.y = 2.1 + ph * 0.7; p.material.opacity = 0.5 * (1 - ph); }
        });
      });
      if (autoCamera) placeCamera(Math.sin(clock * 0.25) * 0.6);
    } else {
      const span = 360 + 80;
      dyn.cars.forEach(({ car, def }) => {
        const v = (clock * def.sp + def.off) % span;
        const px = def.dir > 0 ? v - 40 : 360 + 40 - v;
        car.position.x = (px - 180) / U;
        car.position.z = CITY_Z(def.y);
        car.rotation.y = def.dir > 0 ? 0 : Math.PI;
      });
      if (dyn.heli) {
        dyn.heli.hel.position.x = Math.sin(clock * 0.6) * 4;
        dyn.heli.hel.position.y = 3.2 + Math.sin(clock * 1.7) * 0.15;
        dyn.heli.rotor.rotation.y = clock * 30;
      }
      if (dyn.yacht) dyn.yacht.position.y = 0.1 + Math.sin(clock * 1.5) * 0.05;
      if (autoCamera) placeCamera(Math.sin(clock * 0.2) * 1.2);
    }
    renderer.render(scene, camera);
  }

  function resize(w, h) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
    cafeSig = citySig = '';   // kamerayı yeni orana göre yeniden sığdır
  }

  function dispose() {
    [cafeGroup, cityGroup].forEach((gr) => { if (gr) { scene.remove(gr); disposeGroup(gr); } });
    matCache.forEach((m) => { if (m.map) m.map.dispose(); });
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* yok say */ }
  }

  return {
    update, resize, dispose, camera, renderer, scene,
    setMode(m) { mode = m; cafeSig = citySig = ''; },
    setAutoCamera(v) { autoCamera = !!v; },
  };
}
