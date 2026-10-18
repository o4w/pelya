// Köşe Kafe Tycoon: işletme iç mekânı (Burger, Tatlıcı, Restoran, Toptan, vb.). Three.js, izometrik.
// Modeller depodan gelir (assets/kaykit-restaurant, CC0). Dışarıdan hiçbir şey çekilmez.
// Oyun durumunu yalnızca okur. Müşteri ve para yazıları görseldir; gerçek gelir oyunda hesaplanır.
// Gösterilen "+₺" değerleri, işletmenin gerçek saniyelik gelirinden türetilir.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';

const KIT_URL = new URL('./assets/kaykit-restaurant/', import.meta.url).href;
const NAMES = ['table_round_A', 'chair_A', 'chair_B', 'kitchencounter_straight_A', 'kitchencounter_straight_B', 'kitchencounter_sink',
  'stove_single', 'stove_multi', 'oven', 'fridge_A', 'fridge_B', 'pot_A', 'pan_A', 'plate', 'food_burger', 'cuttingboard', 'menu', 'crate',
  'wall', 'bowl', 'knife'];

// Tema: kind 'food' müşteri alır, 'work' çalışan ve kolilerle gösterilir.
export const THEMES = {
  burger: { kind: 'food', floor: '#e3b878', floor2: '#d6a666', wall: '#e8543a', sign: '#ffd23f' },
  sweet: { kind: 'food', floor: '#f9dce9', floor2: '#f1c6da', wall: '#ff8fc4', sign: '#ffffff' },
  resto: { kind: 'food', floor: '#9a6a48', floor2: '#8a5c3c', wall: '#3f55a0', sign: '#ffd23f' },
  whole: { kind: 'work', floor: '#c8b698', floor2: '#bba788', wall: '#9a7650', sign: '#ffd23f' },
  deliv: { kind: 'work', floor: '#cfe6cf', floor2: '#bcd9bc', wall: '#3bb07a', sign: '#ffffff' },
  cater: { kind: 'work', floor: '#c3cfe0', floor2: '#b2c0d6', wall: '#4a8fd1', sign: '#ffffff' },
  brand: { kind: 'work', floor: '#dccaf2', floor2: '#cdb6ec', wall: '#8a5acb', sign: '#ffd23f' },
};

const W = 16.4, D = 11;
const kit = { state: 0, tpl: {}, mat: null, atlas: null, waiters: [] };
function loadKit(cb) {
  if (kit.state === 2) { cb(true); return; }
  kit.waiters.push(cb);
  if (kit.state === 1) return;
  kit.state = 1;
  const loader = new GLTFLoader();
  Promise.all(NAMES.map((n) => loader.loadAsync(KIT_URL + n + '.gltf').then((g) => [n, g.scene])))
    .then((list) => {
      list.forEach(([n, root]) => {
        root.traverse((o) => {
          if (!o.isMesh) return;
          if (!kit.atlas) {
            kit.atlas = o.material.map;
            kit.mat = new THREE.MeshLambertMaterial({ map: kit.atlas });
            kit.mat.userData.shared = true;
          }
          o.material = kit.mat;
          o.geometry.userData.shared = true;
        });
        kit.tpl[n] = root;
      });
      kit.state = 2;
      kit.waiters.splice(0).forEach((f) => f(true));
    })
    .catch((e) => { console.warn('İç mekân modelleri yüklenemedi:', e && e.message); kit.state = 0; kit.waiters.splice(0).forEach((f) => f(false)); });
}
function place(parent, name, x, y, z, sx, sy = sx, sz = sx, ry = 0, material = null) {
  const t = kit.tpl[name];
  if (!t) return null;
  const o = t.clone(true);
  o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.y = ry;
  if (material) o.traverse((m) => { if (m.isMesh) m.material = material; });
  parent.add(o);
  return o;
}

const matCache = new Map();
function mat(color) {
  let m = matCache.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); m.userData.shared = true; matCache.set(color, m); }
  return m;
}
function shared(geo) { geo.userData.shared = true; return geo; }
const G = {
  torso: shared(new THREE.CapsuleGeometry(0.27, 0.5, 4, 8)),
  head: shared(new THREE.SphereGeometry(0.25, 12, 10)),
  hair: shared(new THREE.SphereGeometry(0.265, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
  leg: shared(new THREE.BoxGeometry(0.15, 0.45, 0.17)),
  shadow: shared(new THREE.CircleGeometry(0.42, 16)),
  crate: shared(new THREE.BoxGeometry(0.8, 0.6, 0.8)),
};
const SHIRTS = ['#e5634d', '#4cc9f0', '#ffd23f', '#7bd389', '#b388eb', '#ff9ecd', '#f4f1ea'];
const SKINS = ['#f1c9a5', '#d9a273', '#a8744f', '#7a4a2f'];
const HAIRS = ['#2b1d14', '#5a3a22', '#c9a24d', '#1a1a1a', '#8a3b2a'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const SHADOW = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
SHADOW.userData.shared = true;
function makePerson(shirt, skin, hair, apron) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(G.torso, mat(shirt)); body.position.y = 0.95; g.add(body);
  if (apron) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.08), mat('#f4f1ea')); a.position.set(0, 0.85, 0.24); g.add(a); }
  const head = new THREE.Mesh(G.head, mat(skin)); head.position.y = 1.62; g.add(head);
  const hr = new THREE.Mesh(G.hair, mat(hair)); hr.position.y = 1.64; g.add(hr);
  const l1 = new THREE.Mesh(G.leg, mat('#2b2b3a')), l2 = new THREE.Mesh(G.leg, mat('#2b2b3a'));
  l1.position.set(-0.1, 0.22, 0); l2.position.set(0.1, 0.22, 0); g.add(l1, l2);
  const sh = new THREE.Mesh(G.shadow, SHADOW);
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; g.add(sh);
  g.userData = { legs: [l1, l2], ph: Math.random() * 6 };
  return g;
}

function textSprite(text, color, size) {
  const c = document.createElement('canvas');
  c.width = 192; c.height = 64;
  const g = c.getContext('2d');
  g.font = '800 40px "Lilita One", "Fredoka", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = '#0b3d14'; g.strokeText(text, 96, 34);
  g.fillStyle = color || '#7dff6a'; g.fillText(text, 96, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  sp.renderOrder = 20; sp.scale.set(size || 3.6, (size || 3.6) / 3, 1); sp.userData.tex = t;
  return sp;
}

function checker(c1, c2) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = c1; g.fillRect(0, 0, 128, 128);
  g.fillStyle = c2; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(W / 2, D / 2);
  return t;
}

const TABLE_ORDER = [[-2, 2.6], [2, 2.6], [-6, 2.6], [6, 2.6], [-2, -0.8], [2, -0.8], [-6, -0.8], [6, -0.8]];
const DOOR = { x: 7.4, z: 6.3 };
const CORR = 5.0;

export function createBizView(canvas, bridge) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { throw new Error('WebGL kullanılamıyor'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 120);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8a78, 1.45));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(-6, 12, 6);
  scene.add(sun);

  let room = null, sig = '', ready = false, aspect = 0.7, clock = 0, renderAcc = 1;
  let info = null, theme = THEMES.burger;
  let seats = [], people = [], staff = [], floaters = [], crates = [];
  let spawnT = 0, workT = 0;

  function fitCamera() {
    let hw = 10.9, hh = hw / aspect;
    if (hh < 9.4) { hh = 9.4; hw = hh * aspect; }
    camera.left = -hw; camera.right = hw; camera.top = hh * 0.8; camera.bottom = -hh * 1.2;
    const d = 40, az = Math.PI / 4, el = THREE.MathUtils.degToRad(35.3);
    camera.position.set(Math.cos(az) * Math.cos(el) * d, Math.sin(el) * d, Math.sin(az) * Math.cos(el) * d);
    camera.lookAt(0, 0.5, 0.6);
    camera.updateProjectionMatrix();
  }

  function disposeRoom() {
    if (!room) return;
    scene.remove(room);
    room.traverse((o) => {
      if (o.isSprite) { if (o.userData.tex) o.userData.tex.dispose(); o.material.dispose(); return; }
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material && !o.material.userData.shared) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    room = null; seats = []; people = []; staff = []; floaters = []; crates = [];
  }

  function tablesFor(lv) { return Math.min(8, 1 + lv); }

  function build() {
    disposeRoom();
    info = bridge.getBiz();
    theme = THEMES[info.id] || THEMES.burger;
    const lv = Math.max(1, info.lv);
    const g = new THREE.Group();
    room = g;

    // zemin
    const floorTex = checker(theme.floor, theme.floor2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ map: floorTex }));
    floor.rotation.x = -Math.PI / 2; g.add(floor);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.5, D + 0.6), mat('#d9b27a'));
    slab.position.y = -0.27; g.add(slab);

    // duvarlar (temaya göre renklendirilmiş model parçaları)
    const wallMat = new THREE.MeshLambertMaterial({ map: kit.atlas, color: theme.wall });
    for (let k = 0; k < 6; k++) place(g, 'wall', -7 + k * 2.8, 0, -D / 2, 0.7, 0.7, 0.7, 0, wallMat);
    for (let k = 0; k < 4; k++) place(g, 'wall', -W / 2, 0, -4.2 + k * 2.8, 0.7, 0.7, 0.7, Math.PI / 2, wallMat);

    // tabela
    const label = String(info.name || '').toLocaleUpperCase('tr');
    const signTex = (() => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = theme.sign; x.beginPath(); x.roundRect(4, 4, 504, 120, 24); x.fill();
      x.fillStyle = '#2b1608'; x.textAlign = 'center'; x.textBaseline = 'middle';
      let fs = 70; do { x.font = '800 ' + fs + 'px "Lilita One", "Fredoka", system-ui, sans-serif'; fs -= 4; } while (x.measureText(label).width > 460 && fs > 20);
      x.fillText(label, 256, 68);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 2.15, -D / 2 + 0.32); g.add(sign);

    // mutfak hattı (arka duvar), seviyeye göre büyür
    const kz = -D / 2 + 1.15;
    place(g, 'stove_single', -6.6, 0, kz, 0.8);
    place(g, 'pot_A', -6.6, 0.95, kz, 0.55, 0.55, 0.55, 0.4);
    if (lv >= 3) place(g, 'oven', -4.8, 0, kz, 0.75);
    if (lv >= 5) { place(g, 'stove_multi', -2.9, 0, kz, 0.8); place(g, 'pan_A', -2.9, 0.98, kz, 0.5); }
    for (let i = 0; i < 3; i++) place(g, i === 1 ? 'kitchencounter_sink' : (i % 2 ? 'kitchencounter_straight_B' : 'kitchencounter_straight_A'), 0.6 + i * 2.0, 0, kz, 1, i === 1 ? 0.55 : 0.95, 0.55);
    place(g, 'cuttingboard', 0.0 + 0.6, 0.95, kz, 0.5, 0.5, 0.5, 0.2);
    if (lv >= 2) place(g, 'fridge_B', 7.2, 0, kz, 0.6);
    if (lv >= 6) place(g, 'fridge_A', 5.6, 0, kz, 0.6);
    for (let k = 0; k < 3; k++) place(g, 'plate', 6.2, 0.95 + k * 0.05, kz + 1.05, 0.7);
    place(g, 'food_burger', 6.2, 1.1, kz + 1.05, 0.45);
    // giriş paspası
    const mt = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 1.2), mat('#3b2a1e')); mt.position.set(DOOR.x, 0.02, 5.2); g.add(mt);
    place(g, 'menu', DOOR.x - 1.6, 0, 5.2, 1.3, 1.3, 1.3, -0.5);

    // masalar ve koltuklar (yalnızca müşteri alan işletmelerde)
    seats = [];
    if (theme.kind === 'food') {
      for (let t = 0; t < tablesFor(lv); t++) {
        const [tx, tz] = TABLE_ORDER[t];
        place(g, 'table_round_A', tx, 0, tz, 0.78);
        for (const s of [-1, 1]) {
          place(g, t % 2 ? 'chair_B' : 'chair_A', tx + s * 1.45, 0, tz, 0.95, 0.95, 0.95, -s * Math.PI / 2);
          seats.push({ x: tx + s * 1.45, z: tz, face: s > 0 ? -Math.PI / 2 : Math.PI / 2, taken: false });
        }
      }
    } else {
      // koliler: seviyeyle artar
      crates = [];
      const spots = [[-6, 1], [-4.5, 1.6], [-6, 3.4], [-3.2, 3.6], [3.2, 1.2], [4.8, 2.2], [6.4, 1.2], [4.4, 3.8], [-1.5, 2.6], [1.2, 3.6]];
      const n = Math.min(spots.length, 2 + lv);
      for (let i = 0; i < n; i++) {
        const [cx, cz] = spots[i];
        place(g, 'crate', cx, 0, cz, 0.55);
        if (i % 3 === 0) place(g, 'crate', cx, 0.45, cz, 0.45, 0.45, 0.45, 0.4);
        crates.push({ x: cx, z: cz });
      }
    }

    // çalışanlar
    staff = [];
    const cook = makePerson('#f4f1ea', pick(SKINS), pick(HAIRS), true);
    cook.position.set(-6.6, 0, kz + 1.5); cook.rotation.y = Math.PI;
    g.add(cook); staff.push({ g: cook, kind: 'cook', x: -6.6, z: kz + 1.5 });
    if (lv >= 4) { const c2 = makePerson('#ffd23f', pick(SKINS), pick(HAIRS), true); c2.position.set(1.8, 0, kz + 1.5); c2.rotation.y = Math.PI; g.add(c2); staff.push({ g: c2, kind: 'cook', x: 1.8, z: kz + 1.5 }); }
    const walkers = theme.kind === 'work' ? Math.min(3, 1 + Math.floor(lv / 3)) + (info.mgr ? 1 : 0) : (info.mgr ? 1 : 0);
    for (let i = 0; i < walkers; i++) {
      const w = makePerson(i % 2 ? '#4cc9f0' : '#e5634d', pick(SKINS), pick(HAIRS), true);
      w.position.set(-1 + i, 0, kz + 2.2); g.add(w);
      staff.push({ g: w, kind: 'walker', t: i * 2.3, x: -1 + i, z: kz + 2.2 });
    }
    if (info.mgr) {
      const boss = makePerson('#2b2b3a', pick(SKINS), pick(HAIRS), false);
      boss.position.set(3.5, 0, 0.9); g.add(boss);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), mat('#ffd23f')); star.position.set(0, 2.15, 0); boss.add(star);
      staff.push({ g: boss, kind: 'boss', x: 3.5, z: 0.9, star });
    }
    scene.add(g);
  }

  function freeSeat() {
    const open = seats.filter((s) => !s.taken);
    return open.length ? open[Math.floor(Math.random() * open.length)] : null;
  }

  function spawnCustomer() {
    const seat = freeSeat();
    if (!seat) return;
    seat.taken = true;
    const p = makePerson(pick(SHIRTS), pick(SKINS), pick(HAIRS), false);
    p.position.set(DOOR.x, 0, DOOR.z);
    room.add(p);
    people.push({ g: p, state: 'in', seat, path: [{ x: seat.x, z: CORR }, { x: seat.x, z: seat.z }], t: 0, walking: true });
  }

  function floatText(text, x, y, z) {
    const sp = textSprite(text);
    sp.position.set(x, y, z);
    room.add(sp);
    floaters.push({ sp, age: 0, y0: y });
  }

  function rate() { return Math.max(0, info.rate || 0); }
  function spawnEvery() { return Math.max(1.1, 3.6 - 0.28 * Math.max(1, info.lv)); }

  function stepPerson(p, dt, speed) {
    const tgt = p.path[0];
    if (!tgt) return true;
    const dx = tgt.x - p.g.position.x, dz = tgt.z - p.g.position.z, dist = Math.hypot(dx, dz);
    if (dist < 0.06) { p.path.shift(); return p.path.length === 0; }
    const st = Math.min(dist, speed * dt);
    p.g.position.x += dx / dist * st; p.g.position.z += dz / dist * st;
    p.g.rotation.y = Math.atan2(dx, dz);
    return false;
  }
  function animLegs(g, walking) {
    const u = g.userData, s = walking ? Math.sin(clock * 10 + u.ph) * 0.6 : 0;
    u.legs[0].rotation.x = s; u.legs[1].rotation.x = -s;
    g.children[0].position.y = 0.95 + (walking ? Math.abs(Math.sin(clock * 10 + u.ph)) * 0.05 : 0);
  }

  function update(dt) {
    clock += dt;
    if (!ready) return;
    const cur = bridge.getBiz();
    const key = [cur.id, Math.max(1, cur.lv), cur.mgr ? 1 : 0].join(':');
    if (key !== sig) { sig = key; build(); }
    info = cur;
    if (!room) return;

    if (theme.kind === 'food') {
      spawnT += dt;
      if (spawnT >= spawnEvery()) { spawnT = 0; spawnCustomer(); }
    } else {
      workT += dt;
      if (workT >= 4 && crates.length) {
        workT = 0;
        const c = crates[Math.floor(Math.random() * crates.length)];
        floatText('+₺' + bridge.fmt(rate() * 4), c.x, 1.9, c.z);
      }
    }
    for (let i = people.length - 1; i >= 0; i--) {
      const p = people[i];
      if (p.state === 'in') {
        const done = stepPerson(p, dt, 2.4);
        animLegs(p.g, !done);
        if (done) {
          p.state = 'sit'; p.t = 4.5 + Math.random() * 4;
          p.g.rotation.y = p.seat.face; p.g.position.y = -0.28;
          floatText('+₺' + bridge.fmt(rate() * spawnEvery()), p.seat.x, 2.4, p.seat.z);
        }
      } else if (p.state === 'sit') {
        animLegs(p.g, false);
        p.t -= dt;
        if (p.t <= 0) { p.state = 'out'; p.g.position.y = 0; p.path = [{ x: p.seat.x, z: CORR }, { x: DOOR.x, z: CORR + 0.7 }, { x: DOOR.x, z: DOOR.z }]; p.seat.taken = false; }
      } else {
        const done = stepPerson(p, dt, 2.6);
        animLegs(p.g, !done);
        if (done) { room.remove(p.g); people.splice(i, 1); }
      }
    }
    staff.forEach((st) => {
      if (st.kind === 'cook') { st.g.position.y = Math.sin(clock * 6 + st.x) * 0.03; animLegs(st.g, false); }
      else if (st.kind === 'walker') {
        const a = clock * 0.5 + st.t, wx = theme.kind === 'work' ? Math.sin(a) * 5.5 : Math.sin(a) * 4;
        const wz = theme.kind === 'work' ? 2.2 + Math.cos(a * 0.8) * 1.5 : 1.4 + Math.cos(a) * 0.5;
        const dx = wx - st.g.position.x, dz = wz - st.g.position.z;
        if (Math.hypot(dx, dz) > 0.01) st.g.rotation.y = Math.atan2(dx, dz);
        st.g.position.x = wx; st.g.position.z = wz; animLegs(st.g, true);
      } else if (st.kind === 'boss') { st.star.rotation.y = clock * 2; animLegs(st.g, false); }
    });
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.age += dt;
      f.sp.position.y = f.y0 + f.age * 0.9;
      f.sp.material.opacity = Math.max(0, 1 - Math.max(0, f.age - 0.7) / 0.7);
      if (f.age > 1.4) { room.remove(f.sp); if (f.sp.userData.tex) f.sp.userData.tex.dispose(); f.sp.material.dispose(); floaters.splice(i, 1); }
    }
    renderAcc += dt;
    if (renderAcc >= 1 / 32) { renderAcc = 0; renderer.render(scene, camera); }
  }

  function resize(w, h) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    aspect = Math.max(1, w) / Math.max(1, h);
    fitCamera();
  }
  function dispose() {
    disposeRoom();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* yok say */ }
  }

  const api = { update, resize, dispose, onReady: null, get ready() { return ready; } };
  loadKit((ok) => { if (ok) { ready = true; fitCamera(); } if (api.onReady) api.onReady(ok); });
  return api;
}
