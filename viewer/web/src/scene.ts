// The 3D view. Game coordinates are x east, y up, z north; the 3D library is
// right-handed, so everything is drawn at (x, y, -z).
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { Session, Unit, Sample, Terrain, Shot, sampleAt, radarAt, groundHeight, lerpCol, idxAt, scanPattern } from './data';
import { Trail, Segments } from './lines';
import { envelope, physFor, Phys } from './envelope';

export interface Settings {
  me: string;
  wingmen: string;            // comma-separated player names flown with (for 'me + wingman' Pk)
  pkScope: 'all' | 'self' | 'squad';
  liveRecord: boolean;        // record own-ship telemetry from the game (localhost:8111) while the viewer is open
  units: 'metric' | 'aviation';
  labels: 'all' | 'focus' | 'off';
  lblName: boolean; lblType: boolean; lblAlt: boolean; lblSpeed: boolean;
  missileLabels: boolean;
  acTrail: number;   // seconds of tail; 0 = off; -1 = whole path
  msTrail: number;
  missiles: boolean; cms: boolean; bombs: boolean; ground: boolean; ai: boolean; dead: boolean; sticks: boolean;
  radar: 'off' | 'focus' | 'all';
  desig: 'off' | 'focus' | 'all';
  seeker: boolean;
  activeMark: boolean;        // mark where active-radar missiles switched on their seeker
  msKeep: 'all' | 'focus' | 'off';   // finished missile paths
  shade: boolean; grid: boolean;
  view: '3d' | '2d';
  scanZone: boolean; airfields: boolean; areas: boolean;
  trailStyle: 'line' | 'ribbon'; lineWidth: number; vector: boolean; dlz: boolean;
  // ground battles
  shells: boolean;            // cannon shell arcs (calibre above 14.7 mm)
  mgRounds: boolean;          // machine-gun rounds (14.7 mm and smaller)
  shellKeep: number;          // seconds an arc stays after it lands; -1 = keep all
  gunLines: 'off' | 'focus' | 'all';  // line along each vehicle's gun
  objects: boolean;           // buildings, walls and rocks from the map file
  trees: boolean;             // hand-placed trees and bushes
}

export const COLORS = {
  me: 0xffe14d, friend: 0x4da3ff, enemy: 0xff6a3d, neutral: 0xa8b0bc,
  flare: 0xffd24a, chaff: 0xd5dde6, bomb: 0xffb347, dead: 0x8a93a0,
};

const D2R = Math.PI / 180;
const AC_LEN = 18, MS_LEN = 5, TANK_LEN = 9.5;

interface Vis {
  u: Unit;
  mesh: THREE.Mesh | null;
  turret: THREE.Mesh | null;     // ground vehicles: turns to the recorded gun bearing
  trail: Trail | null;
  wing: number[] | null;
  beam: THREE.Mesh | null;
  scan: THREE.Mesh | null; scanKey: string;
  label: HTMLDivElement | null;
  labelText: string;
  alive: boolean;
  shown: boolean;
  px: number; py: number; pz: number;      // current position, 3D-library coordinates
  sx: number; sy: number; onScreen: boolean;
  color: number;
  focus: boolean;
}

// Tank symbol: hull with a sloped front, origin on the ground at the hull centre,
// front toward -z (like the aircraft). The turret is a separate mesh.
function hullGeometry(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const L = TANK_LEN / 2, W = 1.8, H = 1.7, f = L - 1.4;
  const P = [[-W, 0.35, -f], [W, 0.35, -f], [W, 0.35, L], [-W, 0.35, L], [-W, H, -f + 0.9], [W, H, -f + 0.9], [W, H, L], [-W, H, L], [-W, 0.8, -L], [W, 0.8, -L]];
  const v: number[] = []; const q = (a: number, b: number, c: number, d: number) => { for (const i of [a, b, c, a, c, d]) v.push(...P[i]); };
  q(4, 5, 6, 7);          // top
  q(3, 2, 1, 0);          // bottom
  q(7, 6, 2, 3);          // rear
  q(0, 1, 9, 8); q(8, 9, 5, 4);   // lower and upper glacis
  q(0, 8, 4, 7); q(7, 3, 0, 7);   // left side (approx.)
  q(1, 2, 6, 5); q(5, 9, 1, 5);   // right side
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
}
function turretGeometry(): THREE.BufferGeometry {
  const box = new THREE.BoxGeometry(3.0, 0.9, 3.6); box.translate(0, 0.45, 0.3);
  const gun = new THREE.CylinderGeometry(0.16, 0.2, 5.6, 6); gun.rotateX(Math.PI / 2); gun.translate(0, 0.5, -4.3);
  const g = new THREE.BufferGeometry();
  const a = box.toNonIndexed().getAttribute('position').array as Float32Array, b = gun.toNonIndexed().getAttribute('position').array as Float32Array;
  const v = new Float32Array(a.length + b.length); v.set(a, 0); v.set(b, a.length);
  g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
}

function aircraftGeometry(): THREE.BufferGeometry {
  const v: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => v.push(...a, ...b, ...c);
  const nose = [0, 0, -9], tail = [0, 0.2, 8.5], top = [0, 1.3, 0.5], bot = [0, -0.9, 0.5], l = [-1.3, 0, 1], r = [1.3, 0, 1];
  tri(nose, top, r); tri(nose, l, top); tri(nose, r, bot); tri(nose, bot, l);
  tri(tail, r, top); tri(tail, top, l); tri(tail, bot, r); tri(tail, l, bot);
  // wings
  tri([1.0, 0, -2.5], [6.5, 0, 4.5], [1.0, 0, 5.5]);
  tri([-1.0, 0, -2.5], [-1.0, 0, 5.5], [-6.5, 0, 4.5]);
  // tailplanes
  tri([0.8, 0, 6], [3.4, 0, 9], [0.8, 0, 9]);
  tri([-0.8, 0, 6], [-0.8, 0, 9], [-3.4, 0, 9]);
  // fin
  tri([0, 0.9, 4.5], [0, 4.2, 8.6], [0, 0.6, 8.6]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

const scanGeoCache = new Map<string, THREE.BufferGeometry>();
// Radar scan zone: a wedge from the aircraft, azimuth ±az, elevation el0..el1 (degrees), length 1, pointing along -z.
function scanGeometry(az: number, el0: number, el1: number): THREE.BufferGeometry {
  const key = az + '_' + el0 + '_' + el1; const hit = scanGeoCache.get(key); if (hit) return hit;
  const N = Math.max(4, Math.ceil(az / 6)); const v: number[] = [];
  const P = (a: number, e: number) => [Math.sin(a * D2R) * Math.cos(e * D2R), Math.sin(e * D2R), -Math.cos(a * D2R) * Math.cos(e * D2R)];
  const tri = (a: number[], b: number[], c: number[]) => v.push(...a, ...b, ...c);
  const O = [0, 0, 0];
  for (let i = 0; i < N; i++) {
    const a0 = -az + 2 * az * i / N, a1 = -az + 2 * az * (i + 1) / N;
    const t0 = P(a0, el1), t1 = P(a1, el1), b0 = P(a0, el0), b1 = P(a1, el0);
    tri(O, t0, t1); tri(O, b1, b0); tri(t0, b0, b1); tri(t0, b1, t1);
  }
  tri(O, P(-az, el0), P(-az, el1)); tri(O, P(az, el1), P(az, el0));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  scanGeoCache.set(key, g); return g;
}

// right-wing unit vector (3D-library coordinates) and the up vector's height, from heading/pitch/roll in degrees
function wingOf(hd: number, pd: number, rd: number): number[] {
  const h = hd * D2R, p = pd * D2R, r = rd * D2R;
  const sh = Math.sin(h), ch = Math.cos(h), sp = Math.sin(p), cp = Math.cos(p), sr = Math.sin(r), cr = Math.cos(r);
  const rx0 = ch, rz0 = -sh, ux0 = -sh * sp, uy0 = cp, uz0 = -ch * sp;
  const rx = rx0 * cr - ux0 * sr, ry = -uy0 * sr, rz = rz0 * cr - uz0 * sr;
  return [rx, ry, -rz, uy0 * cr];
}

// diamond outline: where an active-radar missile switched on its own seeker
function diamondTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d')!;
  x.strokeStyle = '#fff'; x.lineWidth = 4; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(16, 3); x.lineTo(29, 16); x.lineTo(16, 29); x.lineTo(3, 16); x.closePath(); x.stroke();
  return new THREE.CanvasTexture(c);
}

function crossTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d')!;
  x.strokeStyle = '#fff'; x.lineWidth = 5; x.lineCap = 'round';
  x.beginPath(); x.moveTo(6, 6); x.lineTo(26, 26); x.moveTo(26, 6); x.lineTo(6, 26); x.stroke();
  return new THREE.CanvasTexture(c);
}

export class Viewer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  cam2d: THREE.OrthographicCamera;
  mode: '3d' | '2d' = '3d';
  controls: OrbitControls;
  session: Session | null = null;
  settings: Settings;
  vis: Vis[] = [];
  byKind: { [k: string]: Vis[] } = {};
  meSlot = -1; myTeam = 0;
  selected = -1; measure = -1; follow = -1;
  onSelect: (id: number, shift: boolean) => void = () => {};
  t = 0;

  private root = new THREE.Group();
  private terrainMesh: THREE.Mesh | null = null;
  private terrainTex: THREE.CanvasTexture | null = null;
  private acGeo = aircraftGeometry();
  private hullGeo = hullGeometry();
  private turretGeo = turretGeometry();
  private shellSeg!: Segments; private mgSeg!: Segments; private gunSeg!: Segments; private impactPts!: THREE.Points; private headPts!: THREE.Points;
  private detailMesh: THREE.Mesh | null = null; private detailTex: THREE.CanvasTexture | null = null;
  private objMeshes: { kind: string, mesh: THREE.InstancedMesh }[] = [];
  private msGeo: THREE.BufferGeometry;
  private beamGeo: THREE.BufferGeometry;
  private cmPts!: THREE.Points; private bombPts!: THREE.Points; private groundPts!: THREE.Points; private deadPts!: THREE.Points; private activePts!: THREE.Points;
  private activeAt = new Map<number, number>(); // missile id -> sample index where an ARH seeker went active
  private sticks!: Segments; private desig!: Segments; private seeker!: Segments;
  private measureSeg!: Segments; private vectors!: Segments; private dlzSeg!: Segments;
  res = new THREE.Vector2(800, 600);
  dlzInfo: { missile: string, rmax: number, rne: number, range: number } | null = null;
  private dlzCache: { key: string, at: number, rmax: number, rne: number, missile: string } | null = null;
  onHover: (id: number, x: number, y: number) => void = () => {};
  onFollowChange: () => void = () => {};
  private selRing!: THREE.Mesh;
  private labelLayer: HTMLElement;
  private container: HTMLElement;
  private s: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, i: 0, f: 0 };
  private lastLabelText = 0;
  private followPrev = new THREE.Vector3();
  private followHas = false;
  private tmpM = new THREE.Matrix4();
  private vX = new THREE.Vector3(); private vY = new THREE.Vector3(); private vZ = new THREE.Vector3();
  private vP = new THREE.Vector3();
  private downAt: { x: number, y: number } | null = null;

  constructor(container: HTMLElement, labelLayer: HTMLElement, settings: Settings) {
    this.container = container; this.labelLayer = labelLayer; this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x161c27);
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(45, 1, 5, 900000);
    this.camera.position.set(0, 40000, 60000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 30; this.controls.maxDistance = 400000;
    this.controls.zoomToCursor = true;
    this.controls.screenSpacePanning = false;
    this.controls.zoomSpeed = 1.6;    // the view spans hundreds of km
    this.controls.rotateSpeed = 0.8;
    // 2D map: straight down, north up, own pan/zoom
    this.cam2d = new THREE.OrthographicCamera(-1, 1, 1, -1, 10, 900000);
    this.cam2d.up.set(0, 0, -1); this.cam2d.position.set(0, 300000, 0); this.cam2d.lookAt(0, 0, 0); this.cam2d.zoom = 0.006;
    this.scene.add(this.root);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(-0.4, 1, 0.5); this.scene.add(sun);
    this.msGeo = new THREE.ConeGeometry(0.7, MS_LEN, 6); this.msGeo.rotateX(-Math.PI / 2);
    this.beamGeo = new THREE.ConeGeometry(1, 1, 20, 1, true); this.beamGeo.translate(0, -0.5, 0); this.beamGeo.rotateX(Math.PI / 2);

    const el = this.renderer.domElement;
    let drag2: { x: number, y: number } | null = null;
    // 3D: these run before the orbit controls' own handlers (capture phase)
    el.addEventListener('pointerdown', e => {
      if (this.mode !== '3d') return;
      const panning = e.button === 2 || (e.button === 0 && (e.ctrlKey || e.metaKey)); // (shift-click is measuring)
      if (panning && this.follow >= 0) { this.setFollow(-1); this.onFollowChange(); } // grabbing the map stops following
      if (this.follow < 0) this.anchorPivot();  // orbit around what is in the middle of the screen
    }, { capture: true });
    el.addEventListener('wheel', () => { if (this.mode === '3d' && this.follow < 0) this.anchorPivot(); }, { capture: true, passive: true });
    el.addEventListener('pointerdown', e => { this.downAt = { x: e.clientX, y: e.clientY }; if (this.mode === '2d') { drag2 = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); } });
    el.addEventListener('pointermove', e => {
      if (!drag2 && !(e.buttons & 7)) {
        const r = el.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        this.onHover(this.pick(x, y), x, y);
      }
      if (this.mode !== '2d' || !drag2) return;
      const k = 1 / this.cam2d.zoom;
      if (this.follow < 0) { this.cam2d.position.x -= (e.clientX - drag2.x) * k; this.cam2d.position.z -= (e.clientY - drag2.y) * k; }
      drag2 = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener('pointercancel', () => { drag2 = null; });
    el.addEventListener('pointerleave', () => this.onHover(-1, 0, 0));
    el.addEventListener('wheel', e => {
      if (this.mode !== '2d') return;
      e.preventDefault();
      const r = el.getBoundingClientRect(), c = this.cam2d;
      const mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
      const z0 = c.zoom, z1 = Math.min(2, Math.max(0.002, z0 * Math.pow(1.0015, -e.deltaY)));
      if (this.follow < 0) { c.position.x += mx / z0 - mx / z1; c.position.z += my / z0 - my / z1; }
      c.zoom = z1; c.updateProjectionMatrix();
    }, { passive: false });
    el.addEventListener('pointerup', e => {
      drag2 = null;
      if (!this.downAt) return;
      const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
      this.downAt = null;
      if (moved < 5 && e.button === 0) {
        const r = el.getBoundingClientRect();
        const id = this.pick(e.clientX - r.left, e.clientY - r.top);
        if (id >= 0) this.onSelect(id, e.shiftKey);
      }
    });
    el.addEventListener('dblclick', e => {
      const r = el.getBoundingClientRect();
      const id = this.pick(e.clientX - r.left, e.clientY - r.top);
      if (id >= 0) { this.onSelect(id, false); this.setFollow(id); this.onFollowChange(); return; }
      if (this.mode !== '3d') return;
      const g = this.groundUnder(e.clientX - r.left, e.clientY - r.top);   // double-click the ground: centre the view there
      if (g) {
        if (this.follow >= 0) { this.setFollow(-1); this.onFollowChange(); }
        const d = g.clone().sub(this.controls.target);
        this.controls.target.add(d); this.camera.position.add(d); this.controls.update();
      }
    });
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
  }

  // First point where the ray from the camera through screen pixel (x, y) meets the
  // ground (terrain, or sea level without a terrain file), or null if it does not
  // within 400 km (looking at the sky).
  groundUnder(x: number, y: number): THREE.Vector3 | null {
    const W = this.container.clientWidth || 800, H = this.container.clientHeight || 600;
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x / W * 2 - 1, -(y / H) * 2 + 1), this.camera);
    return this.marchGround(ray.ray.origin, ray.ray.direction);
  }
  private marchGround(o: THREE.Vector3, d: THREE.Vector3): THREE.Vector3 | null {
    const tr = this.session ? this.session.terrain : null;
    const above = (p: THREE.Vector3) => p.y - groundHeight(tr, p.x, -p.z);
    const p = o.clone(); let prev = 0, s = 0;
    if (above(p) <= 0) return null;
    for (let i = 0; i < 400 && s < 400000; i++) {
      const h = above(p);
      if (h <= 0) {             // crossed: refine between prev and s
        let a = prev, b = s;
        for (let k = 0; k < 20; k++) { const m = (a + b) / 2; p.copy(o).addScaledVector(d, m); if (above(p) > 0) a = m; else b = m; }
        return p.copy(o).addScaledVector(d, b);
      }
      prev = s; s += Math.max(20, h * 0.5);  // step by half the height above the ground
      p.copy(o).addScaledVector(d, s);
    }
    return null;
  }
  // Put the orbit pivot on the ground point in the middle of the screen. The point
  // lies on the line of sight, so the view does not move; rotating then turns
  // around what you are looking at, and zooming can go all the way to the ground.
  anchorPivot() {
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    const g = this.marchGround(this.camera.position, dir);
    if (g && g.distanceTo(this.camera.position) > this.controls.minDistance * 1.5) this.controls.target.copy(g);
  }

  resize() {
    const w = this.container.clientWidth || 800, h = this.container.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px'; this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.res.set(w, h);
    const c = this.cam2d; c.left = -w / 2; c.right = w / 2; c.top = h / 2; c.bottom = -h / 2; c.updateProjectionMatrix();
  }

  // ---------- session ----------
  setSession(s: Session) {
    this.session = s;
    this.controls.minDistance = s.ground ? 6 : 30;
    this.root.clear();
    this.labelLayer.innerHTML = '';
    this.vis = []; this.byKind = { aircraft: [], missile: [], countermeasure: [], bomb: [], ground: [] };
    this.selected = this.measure = this.follow = -1; this.followHas = false;
    this.resolveMe();
    this.buildTerrain(s.terrain);

    for (const u of s.units) {
      const v: Vis = { u, mesh: null, turret: null, trail: null, wing: null, beam: null, scan: null, scanKey: '', label: null, labelText: '',
        alive: false, shown: false, px: 0, py: 0, pz: 0, sx: 0, sy: 0, onScreen: false, color: 0xffffff, focus: false };
      this.vis.push(v); this.byKind[u.kind].push(v);
      if (u.kind === 'aircraft' || u.kind === 'missile') {
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true });
        v.mesh = new THREE.Mesh(u.kind === 'aircraft' ? this.acGeo : this.msGeo, mat);
        v.mesh.matrixAutoUpdate = false; v.mesh.frustumCulled = false; v.mesh.visible = false;
        this.root.add(v.mesh);
        // one extra sample slot for the current (in-between) position
        const n = u.n + 1;
        const pos = new Float32Array(n * 3), tsec = new Float32Array(n);
        const wing = u.heading ? new Float32Array(n * 3) : null, up = u.heading ? new Float32Array(n) : null;
        for (let i = 0; i < n; i++) {
          const k = Math.min(i, u.n - 1);
          pos[i * 3] = u.x[k]; pos[i * 3 + 1] = u.y[k]; pos[i * 3 + 2] = -u.z[k]; tsec[i] = (u.t[k] - s.t0) / 1000;
          if (wing && up) {
            const w = wingOf(u.heading![k], u.pitch![k], u.roll![k]);
            wing[i * 3] = w[0]; wing[i * 3 + 1] = w[1]; wing[i * 3 + 2] = w[2]; up[i] = w[3];
          }
        }
        v.trail = new Trail(pos, wing, up, tsec);
        v.trail.mat.uniforms.uRes.value = this.res;
        this.root.add(v.trail.mesh);
      } else if (u.kind === 'ground' && !u.isStatic) {
        // moving ground vehicles: hull + turret + track
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true });
        v.mesh = new THREE.Mesh(this.hullGeo, mat);
        v.turret = new THREE.Mesh(this.turretGeo, mat);
        for (const m of [v.mesh, v.turret]) { m.matrixAutoUpdate = false; m.frustumCulled = false; m.visible = false; this.root.add(m); }
        const n = u.n + 1;
        const pos = new Float32Array(n * 3), tsec = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const k = Math.min(i, u.n - 1);
          pos[i * 3] = u.x[k]; pos[i * 3 + 1] = u.y[k] + 0.6; pos[i * 3 + 2] = -u.z[k]; tsec[i] = (u.t[k] - s.t0) / 1000;
        }
        v.trail = new Trail(pos, null, null, tsec);
        v.trail.mat.uniforms.uRes.value = this.res;
        this.root.add(v.trail.mesh);
      }
    }

    const mkPts = (cap: number, size: number, map?: THREE.Texture) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(Math.max(1, cap) * 3), 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Math.max(1, cap) * 3), 3).setUsage(THREE.DynamicDrawUsage));
      const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, map: map || null, alphaTest: map ? 0.3 : 0, transparent: !!map });
      const p = new THREE.Points(g, m); p.frustumCulled = false; g.setDrawRange(0, 0); this.root.add(p); return p;
    };
    this.cmPts = mkPts(this.byKind.countermeasure.length, 3.5);
    this.bombPts = mkPts(this.byKind.bomb.length, 4.5);
    this.groundPts = mkPts(this.byKind.ground.length, 5);
    this.deadPts = mkPts(this.byKind.aircraft.length + this.byKind.ground.length, 11, crossTexture());
    this.impactPts = mkPts(4096, 7);
    this.headPts = mkPts(8192, 4);
    this.activeAt.clear();
    for (const v of this.byKind.missile) {
      const u = v.u; if (!u.seekerMode || !u.missile || u.missile.guidance !== 'ARH') continue;
      const i = Array.from(u.seekerMode).indexOf(2); if (i >= 0) this.activeAt.set(u.id, i);
    }
    this.activePts = mkPts(Math.max(1, this.activeAt.size), 13, diamondTexture());

    const mkSeg = (cap: number, width: number, opacity: number) => {
      const sg = new Segments(cap, width, opacity); sg.mat.uniforms.uRes.value = this.res; this.root.add(sg.mesh); return sg;
    };
    this.sticks = mkSeg(this.byKind.aircraft.length, 1, 0.35);
    this.desig = mkSeg(this.byKind.aircraft.length * 8, 1.6, 0.9);
    this.seeker = mkSeg(this.byKind.missile.length, 1.4, 0.85);
    this.measureSeg = mkSeg(1, 2, 0.95);
    this.vectors = mkSeg(this.byKind.aircraft.length, 1.5, 0.8);
    this.dlzSeg = mkSeg(256, 2, 0.85);
    let capC = 1, capM = 1;
    if (s.shots) for (const sh of s.shots.list) { if (sh.cls === 'mg') capM += sh.n + 1; else capC += sh.n + 1; }
    this.shellSeg = mkSeg(Math.min(capC, 400000), 2.4, 0.95);
    this.mgSeg = mkSeg(Math.min(capM, 400000), 1.0, 0.75);
    this.gunSeg = mkSeg(this.byKind.ground.length, 1.2, 0.7);
    this.dlzCache = null; this.dlzInfo = null;

    const ring = new THREE.RingGeometry(0.82, 1, 40);
    this.selRing = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false }));
    this.selRing.visible = false; this.selRing.renderOrder = 10; this.root.add(this.selRing);

    this.buildMapOverlays();
    this.restyle();
    this.homeCamera();
  }

  resolveMe() {
    const s = this.session!; const want = (this.settings.me || '').trim().toLowerCase();
    this.meSlot = -1; this.myTeam = 0;
    if (want) for (const p of s.players) if (p.name.toLowerCase() === want) { this.meSlot = p.slot; this.myTeam = p.team; }
    if (this.meSlot < 0 && want) for (const p of s.players) if (p.name.toLowerCase().includes(want)) { this.meSlot = p.slot; this.myTeam = p.team; break; }
  }

  colorFor(u: Unit): number {
    if (u.owner >= 0 && u.owner === this.meSlot) return COLORS.me;
    if (!u.team) return COLORS.neutral;
    const friendlyTeam = this.myTeam || 1;
    return u.team === friendlyTeam ? COLORS.friend : COLORS.enemy;
  }

  isFocus(u: Unit): boolean {
    if (u.id === this.selected || u.id === this.measure) return true;
    const s = this.session!;
    if (u.owner >= 0) {
      const p = s.playerBySlot.get(u.owner);
      if (p && p.highlight) return true;
      const sel = this.selected >= 0 ? s.units[this.selected] : null;
      if (sel && sel.owner === u.owner) return true;
    }
    return false;
  }

  // Colours and emphasis; call after highlight / hide / selection / "me" change.
  restyle() {
    if (!this.session) return;
    const c = new THREE.Color(), white = new THREE.Color(0xffffff);
    for (const v of this.vis) {
      v.color = this.colorFor(v.u);
      v.focus = this.isFocus(v.u);
      if (v.mesh) {
        c.set(v.color); if (v.u.kind === 'missile') c.lerp(white, 0.35);
        if (v.u.kind === 'ground' && v.u.player < 0) c.multiplyScalar(0.7);
        (v.mesh.material as THREE.MeshLambertMaterial).color.copy(c);
        const tu = v.trail!.mat.uniforms;
        (tu.uColor.value as THREE.Color).copy(c); tu.uOpacity.value = v.focus ? 1 : (v.u.kind === 'missile' ? 0.8 : 0.55);
      }
      if (v.label) v.label.classList.toggle('focus', v.focus);
    }
    // fixed ground objects (anti-aircraft guns, radars): fill once
    const g = this.byKind.ground.filter(v => !v.mesh); const pos = this.groundPts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const col = this.groundPts.geometry.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < g.length; i++) {
      const u = g[i].u; c.set(this.colorFor(u)).multiplyScalar(0.75);
      col.setXYZ(i, c.r, c.g, c.b);
      pos.setXYZ(i, u.x[0], Math.max(u.y[0], groundHeight(this.session.terrain, u.x[0], u.z[0])) + (this.session.ground ? 3 : 8), -u.z[0]);
    }
    this.nStaticGround = g.length;
    pos.needsUpdate = true; col.needsUpdate = true;
  }

  // ---------- airfields and mission areas ----------
  private nStaticGround = 0;
  private airfieldLines: Segments | null = null;
  private areaLines: Segments | null = null;
  private mapLabels: { x: number, y: number, z: number, div: HTMLDivElement, kind: string }[] = [];

  buildMapOverlays() {
    const ses = this.session!; this.mapLabels = []; this.airfieldLines = null; this.areaLines = null;
    const mp = ses.map; if (!mp) return;
    const gh = (x: number, z: number) => groundHeight(ses.terrain, x, z);
    const mk = (pos: number[], col: number[], opacity: number) => {
      const n = pos.length / 6; const sg = new Segments(n, 1.6, opacity); sg.mat.uniforms.uRes.value = this.res;
      const ca = new THREE.Color(); sg.begin();
      for (let i = 0; i < n; i++) { ca.setRGB(col[i * 6], col[i * 6 + 1], col[i * 6 + 2]); sg.add(pos[i * 6], pos[i * 6 + 1], pos[i * 6 + 2], pos[i * 6 + 3], pos[i * 6 + 4], pos[i * 6 + 5], ca); }
      sg.end(); this.root.add(sg.mesh); return sg;
    };
    const label = (text: string, x: number, y: number, z: number, kind: string) => {
      const d = document.createElement('div'); d.className = 'lbl map'; d.textContent = text; d.style.display = 'none';
      this.labelLayer.appendChild(d); this.mapLabels.push({ x, y, z: -z, div: d, kind });
    };
    const c = new THREE.Color(); let pos: number[] = [], col: number[] = [];
    const seg = (x0: number, z0: number, x1: number, z1: number, lift: number) => {
      pos.push(x0, gh(x0, z0) + lift, -z0, x1, gh(x1, z1) + lift, -z1); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    };
    const friendly = this.myTeam || 1;
    for (const a of mp.airfields || []) {
      c.set(a.team === friendly ? COLORS.friend : a.team ? COLORS.enemy : COLORS.neutral).lerp(new THREE.Color(0xffffff), 0.35);
      const L = (a.lengthM || 0) / 2, Wd = Math.max(60, (a.widthM || 0) / 2), h = (a.headingDeg || 0) * D2R;
      if (L > 0) {
        const fx = Math.sin(h), fz = Math.cos(h), sx = Math.cos(h), sz = -Math.sin(h);
        const p = [[-L, -Wd], [L, -Wd], [L, Wd], [-L, Wd]].map(([l, w]) => [a.x + fx * l + sx * w, a.z + fz * l + sz * w]);
        for (let i = 0; i < 4; i++) seg(p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], 6);
        seg(a.x - fx * L, a.z - fz * L, a.x + fx * L, a.z + fz * L, 6);
      } else {
        for (let i = 0; i < 16; i++) { const a0 = i / 16 * 6.2832, a1 = (i + 1) / 16 * 6.2832; seg(a.x + 800 * Math.cos(a0), a.z + 800 * Math.sin(a0), a.x + 800 * Math.cos(a1), a.z + 800 * Math.sin(a1), 6); }
      }
      label((a.team === friendly ? 'My team airfield' : 'Enemy airfield'), a.x, gh(a.x, a.z) + 6, a.z, 'airfield');
    }
    if (pos.length) this.airfieldLines = mk(pos, col, 0.95);
    pos = []; col = [];
    for (const a of mp.areas || []) {
      if (a.role === 'airSpawn') continue;
      c.set(a.role === 'missionBorder' ? 0xffffff : a.role === 'reloadArea' ? 0x9fd6a8 : 0xd9c7ff);
      if (a.type === 'Sphere' || a.type === 'Cylinder') {
        const r = a.sizeX / 2, n = 96;
        for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832; seg(a.x + r * Math.cos(a0), a.z + r * Math.sin(a0), a.x + r * Math.cos(a1), a.z + r * Math.sin(a1), 40); }
        label(a.name.replace(/_/g, ' '), a.x, gh(a.x, a.z + r) + 40, a.z + r, 'area');
      } else if (a.type === 'Box') {
        const h = (a.rotationDeg || 0) * D2R, ax = Math.sin(h), az = Math.cos(h), bx = Math.cos(h), bz = -Math.sin(h), hx = a.sizeX / 2, hz = a.sizeZ / 2;
        const p = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([l, w]) => [a.x + ax * l + bx * w, a.z + az * l + bz * w]);
        for (let i = 0; i < 4; i++) for (let k = 0; k < 16; k++) {
          const q0 = p[i], q1 = p[(i + 1) % 4];
          seg(q0[0] + (q1[0] - q0[0]) * k / 16, q0[1] + (q1[1] - q0[1]) * k / 16, q0[0] + (q1[0] - q0[0]) * (k + 1) / 16, q0[1] + (q1[1] - q0[1]) * (k + 1) / 16, 40);
        }
        label(a.name.replace(/_/g, ' '), p[2][0], gh(p[2][0], p[2][1]) + 40, p[2][1], 'area');
      }
    }
    if (pos.length) this.areaLines = mk(pos, col, 0.6);
  }

  private updateMapOverlays(W: number, H: number) {
    const st = this.settings;
    if (this.airfieldLines) this.airfieldLines.mesh.visible = st.airfields;
    if (this.areaLines) this.areaLines.mesh.visible = st.areas;
    for (const m of this.mapLabels) {
      const on = m.kind === 'airfield' ? st.airfields : st.areas;
      let show = false;
      if (on) {
        this.vP.set(m.x, m.y, m.z).project(this.cam);
        show = this.vP.z < 1 && Math.abs(this.vP.x) < 1 && Math.abs(this.vP.y) < 1;
        if (show) m.div.style.transform = `translate(${Math.round((this.vP.x * 0.5 + 0.5) * W + 6)}px, ${Math.round((-this.vP.y * 0.5 + 0.5) * H - 6)}px)`;
      }
      const disp = show ? '' : 'none'; if (m.div.style.display !== disp) m.div.style.display = disp;
    }
  }

  // ---------- terrain ----------
  buildTerrain(tr: Terrain | null) {
    const ext = tr ? { x0: tr.x0, z0: tr.z0, x1: tr.x1, z1: tr.z1 } : { x0: -65536, z0: -65536, x1: 65536, z1: 65536 };
    const N = 513;
    const pos = new Float32Array(N * N * 3), uv = new Float32Array(N * N * 2);
    for (let r = 0; r < N; r++) for (let cI = 0; cI < N; cI++) {
      const x = ext.x0 + (ext.x1 - ext.x0) * cI / (N - 1), z = ext.z0 + (ext.z1 - ext.z0) * r / (N - 1);
      const k = (r * N + cI) * 3;
      pos[k] = x; pos[k + 1] = tr ? groundHeight(tr, x, z) : 0; pos[k + 2] = -z;
      uv[(r * N + cI) * 2] = cI / (N - 1); uv[(r * N + cI) * 2 + 1] = r / (N - 1);
    }
    const idx = new Uint32Array((N - 1) * (N - 1) * 6); let q = 0;
    const dt = tr ? tr.detail : null;
    const inDetail = (k: number) => !!dt && pos[k * 3] > dt.x0 && pos[k * 3] < dt.x0 + (dt.w - 1) * dt.cell && -pos[k * 3 + 2] > dt.z0 && -pos[k * 3 + 2] < dt.z0 + (dt.h - 1) * dt.cell;
    const sp = (ext.x1 - ext.x0) / (N - 1);   // coarse vertex spacing
    const nearDetail = (k: number) => !!dt && pos[k * 3] > dt.x0 - sp && pos[k * 3] < dt.x0 + (dt.w - 1) * dt.cell + sp && -pos[k * 3 + 2] > dt.z0 - sp && -pos[k * 3 + 2] < dt.z0 + (dt.h - 1) * dt.cell + sp;
    // inside the 2 m battle area the coarse surface is dropped out of sight (the
    // fine mesh covers it); its edge triangles slope down under the fine mesh
    if (dt) for (let k = 0; k < N * N; k++) if (nearDetail(k)) pos[k * 3 + 1] -= 40;
    for (let r = 0; r < N - 1; r++) for (let cI = 0; cI < N - 1; cI++) {
      const a = r * N + cI, b = a + 1, d = a + N, e = d + 1;
      if (dt && inDetail(a) && inDetail(b) && inDetail(d) && inDetail(e)) continue;  // the 2 m battle-area mesh covers it
      idx[q++] = a; idx[q++] = b; idx[q++] = d; idx[q++] = b; idx[q++] = e; idx[q++] = d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx.subarray(0, q), 1));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    this.terrainTex = new THREE.CanvasTexture(canvas);
    this.terrainTex.colorSpace = THREE.SRGBColorSpace; this.terrainTex.anisotropy = 8;
    this.terrainMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.terrainTex }));
    this.root.add(this.terrainMesh);
    const skirt = new THREE.Mesh(new THREE.PlaneGeometry(2000000, 2000000), new THREE.MeshBasicMaterial({ color: 0x10151d }));
    skirt.rotation.x = -Math.PI / 2; skirt.position.y = (tr ? Math.min(tr.hMin, tr.water) : 0) - 30; this.root.add(skirt);
    this.detailMesh = null; this.detailTex = null;
    if (dt) this.buildDetail(tr!);
    this.buildObjects(tr);
    this.paintTerrain();
  }

  // Buildings, walls, rocks and trees: one instanced shape per kind. Each object
  // is its type's bounding box (trees: a cone in it), placed with the object's
  // own transform. Game x,y,z -> drawn at x,y,-z: M3 = F·M·F with F = diag(1,1,-1)
  // keeps the transform a proper rotation (no mirroring).
  private buildObjects(tr: Terrain | null) {
    this.objMeshes = [];
    const ob = tr ? tr.objects : null; if (!ob) return;
    const STYLE: { [k: string]: { color: number, geo: THREE.BufferGeometry } } = {
      building: { color: 0xc9bfae, geo: new THREE.BoxGeometry(1, 1, 1) },
      wall: { color: 0x9a948a, geo: new THREE.BoxGeometry(1, 1, 1) },
      rock: { color: 0x8a8070, geo: new THREE.DodecahedronGeometry(0.5, 0) },
      tree: { color: 0x4f6b3a, geo: new THREE.ConeGeometry(0.5, 1, 7) },
    };
    const byKind = new Map<string, number[]>();
    for (let i = 0; i < ob.n; i++) {
      const ty = ob.types[ob.t[i]]; if (!ty) continue;
      let l = byKind.get(ty.kind); if (!l) { l = []; byKind.set(ty.kind, l); } l.push(i);
    }
    const m = new THREE.Matrix4();
    for (const [kind, list] of byKind) {
      const st = STYLE[kind]; if (!st) continue;
      const mesh = new THREE.InstancedMesh(st.geo, new THREE.MeshLambertMaterial({ color: st.color, flatShading: true }), list.length);
      list.forEach((i, k) => {
        const ty = ob.types[ob.t[i]], r = ob.r, b = i * 9, p = ob.p;
        const sx = ty.max[0] - ty.min[0], sy = ty.max[1] - ty.min[1], sz = ty.max[2] - ty.min[2];
        const cx = (ty.max[0] + ty.min[0]) / 2, cy = (ty.max[1] + ty.min[1]) / 2, cz = (ty.max[2] + ty.min[2]) / 2;
        // A = F R F (columns: x axis, y axis, z axis), centre offset F R c
        const ax = [r[b], r[b + 1], -r[b + 2]], ay = [r[b + 3], r[b + 4], -r[b + 5]], az = [-r[b + 6], -r[b + 7], r[b + 8]];
        const ox = p[i * 3] + r[b] * cx + r[b + 3] * cy + r[b + 6] * cz;
        const oy = p[i * 3 + 1] + r[b + 1] * cx + r[b + 4] * cy + r[b + 7] * cz;
        const oz = -(p[i * 3 + 2] + r[b + 2] * cx + r[b + 5] * cy + r[b + 8] * cz);
        m.set(ax[0] * sx, ay[0] * sy, az[0] * sz, ox,
          ax[1] * sx, ay[1] * sy, az[1] * sz, oy,
          ax[2] * sx, ay[2] * sy, az[2] * sz, oz,
          0, 0, 0, 1);
        mesh.setMatrixAt(k, m);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
      this.root.add(mesh); this.objMeshes.push({ kind, mesh });
    }
  }

  // The tank battle area at 2 m (shown on an 8 m mesh; the picture uses every sample).
  private buildDetail(tr: Terrain) {
    const d = tr.detail!; const step = Math.max(1, Math.round(d.w / 512));
    const nx = Math.floor((d.w - 1) / step) + 1, nz = Math.floor((d.h - 1) / step) + 1;
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
    for (let r = 0; r < nz; r++) for (let c = 0; c < nx; c++) {
      const k = r * nx + c, x = d.x0 + c * step * d.cell, z = d.z0 + r * step * d.cell;
      pos[k * 3] = x; pos[k * 3 + 1] = Math.max(d.v[(r * step) * d.w + c * step], tr.water); pos[k * 3 + 2] = -z;
      uv[k * 2] = (c * step) / (d.w - 1); uv[k * 2 + 1] = (r * step) / (d.h - 1);
    }
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
    for (let r = 0; r < nz - 1; r++) for (let c = 0; c < nx - 1; c++) {
      const a = r * nx + c, b = a + 1, e = a + nx, f = e + 1;
      idx[q++] = a; idx[q++] = b; idx[q++] = e; idx[q++] = b; idx[q++] = f; idx[q++] = e;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const cv = document.createElement('canvas'); cv.width = cv.height = Math.min(2048, d.w);
    this.detailTex = new THREE.CanvasTexture(cv); this.detailTex.colorSpace = THREE.SRGBColorSpace; this.detailTex.anisotropy = 8;
    this.detailMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.detailTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    this.root.add(this.detailMesh);
  }

  paintTerrain() {
    if (!this.terrainTex || !this.session) return;
    const tr = this.session.terrain;
    const cv = this.terrainTex.image as HTMLCanvasElement; const W = cv.width;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(W, W); const d = img.data;
    const ramp = [[58, 74, 54], [92, 104, 72], [128, 124, 92], [150, 140, 118], [186, 180, 170], [225, 224, 220]];
    if (tr) {
      // with a tank battle area, colour the whole map on its height scale so the two grids match
      const lo = tr.detail ? tr.detail.hMin : tr.hMin, hi = tr.detail ? tr.detail.hMax : tr.hMax;
      const n = tr.n, h = tr.h, span = Math.max(1, hi - Math.max(lo, tr.water));
      const base = Math.max(lo, tr.water);
      const lx = -0.6, lz = 0.6, ly = 0.55; const ll = Math.hypot(lx, ly, lz);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const v = h[r * n + c];
        const o = ((n - 1 - r) * W + c) * 4;
        if (v <= tr.water + 0.5) { d[o] = 38; d[o + 1] = 58; d[o + 2] = 82; d[o + 3] = 255; continue; }
        let f = Math.min(0.999, Math.max(0, (v - base) / span)) * (ramp.length - 1);
        const i = Math.floor(f); f -= i;
        let R = ramp[i][0] + (ramp[i + 1][0] - ramp[i][0]) * f, G = ramp[i][1] + (ramp[i + 1][1] - ramp[i][1]) * f, B = ramp[i][2] + (ramp[i + 1][2] - ramp[i][2]) * f;
        let sh = 1;
        if (this.settings.shade) {
          const cl = Math.max(0, c - 1), cr = Math.min(n - 1, c + 1), rd = Math.max(0, r - 1), ru = Math.min(n - 1, r + 1);
          const dx = (h[r * n + cr] - h[r * n + cl]) / ((cr - cl) * tr.cell) * 1.6;
          const dz = (h[ru * n + c] - h[rd * n + c]) / ((ru - rd) * tr.cell) * 1.6;
          const nl = Math.hypot(dx, 1, dz);
          sh = 0.5 + 0.62 * Math.max(0, (-dx * lx + ly - dz * lz) / (nl * ll)) / (ly / ll);
          sh = Math.min(1.3, sh);
        }
        d[o] = Math.min(255, R * sh); d[o + 1] = Math.min(255, G * sh); d[o + 2] = Math.min(255, B * sh); d[o + 3] = 255;
      }
    } else {
      for (let i = 0; i < d.length; i += 4) { d[i] = 44; d[i + 1] = 52; d[i + 2] = 60; d[i + 3] = 255; }
    }
    ctx.putImageData(img, 0, 0);
    if (this.settings.grid) {
      const x0 = tr ? tr.x0 : -65536, x1 = tr ? tr.x1 : 65536, z0 = tr ? tr.z0 : -65536, z1 = tr ? tr.z1 : 65536;
      ctx.lineWidth = 1;
      for (let km = Math.ceil(x0 / 10000) * 10; km * 1000 <= x1; km += 10) {
        const px = (km * 1000 - x0) / (x1 - x0) * W;
        ctx.strokeStyle = km === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.16)';
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, W); ctx.stroke();
      }
      for (let km = Math.ceil(z0 / 10000) * 10; km * 1000 <= z1; km += 10) {
        const py = W - (km * 1000 - z0) / (z1 - z0) * W;
        ctx.strokeStyle = km === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.16)';
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, W - 2);
    }
    this.terrainTex.needsUpdate = true;
    if (this.detailTex && tr && tr.detail) this.paintDetail(tr);
  }

  private paintDetail(tr: Terrain) {
    const d = tr.detail!, cv = this.detailTex!.image as HTMLCanvasElement, W = cv.width, ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(W, W), px = img.data;
    const ramp = [[58, 74, 54], [92, 104, 72], [128, 124, 92], [150, 140, 118], [186, 180, 170], [225, 224, 220]];
    // colour by height within the battle area (it is small; whole-map colours would be flat)
    const base = Math.max(d.hMin, tr.water), span = Math.max(1, d.hMax - base);
    const lx = -0.6, lz = 0.6, ly = 0.55, ll = Math.hypot(lx, ly, lz);
    const k = (d.w - 1) / (W - 1), v = d.v, w = d.w;
    for (let r = 0; r < W; r++) for (let c = 0; c < W; c++) {
      const sc = Math.min(d.w - 2, Math.round(c * k)), sr = Math.min(d.h - 2, Math.round(r * k));
      const h = v[sr * w + sc]; const o = ((W - 1 - r) * W + c) * 4;
      if (h <= tr.water + 0.3) { px[o] = 38; px[o + 1] = 58; px[o + 2] = 82; px[o + 3] = 255; continue; }
      let f = Math.min(0.999, Math.max(0, (h - base) / span)) * (ramp.length - 1);
      const i = Math.floor(f); f -= i;
      let R = ramp[i][0] + (ramp[i + 1][0] - ramp[i][0]) * f, G = ramp[i][1] + (ramp[i + 1][1] - ramp[i][1]) * f, B = ramp[i][2] + (ramp[i + 1][2] - ramp[i][2]) * f;
      let shd = 1;
      if (this.settings.shade) {
        const cl = Math.max(0, sc - 1), cr = sc + 1, rd = Math.max(0, sr - 1), ru = sr + 1;
        const dx = (v[sr * w + cr] - v[sr * w + cl]) / ((cr - cl) * d.cell) * 1.6;
        const dz = (v[ru * w + sc] - v[rd * w + sc]) / ((ru - rd) * d.cell) * 1.6;
        const nl = Math.hypot(dx, 1, dz);
        shd = Math.min(1.3, 0.5 + 0.62 * Math.max(0, (-dx * lx + ly - dz * lz) / (nl * ll)) / (ly / ll));
      }
      px[o] = Math.min(255, R * shd); px[o + 1] = Math.min(255, G * shd); px[o + 2] = Math.min(255, B * shd); px[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (this.settings.grid) {
      // 250 m grid: the scale for tank ranges
      const size = (d.w - 1) * d.cell;
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.13)';
      for (let m = Math.ceil(d.x0 / 250) * 250; m <= d.x0 + size; m += 250) { const p = (m - d.x0) / size * W; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke(); }
      for (let m = Math.ceil(d.z0 / 250) * 250; m <= d.z0 + size; m += 250) { const p = W - (m - d.z0) / size * W; ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke(); }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, W - 3);
    this.detailTex!.needsUpdate = true;
  }

  // ---------- camera ----------
  get cam(): THREE.Camera { return this.mode === '2d' ? this.cam2d : this.camera; }

  setMode(m: '3d' | '2d') {
    if (m === this.mode) return;
    if (m === '2d') {
      // start the map where the 3D view was looking
      const t = this.controls.target; this.cam2d.position.set(t.x, 300000, t.z);
      const H = this.container.clientHeight || 600;
      const d = this.camera.position.distanceTo(t);
      this.cam2d.zoom = Math.min(0.05, Math.max(0.002, H / (2 * d * Math.tan(this.camera.fov * D2R / 2))));
      this.cam2d.updateProjectionMatrix();
    } else {
      const off = this.camera.position.clone().sub(this.controls.target);
      this.controls.target.set(this.cam2d.position.x, this.controls.target.y, this.cam2d.position.z);
      this.camera.position.copy(this.controls.target).add(off);
    }
    this.mode = m; this.controls.enabled = m === '3d'; this.followHas = false;
  }
  metresPerPx(): number { return 1 / this.cam2d.zoom; }

  homeCamera() {
    const s = this.session!; let cx = 0, cz = 0, n = 0;
    if (s.ground) {
      // ground battle: look at the tank battle area from about 3 km
      for (const v of this.byKind.ground) if (v.u.player >= 0) { const m = v.u.n >> 1; cx += v.u.x[m]; cz += v.u.z[m]; n++; }
      if (n) { cx /= n; cz /= n; }
      const d = s.terrain && s.terrain.detail ? s.terrain.detail : null;
      if (d) { cx = d.x0 + d.w * d.cell / 2; cz = d.z0 + d.h * d.cell / 2; }
      const gy = groundHeight(s.terrain, cx, cz);
      this.controls.target.set(cx, gy, -cz);
      this.camera.position.set(cx - 600, gy + 2600, -cz + 2400);
      this.follow = -1; this.followHas = false; this.controls.zoomToCursor = true; this.controls.update();
      const W = this.container.clientWidth || 800, H = this.container.clientHeight || 600;
      this.cam2d.position.set(cx, 300000, -cz); this.cam2d.zoom = Math.min(W, H) / 5000; this.cam2d.updateProjectionMatrix();
      return;
    }
    for (const v of this.byKind.aircraft) if (v.u.player >= 0) { const m = v.u.n >> 1; cx += v.u.x[m]; cz += v.u.z[m]; n++; }
    if (n) { cx /= n; cz /= n; }
    const gy = groundHeight(s.terrain, cx, cz);
    this.controls.target.set(cx, gy + 2000, -cz);
    this.camera.position.set(cx - 15000, gy + 55000, -cz + 60000);
    this.follow = -1; this.followHas = false;
    this.controls.zoomToCursor = true;
    this.controls.update();
    const W = this.container.clientWidth || 800, H = this.container.clientHeight || 600;
    this.cam2d.position.set(0, 300000, 0); this.cam2d.zoom = Math.min(W, H) / 140000; this.cam2d.updateProjectionMatrix();
  }

  topView() {
    if (this.mode === '2d') return;
    const t = this.controls.target; const d = Math.max(20000, this.camera.position.distanceTo(t));
    this.camera.position.set(t.x, t.y + d, t.z + d * 0.02);
    this.controls.update();
  }

  setFollow(id: number) {
    this.follow = id; this.followHas = false;
    this.controls.zoomToCursor = id < 0;
    if (id >= 0 && this.mode === '2d') {
      this.unitPos(this.vis[id].u, this.t, this.vP); this.cam2d.position.x = this.vP.x; this.cam2d.position.z = this.vP.z;
      const minZ = this.vis[id].u.kind === 'ground' ? 0.3 : 0.02;   // tanks: about 3 m per pixel
      if (this.cam2d.zoom < minZ) { this.cam2d.zoom = minZ; this.cam2d.updateProjectionMatrix(); }
    } else if (id >= 0) {
      const v = this.vis[id];
      this.unitPos(v.u, this.t, this.vP);
      const off = this.camera.position.clone().sub(this.controls.target);
      const want = v.u.kind === 'missile' ? 2500 : v.u.kind === 'ground' ? 250 : 6000;
      if (off.length() > want * 4) off.setLength(want);
      this.controls.target.copy(this.vP); this.camera.position.copy(this.vP).add(off);
      this.followPrev.copy(this.vP); this.followHas = true;
    }
  }

  unitPos(u: Unit, t: number, out: THREE.Vector3): THREE.Vector3 {
    const tt = Math.min(Math.max(t, u.tStart), u.tEnd);
    sampleAt(u, tt, this.s);
    return out.set(this.s.x, this.s.y, -this.s.z);
  }

  // ---------- per-frame ----------
  private playerHidden(u: Unit): boolean {
    if (u.owner < 0) return false;
    const p = this.session!.playerBySlot.get(u.owner);
    return !!p && p.hidden;
  }

  update(t: number) {
    const ses = this.session; if (!ses) return;
    this.t = t;
    const st = this.settings, cam = this.cam, is2d = this.mode === '2d';
    const H = this.container.clientHeight || 600, W = this.container.clientWidth || 800;
    const pxK = is2d ? 1 / this.cam2d.zoom : 2 * Math.tan(this.camera.fov * D2R / 2) / H;   // world size of a pixel (3D: at distance 1)
    const s = this.s;

    // follow: move the camera with the unit
    if (this.follow >= 0) {
      const fu = this.vis[this.follow].u;
      this.unitPos(fu, t, this.vP);
      if (is2d) { this.cam2d.position.x = this.vP.x; this.cam2d.position.z = this.vP.z; }
      else {
        if (this.followHas) { const dlt = this.vP.clone().sub(this.followPrev); cam.position.add(dlt); }
        this.controls.target.copy(this.vP); this.followPrev.copy(this.vP); this.followHas = true;
      }
    }
    if (!is2d) {
      this.controls.update();
      // never below the ground
      const gy = groundHeight(ses.terrain, this.camera.position.x, -this.camera.position.z) + (ses.ground ? 4 : 30);
      if (this.camera.position.y < gy) this.camera.position.y = gy;
    }
    cam.updateMatrixWorld();

    let nDead = 0;
    this.sticks.begin(); this.desig.begin(); this.vectors.begin();
    const c2 = new THREE.Color();
    const deadPos = this.deadPts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const deadCol = this.deadPts.geometry.getAttribute('color') as THREE.BufferAttribute;
    const c = new THREE.Color();

    // aircraft and missiles
    for (const kind of ['aircraft', 'missile']) {
      const isAc = kind === 'aircraft';
      const trailLen = isAc ? st.acTrail : st.msTrail;
      for (const v of this.byKind[kind]) {
        const u = v.u;
        let allowed = !this.playerHidden(u) && (isAc ? (st.ai || !u.ai) : st.missiles);
        const alive = t >= u.tStart && t <= u.tEnd;
        const ended = t > u.tEnd;
        v.alive = alive; v.shown = allowed && alive;
        v.onScreen = false;
        if (!allowed || t < u.tStart) { v.mesh!.visible = false; v.trail!.mesh.visible = false; if (v.beam) v.beam.visible = false; if (v.scan) v.scan.visible = false; continue; }

        if (alive) {
          sampleAt(u, t, s);
          v.px = s.x; v.py = s.y; v.pz = -s.z;
          // orientation
          const h = s.heading * D2R, p = is2d ? 0 : s.pitch * D2R, r = is2d ? 0 : s.roll * D2R;
          const sh = Math.sin(h), ch = Math.cos(h), sp = Math.sin(p), cp = Math.cos(p), sr = Math.sin(r), cr = Math.cos(r);
          const fx = sh * cp, fy = sp, fz = ch * cp;
          const rx0 = ch, rz0 = -sh;
          const ux0 = -sh * sp, uy0 = cp, uz0 = -ch * sp;
          const rx = rx0 * cr - ux0 * sr, ry = -uy0 * sr, rz = rz0 * cr - uz0 * sr;
          const ux = ux0 * cr + rx0 * sr, uy = uy0 * cr, uz = uz0 * cr + rz0 * sr;
          this.vX.set(rx, ry, -rz); this.vY.set(ux, uy, -uz); this.vZ.set(-fx, -fy, fz);
          const dist = is2d ? 1 : Math.hypot(cam.position.x - v.px, cam.position.y - v.py, cam.position.z - v.pz);
          const wantPx = (isAc ? 26 : 12) * (v.focus ? 1.3 : 1);
          const sc = Math.max(1, wantPx * pxK * dist / (isAc ? AC_LEN : MS_LEN));
          this.tmpM.makeBasis(this.vX, this.vY, this.vZ); this.tmpM.scale(this.vP.set(sc, sc, sc)); this.tmpM.setPosition(v.px, v.py, v.pz);
          v.mesh!.matrix.copy(this.tmpM); v.mesh!.visible = true;
          v.wing = isAc && u.heading ? wingOf(s.heading, s.pitch, s.roll) : null;

          // screen position (labels, picking)
          this.vP.set(v.px, v.py, v.pz).project(cam);
          v.onScreen = this.vP.z < 1 && Math.abs(this.vP.x) < 1.05 && Math.abs(this.vP.y) < 1.05;
          v.sx = (this.vP.x * 0.5 + 0.5) * W; v.sy = (-this.vP.y * 0.5 + 0.5) * H;

          if (isAc) {
            if (st.sticks && !is2d) {
              const gy = groundHeight(ses.terrain, s.x, s.z);
              c.set(v.color); this.sticks.add(v.px, v.py, v.pz, v.px, gy, v.pz, c);
            }
            if (st.vector) {
              // where the aircraft will be in 10 s if it keeps its velocity
              const j = Math.min(u.n - 1, s.i + 1), i0 = Math.max(0, s.i - 1), dt = (u.t[j] - u.t[i0]) / 1000;
              if (dt > 0) {
                const k = 10 / dt; c.set(v.color);
                this.vectors.add(v.px, v.py, v.pz, v.px + (u.x[j] - u.x[i0]) * k, v.py + (u.y[j] - u.y[i0]) * k, v.pz - (u.z[j] - u.z[i0]) * k, c);
              }
            }
            // radar
            const rs = radarAt(u, t);
            const wantBeam = rs && rs.on && (st.radar === 'all' || (st.radar === 'focus' && v.focus));
            if (wantBeam) {
              if (!v.beam) {
                v.beam = new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({ color: v.color, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
                v.beam.matrixAutoUpdate = false; v.beam.frustumCulled = false; this.root.add(v.beam);
              }
              const az = rs!.az * D2R, el = rs!.el * D2R, ce = Math.cos(el);
              const dx = fx * ce * Math.cos(az) + rx * ce * Math.sin(az) + ux * Math.sin(el);
              const dy = fy * ce * Math.cos(az) + ry * ce * Math.sin(az) + uy * Math.sin(el);
              const dz = fz * ce * Math.cos(az) + rz * ce * Math.sin(az) + uz * Math.sin(el);
              const tracking = rs!.state === 'track';
              const len = tracking && rs!.targetRange > 100 ? rs!.targetRange : 20000;
              const pat = st.scanZone && !tracking ? scanPattern(ses.radars, u.cls, rs!.sensor, rs!.pattern) : null;
              const zone = pat && pat.type === 'pyramide' && pat.azHalfDeg > 0 && pat.elHalfDeg > 0;
              if (zone) {
                const ce = pat.centerElevationDeg || 0;
                const key = pat.azHalfDeg + '_' + (ce - pat.elHalfDeg) + '_' + (ce + pat.elHalfDeg);
                if (!v.scan) {
                  v.scan = new THREE.Mesh(scanGeometry(pat.azHalfDeg, ce - pat.elHalfDeg, ce + pat.elHalfDeg), new THREE.MeshBasicMaterial({ color: v.color, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
                  v.scan.matrixAutoUpdate = false; v.scan.frustumCulled = false; this.root.add(v.scan); v.scanKey = key;
                } else if (v.scanKey !== key) { v.scan.geometry = scanGeometry(pat.azHalfDeg, ce - pat.elHalfDeg, ce + pat.elHalfDeg); v.scanKey = key; }
                // most radars keep the scan level with the horizon
                if ((pat.rollStabDeg || 0) >= 60) { this.vX.set(ch, 0, sh); this.vY.set(0, 1, 0); this.vZ.set(-sh, 0, ch); }
                else { this.vX.set(rx, ry, -rz); this.vY.set(ux, uy, -uz); this.vZ.set(-fx, -fy, fz); }
                this.tmpM.makeBasis(this.vX, this.vY, this.vZ); this.tmpM.scale(this.vP.set(30000, 30000, 30000)); this.tmpM.setPosition(v.px, v.py, v.pz);
                v.scan.matrix.copy(this.tmpM); v.scan.visible = true; (v.scan.material as THREE.MeshBasicMaterial).color.set(v.color);
              } else if (v.scan) v.scan.visible = false;
              const rad = len * Math.tan((tracking ? 1.5 : zone ? 1.0 : 3.5) * D2R);
              this.vZ.set(-dx, -dy, dz).normalize();
              this.vX.set(0, 1, 0).cross(this.vZ); if (this.vX.lengthSq() < 1e-6) this.vX.set(1, 0, 0); this.vX.normalize();
              this.vY.crossVectors(this.vZ, this.vX);
              this.tmpM.makeBasis(this.vX, this.vY, this.vZ); this.tmpM.scale(this.vP.set(rad, rad, len)); this.tmpM.setPosition(v.px, v.py, v.pz);
              v.beam.matrix.copy(this.tmpM); v.beam.visible = true;
              const bm = v.beam.material as THREE.MeshBasicMaterial; bm.color.set(v.color); bm.opacity = tracking ? 0.26 : 0.09;
            } else { if (v.beam) v.beam.visible = false; if (v.scan) v.scan.visible = false; }
            if (rs && rs.targets.length && (st.desig === 'all' || (st.desig === 'focus' && (v.focus || rs.targets.some(id => this.vis[id] && this.vis[id].focus))))) {
              for (const id of rs.targets) {
                const tv = this.vis[id]; if (!tv) continue;
                const tu = tv.u; if (t < tu.tStart || t > tu.tEnd || this.playerHidden(tu)) continue;
                sampleAt(tu, t, s);
                c.set(v.color); c2.copy(c).multiplyScalar(0.55);
                this.desig.add(v.px, v.py, v.pz, s.x, s.y, -s.z, c, c2);
              }
            }
          }
        } else {
          v.mesh!.visible = false; if (v.beam) v.beam.visible = false; if (v.scan) v.scan.visible = false;
          if (isAc && ended && u.destroyed && st.dead) {
            const k = u.n - 1;
            deadPos.setXYZ(nDead, u.x[k], u.y[k], -u.z[k]); c.set(v.color).lerp(new THREE.Color(COLORS.dead), 0.5); deadCol.setXYZ(nDead, c.r, c.g, c.b); nDead++;
          }
        }

        // trail
        const tr = v.trail!;
        const showTrail = trailLen !== 0 && (alive || (ended && (isAc ? st.dead : (st.msKeep === 'all' || (st.msKeep === 'focus' && v.focus) || t - u.tEnd < 4000))));
        if (!showTrail) { tr.mesh.visible = false; continue; }
        const headI = alive ? idxAt(u, t) : u.n - 1;
        let startI = 0;
        if (trailLen > 0) startI = idxAt(u, Math.max(0, t - trailLen * 1000)) + (t - trailLen * 1000 > u.t[0] ? 1 : 0);
        startI = Math.min(startI, headI);
        const ribbon = isAc && st.trailStyle === 'ribbon' && !!u.heading;
        const un = tr.mat.uniforms;
        un.uRibbon.value = ribbon ? 1 : 0;
        un.uWidth.value = (st.lineWidth || 2) + (v.focus ? 1 : 0);
        un.uHead.value = (t - ses.t0) / 1000; un.uFade.value = trailLen > 0 ? trailLen : 0;
        if (ribbon) {
          // ribbon as wide as the aircraft symbol's wings
          const dist = is2d ? 1 : Math.hypot(cam.position.x - v.px, cam.position.y - v.py, cam.position.z - v.pz);
          un.uHalf.value = Math.max(4, 26 * (v.focus ? 1.3 : 1) * pxK * dist / AC_LEN * 6.5 * 0.8);
        }
        let curWing: number[] | null = null, curUp = 1;
        if (alive && v.wing) { curWing = v.wing; curUp = v.wing[3]; }
        tr.update(startI, headI, alive ? [v.px, v.py, v.pz] : null, curWing, curUp);
      }
    }
    this.sticks.end(); this.sticks.mesh.visible = st.sticks && !is2d;
    this.desig.end(); this.vectors.end();

    // where active-radar missiles went active ("pitbull"), shown with the missile's path
    {
      const ap = this.activePts.geometry.getAttribute('position') as THREE.BufferAttribute, acol = this.activePts.geometry.getAttribute('color') as THREE.BufferAttribute;
      let n = 0;
      if (st.activeMark && st.missiles) for (const v of this.byKind.missile) {
        const i = this.activeAt.get(v.u.id); const u = v.u;
        if (i === undefined || t < u.t[i] || this.playerHidden(u)) continue;
        const ended = t > u.tEnd;
        if (ended && !(st.msKeep === 'all' || (st.msKeep === 'focus' && v.focus) || t - u.tEnd < 4000)) continue;
        ap.setXYZ(n, u.x[i], u.y[i], -u.z[i]); acol.setXYZ(n, 0.45, 1, 0.55); n++;
      }
      this.activePts.geometry.setDrawRange(0, n); ap.needsUpdate = true; acol.needsUpdate = true;
    }

    // missile seeker lines (only while the seeker is tracking)
    this.seeker.begin();
    if (st.seeker && st.missiles) {
      const w1 = new THREE.Color(1, 1, 1), w2 = new THREE.Color(1, 0.9, 0.3);
      for (const v of this.byKind.missile) {
        if (!v.shown || !v.u.seekerMode) continue;
        const u = v.u, i = idxAt(u, t);
        if (u.seekerMode![i] !== 2) continue;
        const ex = u.tex![i], ey = u.tey![i], ez = u.tez![i];
        if (!isFinite(ex) || ey < -500 || Math.hypot(ex - v.px, ey - v.py, -ez - v.pz) > 80000) continue;
        this.seeker.add(v.px, v.py, v.pz, ex, ey, -ez, w1, w2);
      }
    }
    this.seeker.end();

    // countermeasures and bombs
    const fill = (pts: THREE.Points, list: Vis[], on: boolean, colorOf: (u: Unit) => number) => {
      let n = 0;
      if (on) {
        const pp = pts.geometry.getAttribute('position') as THREE.BufferAttribute, pc = pts.geometry.getAttribute('color') as THREE.BufferAttribute;
        for (const v of list) {
          const u = v.u;
          if (t < u.tStart || t > u.tEnd || this.playerHidden(u)) continue;
          sampleAt(u, t, s); pp.setXYZ(n, s.x, s.y, -s.z); c.set(colorOf(u)); pc.setXYZ(n, c.r, c.g, c.b); n++;
        }
        pp.needsUpdate = true; pc.needsUpdate = true;
      }
      pts.geometry.setDrawRange(0, n);
    };
    fill(this.cmPts, this.byKind.countermeasure, st.cms, u => u.cmType === 'Flare' ? COLORS.flare : COLORS.chaff);
    fill(this.bombPts, this.byKind.bomb, st.bombs, () => COLORS.bomb);
    this.groundPts.visible = st.ground;
    this.groundPts.geometry.setDrawRange(0, st.ground ? this.nStaticGround : 0);
    nDead = this.updateGround(t, nDead, pxK, deadPos, deadCol);
    this.updateShells(t);
    for (const o of this.objMeshes) o.mesh.visible = o.kind === 'tree' ? st.trees : st.objects;

    this.deadPts.geometry.setDrawRange(0, nDead); deadPos.needsUpdate = true; deadCol.needsUpdate = true;

    // selection ring + measure line
    const sel = this.selected >= 0 ? this.vis[this.selected] : null;
    if (sel && sel.shown) {
      const dist = is2d ? 1 : cam.position.distanceTo(this.vP.set(sel.px, sel.py, sel.pz));
      const rad = 22 * pxK * dist;
      this.selRing.position.set(sel.px, sel.py, sel.pz); this.selRing.quaternion.copy(cam.quaternion); this.selRing.scale.setScalar(rad); this.selRing.visible = true;
    } else this.selRing.visible = false;
    const mv = this.measure >= 0 ? this.vis[this.measure] : null;
    this.measureSeg.begin();
    if (sel && mv && sel.shown && mv.shown) this.measureSeg.add(sel.px, sel.py, sel.pz, mv.px, mv.py, mv.pz, new THREE.Color(1, 1, 1));
    this.measureSeg.end();
    this.updateDlz(t, sel);

    this.updateMapOverlays(W, H);
    this.updateLabels();
    this.renderer.render(this.scene, cam);
  }

  // ---------- ground vehicles ----------
  private updateGround(t: number, nDead: number, pxK: number, deadPos: THREE.BufferAttribute, deadCol: THREE.BufferAttribute): number {
    const ses = this.session!, st = this.settings, cam = this.cam, is2d = this.mode === '2d', s = this.s;
    const c = new THREE.Color();
    this.gunSeg.begin();
    for (const v of this.byKind.ground) {
      if (!v.mesh) continue;
      const u = v.u;
      const allowed = st.ground && !this.playerHidden(u) && (st.ai || u.player >= 0);
      const alive = t >= u.tStart && t <= u.tEnd, ended = t > u.tEnd;
      v.alive = alive; v.shown = allowed && alive; v.onScreen = false;
      if (!allowed || !alive) {
        v.mesh.visible = false; v.turret!.visible = false;
        if (allowed && ended && u.destroyed && st.dead && u.player >= 0) {
          const k = u.n - 1;
          deadPos.setXYZ(nDead, u.x[k], u.y[k] + 2, -u.z[k]); c.set(v.color).lerp(new THREE.Color(COLORS.dead), 0.5); deadCol.setXYZ(nDead, c.r, c.g, c.b); nDead++;
        }
        const tr = v.trail!;
        if (!allowed || !ended || !st.dead || st.acTrail === 0) { tr.mesh.visible = false; continue; }
      } else {
        sampleAt(u, t, s);
        v.px = s.x; v.py = s.y; v.pz = -s.z;
        const h = s.heading * D2R, p = is2d ? 0 : s.pitch * D2R, r = is2d ? 0 : s.roll * D2R;
        const sh = Math.sin(h), ch = Math.cos(h), sp = Math.sin(p), cp = Math.cos(p), sr = Math.sin(r), cr = Math.cos(r);
        const fx = sh * cp, fy = sp, fz = ch * cp;
        const rx0 = ch, rz0 = -sh, ux0 = -sh * sp, uy0 = cp, uz0 = -ch * sp;
        const rx = rx0 * cr - ux0 * sr, ry = -uy0 * sr, rz = rz0 * cr - uz0 * sr;
        const ux = ux0 * cr + rx0 * sr, uy = uy0 * cr, uz = uz0 * cr + rz0 * sr;
        const dist = is2d ? 1 : Math.hypot(cam.position.x - v.px, cam.position.y - v.py, cam.position.z - v.pz);
        const wantPx = (u.player >= 0 ? 18 : 12) * (v.focus ? 1.3 : 1);
        const sc = Math.max(1, wantPx * pxK * dist / TANK_LEN);
        this.vX.set(rx, ry, -rz); this.vY.set(ux, uy, -uz); this.vZ.set(-fx, -fy, fz);
        this.tmpM.makeBasis(this.vX, this.vY, this.vZ); this.tmpM.scale(this.vP.set(sc, sc, sc)); this.tmpM.setPosition(v.px, v.py, v.pz);
        v.mesh.matrix.copy(this.tmpM); v.mesh.visible = true;
        // turret: recorded world gun bearing; sits on the hull roof
        const gb = u.gunBearing ? lerpGun(u.gunBearing, s.i, s.f, u.n) : NaN;
        const ge = u.gunElev && !is2d ? lerpCol(u.gunElev, s, u.n) : 0;
        const tb = (isFinite(gb) ? gb : s.heading) * D2R, te = (isFinite(ge) ? ge : 0) * D2R;
        const tsh = Math.sin(tb), tch = Math.cos(tb), tse = Math.sin(te), tce = Math.cos(te);
        const ox = v.px + ux * 1.7 * sc, oy = v.py + uy * 1.7 * sc, oz = v.pz - uz * 1.7 * sc;
        this.vX.set(tch, 0, tsh); this.vZ.set(-tsh * tce, -tse, tch * tce); this.vY.crossVectors(this.vZ, this.vX).normalize();
        this.tmpM.makeBasis(this.vX, this.vY, this.vZ); this.tmpM.scale(this.vP.set(sc, sc, sc)); this.tmpM.setPosition(ox, oy, oz);
        v.turret!.matrix.copy(this.tmpM); v.turret!.visible = true;
        // gun line: where the gun points, out to 2 km or the ground
        if (isFinite(gb) && (st.gunLines === 'all' || (st.gunLines === 'focus' && v.focus))) {
          let L = 2000; const dx = tsh * tce, dy = tse, dz = tch * tce;
          for (let k = 25; k <= 2000; k += 25) { if (oy + dy * k < groundHeight(ses.terrain, ox + dx * k, -oz + dz * k)) { L = k; break; } }
          c.set(v.color); const c2 = c.clone().multiplyScalar(0.35);
          this.gunSeg.add(ox, oy, oz, ox + dx * L, oy + dy * L, oz - dz * L, c, c2);
        }
        this.vP.set(v.px, v.py, v.pz).project(cam);
        const W = this.container.clientWidth || 800, H = this.container.clientHeight || 600;
        v.onScreen = this.vP.z < 1 && Math.abs(this.vP.x) < 1.05 && Math.abs(this.vP.y) < 1.05;
        v.sx = (this.vP.x * 0.5 + 0.5) * W; v.sy = (-this.vP.y * 0.5 + 0.5) * H;
      }
      // track on the ground
      const tr = v.trail!; const trailLen = st.acTrail;
      if (trailLen === 0) { tr.mesh.visible = false; continue; }
      const headI = alive ? idxAt(u, t) : u.n - 1;
      let startI = 0;
      if (trailLen > 0) startI = idxAt(u, Math.max(0, t - trailLen * 1000)) + (t - trailLen * 1000 > u.t[0] ? 1 : 0);
      startI = Math.min(startI, headI);
      const un = tr.mat.uniforms;
      un.uRibbon.value = 0; un.uWidth.value = (st.lineWidth || 2) + (v.focus ? 1 : 0);
      un.uHead.value = (t - ses.t0) / 1000; un.uFade.value = trailLen > 0 ? trailLen : 0;
      tr.update(startI, headI, alive ? [v.px, v.py + 0.6, v.pz] : null, null, 1);
    }
    this.gunSeg.end();
    return nDead;
  }

  // ---------- shells ----------
  // Arcs are computed by the decoder from the recorded gun direction and the
  // shell's figures; drawn up to where the shell is at time t, then kept for
  // shellKeep seconds after it lands.
  private updateShells(t: number) {
    const ses = this.session!, st = this.settings, sh = ses.shots;
    this.shellSeg.begin(); this.mgSeg.begin();
    const ip = this.impactPts.geometry.getAttribute('position') as THREE.BufferAttribute, ic = this.impactPts.geometry.getAttribute('color') as THREE.BufferAttribute;
    let nImp = 0, nHead = 0;
    const hp = this.headPts.geometry.getAttribute('position') as THREE.BufferAttribute, hc = this.headPts.geometry.getAttribute('color') as THREE.BufferAttribute;
    if (sh && st.ground && (st.shells || st.mgRounds)) {
      const keepMs = st.shellKeep < 0 ? Infinity : st.shellKeep * 1000;
      const from = st.shellKeep < 0 ? -Infinity : t - keepMs - 8000;
      let lo = 0, hi = sh.list.length;
      if (isFinite(from)) while (lo < hi) { const m = (lo + hi) >> 1; if (sh.list[m].t < from) lo = m + 1; else hi = m; }
      const c = new THREE.Color(), c2 = new THREE.Color(), white = new THREE.Color(0xffffff), tracer = new THREE.Color(0xffd27a);
      const capC = this.shellSeg.cap, capM = this.mgSeg.cap;
      let usedC = 0, usedM = 0;
      for (let i = lo; i < sh.list.length; i++) {
        const s = sh.list[i];
        if (s.t > t) break;
        if (s.n < 2) continue;
        const isMG = s.cls === 'mg';
        if (isMG ? !st.mgRounds : (!st.shells || (s.cls !== 'cannon'))) continue;
        const sv = this.vis[s.unit]; if (!sv || this.playerHidden(sv.u) || (!st.ai && sv.u.player < 0)) continue;
        const landed = t >= s.tEnd;
        if (landed && t - s.tEnd > keepMs) continue;
        const seg = isMG ? this.mgSeg : this.shellSeg;
        // fade after landing
        const age = landed ? (t - s.tEnd) / Math.max(1, Math.min(keepMs, 30000)) : 0;
        const fade = landed ? Math.max(0.25, 1 - age * 0.75) : 1;
        c.set(sv.color);
        if (isMG) c.lerp(tracer, 0.55); else c.lerp(white, s.kill ? 0.55 : 0.25);
        c.multiplyScalar(fade); c2.copy(c).multiplyScalar(0.8);
        const f = (t - s.t) / sh.dt;
        const k = Math.min(s.n - 1, Math.floor(f));
        const need = k + 1;
        if (isMG ? usedM + need > capM : usedC + need > capC) continue;
        const X = sh.x, Y = sh.y, Z = sh.z, b = s.p0;
        for (let j = 0; j < k; j++) seg.add(X[b + j], Y[b + j], -Z[b + j], X[b + j + 1], Y[b + j + 1], -Z[b + j + 1], c2, c);
        let hx = X[b + k], hy = Y[b + k], hz = Z[b + k];
        if (k < s.n - 1) {
          const ff = f - k; hx += (X[b + k + 1] - hx) * ff; hy += (Y[b + k + 1] - hy) * ff; hz += (Z[b + k + 1] - hz) * ff;
          seg.add(X[b + k], Y[b + k], -Z[b + k], hx, hy, -hz, c2, c);
          // the round itself
          if (nHead < 8192) { hp.setXYZ(nHead, hx, hy, -hz); if (isMG) hc.setXYZ(nHead, 1, 0.82, 0.45); else hc.setXYZ(nHead, 1, 1, 0.92); nHead++; }
        }
        if (isMG) usedM += need; else usedC += need;
        // flash where it landed, for a second
        if (landed && t - s.tEnd < 1200 && nImp < 4096 && (s.end === 'ground' || s.end === 'vehicle' || s.end === 'aircraft')) {
          const e = b + s.n - 1; ip.setXYZ(nImp, X[e], Y[e] + 0.5, -Z[e]);
          if (s.end === 'vehicle' || s.end === 'aircraft') c.set(s.kill ? 0xff4040 : 0xffffff); else c.set(0xffb060);
          ic.setXYZ(nImp, c.r, c.g, c.b); nImp++;
        }
      }
    }
    this.shellSeg.end(); this.mgSeg.end();
    this.impactPts.geometry.setDrawRange(0, nImp); ip.needsUpdate = true; ic.needsUpdate = true;
    this.headPts.geometry.setDrawRange(0, nHead); hp.needsUpdate = true; hc.needsUpdate = true;
  }

  // ---------- launch-zone rings ----------
  // The selected aircraft's estimated max range (outer ring) and no-escape range
  // (inner ring) against its target: the measured unit, else its radar target.
  missileOf(u: Unit): Phys | null {
    const ses = this.session!; const counts = new Map<string, number>(); let best = '', bn = 0, internal = '';
    for (const l of ses.launches) {
      if (l.shooter !== u.id && !(u.owner >= 0 && l.shooterPlayer === u.owner)) continue;
      const m = ses.units[l.missile]; if (!m || m.kind !== 'missile') continue;
      const n = (counts.get(m.name) || 0) + 1; counts.set(m.name, n);
      if (n > bn && (!m.missile || m.missile.guidance !== 'IR' || !best)) { bn = n; best = m.name; internal = m.missile ? m.missile.internalName : ''; }
    }
    return best ? physFor(internal, best) : null;
  }

  private updateDlz(t: number, sel: Vis | null) {
    this.dlzSeg.begin(); this.dlzInfo = null;
    const st = this.settings;
    if (st.dlz && sel && sel.shown && sel.u.kind === 'aircraft') {
      let tgt = this.measure >= 0 ? this.vis[this.measure] : null;
      if (!tgt || !tgt.shown || tgt.u.kind !== 'aircraft') {
        const rs = radarAt(sel.u, t); tgt = null;
        if (rs) for (const id of rs.targets) { const v = this.vis[id]; if (v && v.shown && v.u.kind === 'aircraft') { tgt = v; break; } }
      }
      const ph = tgt ? this.missileOf(sel.u) : null;
      if (tgt && ph) {
        const now = performance.now(); const key = sel.u.id + ':' + tgt.u.id + ':' + ph.name;
        if (!this.dlzCache || this.dlzCache.key !== key || now - this.dlzCache.at > 250) {
          const vs = speedAt(sel.u, t), vt = speedAt(tgt.u, t);
          const lx = sel.px - tgt.px, ly = sel.py - tgt.py, lz = sel.pz - tgt.pz;     // target -> shooter
          const tv = velAt(tgt.u, t);
          const ln = Math.hypot(lx, ly, lz), tn = Math.hypot(tv[0], tv[1], tv[2]);
          const asp = ln > 0 && tn > 0 ? Math.acos(Math.max(-1, Math.min(1, (tv[0] * lx + tv[1] * ly + tv[2] * lz) / (ln * tn)))) * 180 / Math.PI : 0;
          const [rmax, rne] = envelope(ph, sel.py, vs, tgt.py, vt, asp);
          this.dlzCache = { key, at: now, rmax, rne, missile: ph.name };
        }
        const dc = this.dlzCache!;
        this.dlzInfo = { missile: dc.missile, rmax: dc.rmax, rne: dc.rne, range: Math.hypot(sel.px - tgt.px, sel.py - tgt.py, sel.pz - tgt.pz) };
        const col = new THREE.Color(sel.color), dim = col.clone().multiplyScalar(0.6);
        const ring = (r: number, c: THREE.Color, dashed: boolean) => {
          if (r <= 0) return; const N = 96;
          for (let i = 0; i < N; i++) {
            if (dashed && i % 2) continue;
            const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
            this.dlzSeg.add(sel.px + r * Math.cos(a0), sel.py, sel.pz + r * Math.sin(a0), sel.px + r * Math.cos(a1), sel.py, sel.pz + r * Math.sin(a1), c);
          }
        };
        ring(dc.rmax, dim, true); ring(dc.rne, col, false);
      }
    }
    this.dlzSeg.end();
  }

  // ---------- labels ----------
  private labelFor(v: Vis): string {
    const st = this.settings, u = v.u, ses = this.session!;
    if (u.kind === 'missile') return u.name;
    const parts: string[] = [];
    const p = u.player >= 0 ? ses.playerBySlot.get(u.player) : null;
    if (st.lblName && p) parts.push(p.name);
    if (st.lblType || !p) parts.push(u.name);
    const line2: string[] = [];
    sampleAt(u, this.t, this.s);
    if (st.lblAlt && u.kind !== 'ground') line2.push(fmtAlt(this.s.y, st.units));
    if (st.lblSpeed) line2.push(fmtSpeed(lerpCol(u.speed, this.s, u.n), st.units));
    return parts.join(' · ') + (line2.length ? '\n' + line2.join('  ') : '');
  }

  updateLabels() {
    const st = this.settings; const now = performance.now();
    const refreshText = now - this.lastLabelText > 200; if (refreshText) this.lastLabelText = now;
    // Labels that would sit on top of one another are dropped, least important first.
    const want: Vis[] = [];
    for (const kind of ['aircraft', 'ground', 'missile']) {
      for (const v of this.byKind[kind]) {
        if (!v.mesh) continue;
        let w = v.shown && v.onScreen;
        if (w) {
          if (kind === 'missile') w = st.missileLabels && (st.labels === 'all' || (st.labels === 'focus' && v.focus));
          else w = st.labels === 'all' || (st.labels === 'focus' && v.focus);
        }
        if (w) want.push(v); else if (v.label && v.label.style.display !== 'none') v.label.style.display = 'none';
      }
    }
    const rank = (v: Vis) => (v.u.id === this.selected ? 0 : v.focus ? 1 : v.u.kind === 'aircraft' || (v.u.kind === 'ground' && v.u.player >= 0) ? (v.u.ai ? 3 : 2) : v.u.kind === 'ground' ? 5 : 4);
    want.sort((a, b) => rank(a) - rank(b));
    const boxes: number[] = [];
    for (const v of want) {
      if (refreshText || !v.labelText) v.labelText = this.labelFor(v);
      const lines = v.labelText.split('\n'); let chars = 0; for (const l of lines) chars = Math.max(chars, l.length);
      const x0 = v.sx + 12, y0 = v.sy - 8, x1 = x0 + chars * 6.6 + 4, y1 = y0 + lines.length * 14;
      let clash = false;
      if (rank(v) > 1 || v.u.kind === 'missile') for (let i = 0; i < boxes.length; i += 4) if (x0 < boxes[i + 2] && x1 > boxes[i] && y0 < boxes[i + 3] && y1 > boxes[i + 1]) { clash = true; break; }
      if (clash) { if (v.label && v.label.style.display !== 'none') v.label.style.display = 'none'; continue; }
      boxes.push(x0, y0, x1, y1);
      if (!v.label) {
        const d = document.createElement('div'); d.className = 'lbl ' + v.u.kind + (v.focus ? ' focus' : '');
        d.addEventListener('click', e => { this.onSelect(v.u.id, (e as MouseEvent).shiftKey); e.stopPropagation(); });
        this.labelLayer.appendChild(d); v.label = d;
      }
      const d = v.label;
      if (d.style.display === 'none') d.style.display = '';
      d.style.transform = `translate(${Math.round(x0)}px, ${Math.round(y0)}px)`;
      d.style.color = '#' + new THREE.Color(v.color).lerp(new THREE.Color(0xffffff), 0.45).getHexString();
      if (d.textContent !== v.labelText) d.textContent = v.labelText;
    }
  }

  // ---------- picking ----------
  pick(x: number, y: number): number {
    let best = -1, bd = 18;
    for (const kind of ['aircraft', 'ground', 'missile']) {
      for (const v of this.byKind[kind]) {
        if (!v.shown || !v.onScreen || !v.mesh) continue;
        const d = Math.hypot(v.sx - x, v.sy - y) + (kind === 'missile' ? 4 : 0);
        if (d < bd) { bd = d; best = v.u.id; }
      }
    }
    return best;
  }

  // compass heading the camera is looking toward, degrees
  viewHeading(): number {
    if (this.mode === '2d') return 0;
    const d = new THREE.Vector3(); this.camera.getWorldDirection(d);
    return (Math.atan2(d.x, -d.z) * 180 / Math.PI + 360) % 360;
  }
}

export function fmtAlt(m: number, units: string): string {
  if (units === 'aviation') return Math.round(m * 3.28084 / 100) * 100 + ' ft';
  return m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m';
}
export function fmtSpeed(ms: number, units: string): string {
  if (!isFinite(ms)) return '';
  if (units === 'aviation') return Math.round(ms * 1.94384) + ' kt';
  return Math.round(ms * 3.6) + ' km/h';
}
export function fmtDist(m: number, units: string): string {
  if (units === 'aviation') return (m / 1852).toFixed(1) + ' nm';
  return (m / 1000).toFixed(1) + ' km';
}

function velAt(u: Unit, t: number): number[] {
  const i = idxAt(u, t), a = Math.max(0, i - 1), b = Math.min(u.n - 1, i + 1), dt = (u.t[b] - u.t[a]) / 1000;
  return dt > 0 ? [(u.x[b] - u.x[a]) / dt, (u.y[b] - u.y[a]) / dt, -(u.z[b] - u.z[a]) / dt] : [0, 0, 0];
}
function speedAt(u: Unit, t: number): number { const v = velAt(u, t); return Math.hypot(v[0], v[1], v[2]); }

// gun bearing between two samples (wraps through north), NaN when unknown
function lerpGun(a: Float32Array, i: number, f: number, n: number): number {
  const j = Math.min(n - 1, i + 1), x = a[i], y = a[j];
  if (!isFinite(x)) return y; if (!isFinite(y)) return x;
  const d = ((y - x + 540) % 360) - 180;
  return x + d * f;
}
