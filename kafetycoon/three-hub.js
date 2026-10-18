// Köşe Kafe Tycoon: izometrik şehir ana ekranı (Three.js).
// Modeller depodan gelir (assets/kaykit-city, KayKit City Builder Bits, CC0). Dışarıdan hiçbir şey çekilmez.
// Oyun durumunu yalnızca okur. Dokunmalar `pick` ile döner, işi oyun yapar.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';

const BASE = new URL('./assets/kaykit-city/', import.meta.url).href;
const NAMES = ['building_A', 'building_B', 'building_C', 'building_D', 'building_E', 'building_F', 'building_G', 'building_H', 'base',
  'road_straight', 'road_junction', 'road_corner', 'car_sedan', 'car_taxi', 'car_police', 'car_hatchback', 'car_stationwagon',
  'streetlight', 'bush', 'firehydrant', 'bench', 'watertower', 'dumpster', 'box_A', 'trafficlight_A'];
const TILE = 2, GRID = 7;
const tx = (i) => (i - (GRID - 1) / 2) * TILE;

// Parsel yerleşimi: kimlik, ızgara karesi, model. Kimlikler oyundaki işletmelerle eşleşir.
export const LOTS = [
  { id: 'cafe', tile: [4, 4], model: 'building_A' },
  { id: 'whole', tile: [2, 4], model: 'building_B' },
  { id: 'burger', tile: [4, 2], model: 'building_E' },
  { id: 'cater', tile: [2, 2], model: 'building_D' },
  { id: 'deliv', tile: [2, 6], model: 'building_C' },
  { id: 'brand', tile: [6, 2], model: 'building_H' },
  { id: 'sweet', tile: [0, 2], model: 'building_F' },
  { id: 'resto', tile: [2, 0], model: 'building_G' },
];

const kit = { state: 0, tpl: {}, mat: null, grey: null, waiters: [] };
function loadKit(cb) {
  if (kit.state === 2) { cb(); return; }
  kit.waiters.push(cb);
  if (kit.state === 1) return;
  kit.state = 1;
  const loader = new GLTFLoader();
  Promise.all(NAMES.map((n) => loader.loadAsync(BASE + n + '.gltf').then((g) => [n, g.scene])))
    .then((list) => {
      let atlas = null;
      list.forEach(([n, root]) => {
        root.traverse((o) => {
          if (!o.isMesh) return;
          if (!atlas) {
            atlas = o.material.map;
            kit.mat = new THREE.MeshLambertMaterial({ map: atlas });
            kit.grey = new THREE.MeshLambertMaterial({ map: atlas, color: 0x7d8794 });
            kit.mat.userData.shared = kit.grey.userData.shared = true;
          }
          o.material = kit.mat;
          o.geometry.userData.shared = true;
        });
        kit.tpl[n] = root;
      });
      kit.state = 2;
      kit.waiters.splice(0).forEach((f) => f(true));
    })
    .catch((e) => {
      console.warn('Şehir modelleri yüklenemedi:', e && e.message);
      kit.state = 0;
      kit.waiters.splice(0).forEach((f) => f(false));
    });
}
function place(parent, name, x, y, z, ry = 0, s = 1) {
  const t = kit.tpl[name];
  if (!t) return null;
  const o = t.clone(true);
  o.position.set(x, y, z);
  o.rotation.y = ry;
  o.scale.setScalar(s);
  parent.add(o);
  return o;
}
function setGrey(o, grey) {
  o.traverse((m) => { if (m.isMesh) m.material = grey ? kit.grey : kit.mat; });
}

/* ---------- Yazı balonları (canvas dokulu sprite) ---------- */
function bubble(text, opt = {}) {
  const w = opt.w || 256, h = opt.h || 72;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = opt.bg || '#fff';
  g.strokeStyle = opt.edge || '#1d3f9a';
  g.lineWidth = 6;
  g.beginPath(); g.roundRect(5, 5, w - 10, h - 22, 22); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(w / 2 - 12, h - 18); g.lineTo(w / 2, h - 4); g.lineTo(w / 2 + 12, h - 18); g.closePath(); g.fill();
  g.fillStyle = opt.fg || '#1e1a4d';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = opt.fs || 34;
  do { g.font = '700 ' + fs + 'px "Lilita One", "Fredoka", system-ui, sans-serif'; fs -= 2; } while (g.measureText(text).width > w - 36 && fs > 14);
  g.fillText(text, w / 2, (h - 22) / 2 + 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  sp.renderOrder = 10;
  sp.userData.tex = t;
  sp.scale.set((opt.sw || 2.1), (opt.sw || 2.1) * h / w, 1);
  return sp;
}
function disposeSprite(sp) { if (sp.userData.tex) sp.userData.tex.dispose(); sp.material.dispose(); }

/* ---------- Ana fonksiyon ---------- */
export function createHub(canvas, bridge) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { throw new Error('WebGL kullanılamıyor'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8fa066, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.25);
  sun.position.set(-6, 12, 5);
  scene.add(sun);

  let world = null, sig = '', ready = false, failed = false, aspect = 0.8;
  const lotNodes = new Map();      // id -> { group, label, balloon, key }
  const cars = [];
  let clock = 0, renderAcc = 1;

  const view = { x: 0, z: 0, zoom: 1, hw: 6 };
  const EL = THREE.MathUtils.degToRad(35.3), AZ = Math.PI / 4;
  function fitCamera() {
    const halfW = 6.2 / view.zoom;
    let hw = halfW, hh = halfW / aspect;
    if (hh < 6.4 / view.zoom) { hh = 6.4 / view.zoom; hw = hh * aspect; }
    view.hw = hw;
    // Alt çubuğa yer: görüntü merkezini yukarı kaydır
    camera.left = -hw; camera.right = hw; camera.top = hh * 0.82; camera.bottom = -hh * 1.18;
    const lim = Math.min(5.4, Math.max(0, GRID * TILE / 2 + 0.4 - hw * 0.85));
    view.x = Math.max(-lim, Math.min(lim, view.x));
    view.z = Math.max(-lim, Math.min(lim, view.z));
    const d = 30;
    camera.position.set(view.x + Math.cos(AZ) * Math.cos(EL) * d, Math.sin(EL) * d, view.z + Math.sin(AZ) * Math.cos(EL) * d);
    camera.lookAt(view.x, 0.4, view.z);
    camera.updateProjectionMatrix();
  }
  // Parmakla kaydırma ve iki parmakla yakınlaştırma
  const ptrs = new Map();
  let moved = false, downAt = null, pinch0 = 0, zoom0 = 1;
  const pdist = () => { const a = [...ptrs.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
  function panBy(dx, dy) {
    const u = (camera.right - camera.left) / Math.max(1, canvas.clientWidth);
    const rx = Math.SQRT1_2, rz = -Math.SQRT1_2, ux = -Math.SQRT1_2, uz = -Math.SQRT1_2;
    view.x += -rx * dx * u + ux * dy * u / Math.sin(EL);
    view.z += -rz * dx * u + uz * dy * u / Math.sin(EL);
    fitCamera();
  }
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { moved = false; downAt = { x: e.clientX, y: e.clientY }; }
    else if (ptrs.size === 2) { pinch0 = pdist(); zoom0 = view.zoom; moved = true; }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) { view.zoom = Math.max(0.75, Math.min(1.6, zoom0 * pdist() / pinch0)); fitCamera(); return; }
    if (!moved && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) moved = true;
    if (moved) panBy(dx, dy);
  });
  const up = (e) => { ptrs.delete(e.pointerId); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  function disposeWorld() {
    if (!world) return;
    scene.remove(world);
    world.traverse((o) => {
      if (o.isSprite) disposeSprite(o);
      else if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material && !o.material.userData.shared && !o.isSprite) o.material.dispose();
    });
    world = null; lotNodes.clear(); cars.length = 0;
  }

  function buildWorld() {
    disposeWorld();
    const g = new THREE.Group();
    world = g;
    // ada zemini
    const grass = new THREE.Mesh(new THREE.BoxGeometry(GRID * TILE + 0.8, 0.6, GRID * TILE + 0.8), new THREE.MeshLambertMaterial({ color: 0x6fd05a }));
    grass.position.y = -0.3; g.add(grass);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(GRID * TILE + 1.4, 0.5, GRID * TILE + 1.4), new THREE.MeshLambertMaterial({ color: 0xd9b27a }));
    rim.position.y = -0.85; g.add(rim);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x3fb2f0 }));
    water.rotation.x = -Math.PI / 2; water.position.y = -1.15; g.add(water);

    const mid = (GRID - 1) / 2;
    const lawnA = new THREE.MeshLambertMaterial({ color: 0x86e060 }), lawnB = new THREE.MeshLambertMaterial({ color: 0x78d853 });
    const lotTiles = new Set(LOTS.map((l) => l.tile.join(',')));
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = tx(i), z = tx(j), key = i + ',' + j;
        if (i === mid && j === mid) place(g, 'road_junction', x, 0, z);
        else if (j === mid) place(g, 'road_straight', x, 0, z, Math.PI / 2);
        else if (i === mid) place(g, 'road_straight', x, 0, z, 0);
        else if (!lotTiles.has(key)) { const t = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.06, 0.08, TILE - 0.06), (i + j) % 2 ? lawnA : lawnB); t.position.set(x, 0.04, z); g.add(t); }
      }
    }
    // süsler: çimen karelerine deterministik dağılım
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        if (i === mid || j === mid || lotTiles.has(i + ',' + j)) continue;
        const x = tx(i), z = tx(j), k = (i * 5 + j * 3) % 7;
        if (k === 0 || k === 4) place(g, 'bush', x - 0.55, 0.08, z - 0.5, 0, 2.2);
        if (k === 1 || k === 4) place(g, 'bush', x + 0.5, 0.08, z + 0.45, 0, 2.6);
        if (k === 2) place(g, 'bench', x, 0.08, z + 0.6, 0, 2);
        if (k === 3) place(g, 'streetlight', x + 0.6, 0.08, z - 0.6, 0, 1.6);
        if (k === 5) place(g, 'watertower', x, 0.08, z, 0, 1.6);
        if (k === 6) { place(g, 'dumpster', x + 0.4, 0.08, z - 0.4, 0.5, 1.6); place(g, 'firehydrant', x - 0.5, 0.08, z + 0.5, 0, 2); }
      }
    }
    // arabalar
    const carNames = ['car_sedan', 'car_taxi', 'car_police', 'car_hatchback', 'car_stationwagon'];
    const lane = 0.34, span = GRID * TILE + 2;
    for (let k = 0; k < 6; k++) {
      const horiz = k % 2 === 0, dir = k < 3 ? 1 : -1;
      const o = place(g, carNames[k % carNames.length], 0, 0.12, 0, 0, 1.5);
      cars.push({ o, horiz, dir, lane: dir * lane, off: k * 3.1, sp: 1.2 + 0.15 * k, span });
    }
    scene.add(g);
    ready = true;
  }

  function tileOf(l) { return [tx(l.tile[0]), tx(l.tile[1])]; }

  // Parselleri bridge verisine göre kur (imza değişince)
  function buildLots() {
    const data = bridge.getLots();
    data.forEach((d) => {
      const def = LOTS.find((l) => l.id === d.id);
      if (!def) return;
      let n = lotNodes.get(d.id);
      if (n) { world.remove(n.group); disposeSprite(n.label); if (n.balloon) { disposeSprite(n.balloon); n.balloon = null; } }
      const [x, z] = tileOf(def);
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      const b = place(group, def.model, 0, 0, 0);
      if (b) setGrey(b, d.locked);
      group.userData.lotId = d.id;
      world.add(group);
      const label = bubble(d.locked ? '🔒 Sv. ' + d.req : d.name + (d.lv ? ' ' + d.lv : '') + (d.mgr ? ' ★' : ''), { bg: d.locked ? '#d5dae3' : '#ffffff', sw: 1.95 });
      const hgt = { building_A: 1.9, building_B: 1.9, building_C: 3.2, building_D: 3.2, building_E: 2.6, building_F: 2.6, building_G: 3.2, building_H: 3.3 }[def.model] || 2.4;
      label.position.set(0, hgt + 0.55, 0);
      group.add(label);
      lotNodes.set(d.id, { group, label, balloon: null, bText: '', hgt, locked: d.locked });
    });
  }

  function signature() {
    return bridge.getLots().map((d) => [d.id, d.name, d.lv, d.locked ? 1 : 0, d.req, d.mgr ? 1 : 0].join(':')).join('|');
  }

  function updateBalloons() {
    bridge.getLots().forEach((d) => {
      const n = lotNodes.get(d.id);
      if (!n) return;
      const txt = d.balloon > 0 ? d.balloonText : '';
      if (txt !== n.bText) {
        if (n.balloon) { n.group.remove(n.balloon); disposeSprite(n.balloon); n.balloon = null; }
        n.bText = txt;
        if (txt) {
          n.balloon = bubble(txt, { bg: '#6dff74', edge: '#0c6a22', fg: '#0b3d14', sw: 1.7, w: 220 });
          n.balloon.userData.balloonId = d.id;
          n.group.add(n.balloon);
        }
      }
      if (n.balloon) n.balloon.position.set(0, n.hgt + 1.35 + Math.sin(clock * 3 + d.id.length) * 0.12, 0);
    });
  }

  function update(dt) {
    clock += dt;
    if (!ready) return;
    const s = signature();
    if (s !== sig) { sig = s; buildLots(); }
    updateBalloons();
    cars.forEach((c) => {
      if (!c.o) return;
      const v = ((clock * c.sp + c.off) % c.span) - c.span / 2;
      if (c.horiz) { c.o.position.set(v * c.dir, 0.12, c.lane); c.o.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else { c.o.position.set(c.lane, 0.12, v * c.dir); c.o.rotation.y = c.dir > 0 ? 0 : Math.PI; }
    });
    renderAcc += dt;
    if (renderAcc >= 1 / 32) { renderAcc = 0; renderer.render(scene, camera); }   // pil ömrü için en çok ~30 kare/sn
  }

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // Dokunulan şeyi döndürür: { kind: 'balloon' | 'lot', id }
  function pick(clientX, clientY) {
    if (!world) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(world.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.balloonId) return { kind: 'balloon', id: o.userData.balloonId };
        if (o.userData && o.userData.lotId) return { kind: 'lot', id: o.userData.lotId };
        o = o.parent;
      }
    }
    return null;
  }

  // Bir parselin ekrandaki (client) konumu; rehber ve vurgu için
  const tmp = new THREE.Vector3();
  function screenPos(id) {
    const n = lotNodes.get(id);
    if (!n) return null;
    n.group.getWorldPosition(tmp);
    tmp.y += n.hgt * 0.5;
    tmp.project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (tmp.x + 1) / 2 * r.width, y: r.top + (1 - tmp.y) / 2 * r.height };
  }

  function resize(w, h) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    aspect = Math.max(1, w) / Math.max(1, h);
    fitCamera();
  }

  function dispose() {
    disposeWorld();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* yok say */ }
  }

  const api = { update, resize, dispose, pick, screenPos, camera, renderer, scene, onReady: null, get ready() { return ready; }, get failed() { return failed; }, get dragged() { return moved; } };
  loadKit((ok) => { if (ok) { buildWorld(); fitCamera(); } else failed = true; if (api.onReady) api.onReady(ok); });
  return api;
}
