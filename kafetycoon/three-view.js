// Köşe Kafe Tycoon: 3B görünümler (kafe ve şehir).
// Three.js, depodaki sabit sürümden (vendor/three) yüklenir. Modeller de depodan gelir (assets/kaykit-restaurant, CC0).
// Dışarıdan hiçbir model, doku veya betik çekilmez. Modeller yüklenemezse kafe kodla üretilen şekillerle çizilir.
// Oyun durumunu yalnızca okur; hiçbir şeyi değiştirmez.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';

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
    ms.forEach((m) => { if (m.map && !m.userData.shared) m.dispose(); });
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

/* ---------- Model kiti (KayKit Restaurant Bits, CC0) ---------- */
const KIT_URL = new URL('./assets/kaykit-restaurant/', import.meta.url).href;
const KIT_NAMES = ['table_round_A', 'chair_A', 'chair_B', 'kitchencounter_straight_A', 'kitchencounter_straight_B', 'kitchencounter_sink',
  'stove_single', 'stove_multi', 'oven', 'fridge_A', 'fridge_B', 'pot_A', 'pan_A', 'plate', 'food_burger', 'cuttingboard', 'knife', 'menu', 'crate'];
const kit = { ready: false, started: false, tpl: {} };
function loadKit() {
  if (kit.started) return;
  kit.started = true;
  const loader = new GLTFLoader();
  Promise.all(KIT_NAMES.map((n) => loader.loadAsync(KIT_URL + n + '.gltf').then((gl) => [n, gl.scene])))
    .then((list) => {
      let atlas = null, material = null;
      list.forEach(([n, root]) => {
        root.traverse((o) => {
          if (!o.isMesh) return;
          if (!atlas) {
            atlas = o.material.map;
            material = new THREE.MeshLambertMaterial({ map: atlas });
            material.userData.shared = true;
          }
          o.material = material;
          o.geometry.userData.shared = true;
        });
        kit.tpl[n] = root;
      });
      kit.ready = true;
    })
    .catch((e) => { console.warn('3B model kiti yüklenemedi, kodla çizim kullanılıyor:', e && e.message); });
}
// Modelin kopyası. Geometri ve malzeme ortaktır; ölçek x, y, z ayrı verilebilir.
function kitPlace(parent, name, x, y, z, sx, sy = sx, sz = sx, ry = 0) {
  const t = kit.tpl[name];
  if (!t) return null;
  const o = t.clone(true);
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  o.rotation.y = ry;
  parent.add(o);
  return o;
}

/* ---------- Ana fonksiyon ---------- */
export function createView3D(canvas, bridge, options = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    throw new Error('WebGL kullanılamıyor');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (options.models !== false) loadKit();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1.1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b5a48, 1.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(-6, 12, 8);
  scene.add(sun);
  const bgColor = new THREE.Color();
  scene.background = bgColor;

  let autoCamera = options.autoCamera !== false;
  let cafeGroup = null, cafeSig = '';
  const dyn = { baristas: [], steam: [] };
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
    if (kit.ready) {
      for (let i = 0; i < 5; i++) {
        const nm = i === 3 ? 'kitchencounter_sink' : (i % 2 ? 'kitchencounter_straight_B' : 'kitchencounter_straight_A');
        const o = kitPlace(g, nm, wx(130) - 4 + i * 2, 0, wz(86), 1, 0.95, 0.55);
        if (nm === 'kitchencounter_sink') o.scale.y = 0.55;
      }
      kitPlace(g, 'cuttingboard', wx(130) - 3.4, 0.95, wz(86), 0.5, 0.5, 0.5, 0.2);
      kitPlace(g, 'knife', wx(130) - 3.0, 1.0, wz(86), 0.4, 0.4, 0.4, 1.3).rotation.x = Math.PI / 2;
      for (let k = 0; k < 3; k++) kitPlace(g, 'plate', wx(130) + 3.6, 0.95 + k * 0.05, wz(86), 0.7);
      kitPlace(g, 'food_burger', wx(130) + 3.6, 1.1, wz(86), 0.45);
    } else {
      box(g, 10, 0.95, 1.1, '#a86f3f', wx(130), 0.475, wz(86));
      box(g, 10.2, 0.1, 1.3, '#e8cfa6', wx(130), 1.0, wz(84));
    }
    // mutfak hattı (arka duvar): seviyeye göre büyür
    if (kit.ready) {
      const kz = -D / 2 + 1.0;
      kitPlace(g, 'stove_single', -7.9, 0, kz, 0.8);
      kitPlace(g, 'pot_A', -7.9, 0.95, kz, 0.55, 0.55, 0.55, 0.4);
      if (S.mach >= 2) kitPlace(g, 'oven', -6.1, 0, kz, 0.75);
      if (S.mach >= 4) kitPlace(g, 'stove_multi', -4.3, 0, kz, 0.8);
      if (S.cas > 0) kitPlace(g, 'fridge_B', 7.9, 0, kz, 0.6);
      if (S.mach >= 3) kitPlace(g, 'fridge_A', 6.2, 0, kz, 0.6);
      kitPlace(g, 'menu', 2.0, 0, D / 2 - 0.9, 1.4, 1.4, 1.4, -0.4);
      if (S.dec >= 2) kitPlace(g, 'crate', -8.2, 0, D / 2 - 1.1, 0.45);
    }

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
      if (kit.ready) {
        kitPlace(g, 'table_round_A', x, 0, z, 0.78);
        for (const s of [-1, 1]) kitPlace(g, t % 2 ? 'chair_B' : 'chair_A', x + s * 1.45, 0, z, 0.95, 0.95, 0.95, -s * Math.PI / 2);
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
    return [S.tab, S.bar, S.mach, S.cas, S.dec, S.room, S.name, JSON.stringify(S.avatar || {}), kit.ready ? 'k' : ''].join('|');
  }
  function update(dt) {
    const clock = bridge.clock();
    const sig = signatureCafe() + '|' + bridge.getH();
    if (sig !== cafeSig) {
      if (cafeGroup) { scene.remove(cafeGroup); disposeGroup(cafeGroup); }
      cafeGroup = buildCafe();
      scene.add(cafeGroup);
      cafeSig = sig;
      if (autoCamera) fit(18.6, bridge.getH() / U, 2.4, 56, 0.5, 0.4);
    }
    // gün içi ışık (sabah sıcak, akşam karanlık) ve olay etkisi
    {
      const Sd = bridge.S, dl = bridge.dayLen || 90, t = Math.min(Sd.dayT || 0, dl) / dl;
      let k = 1;
      if (t < 0.12) k = 0.8 + 0.2 * (t / 0.12); else if (t > 0.68) k = 1 - Math.min(0.5, (t - 0.68) / 0.32 * 0.5);
      if (Sd.ev === 1) k *= 0.85;
      hemi.intensity = 1.0 * k; sun.intensity = 1.3 * k;
      bgColor.set('#14201f').multiplyScalar(0.4 + 0.6 * k);
    }

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
    renderer.render(scene, camera);
  }

  function resize(w, h) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
    cafeSig = '';   // kamerayı yeni orana göre yeniden sığdır
  }

  function dispose() {
    if (cafeGroup) { scene.remove(cafeGroup); disposeGroup(cafeGroup); }
    matCache.forEach((m) => { if (m.map) m.map.dispose(); });
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* yok say */ }
  }

  return {
    update, resize, dispose, camera, renderer, scene,
    setAutoCamera(v) { autoCamera = !!v; },
  };
}
