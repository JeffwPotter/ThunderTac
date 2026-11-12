// Loading one converted match (.wtr) and answering "where is everything at time t".
// Coordinates here are the .wtr ones: metres, x east, y altitude, z north.

export interface RadarSnap {
  t: number;
  on: boolean;
  state: string;      // off | scan | track | unknown
  pattern: string;
  label: string;
  sensor: string;
  az: number;         // antenna pointing relative to the aircraft, degrees
  el: number;
  targets: number[];  // unit ids
  targetRange: number;
}

export interface Unit {
  id: number;
  kind: 'aircraft' | 'missile' | 'countermeasure' | 'bomb' | 'ground';
  name: string;
  cls: string;
  player: number;     // slot, -1 when none
  ai: boolean;
  team: number;
  parent: number;     // unit id, -1 when none
  tStart: number;
  tEnd: number;
  destroyed: boolean;
  estimated: boolean;
  isStatic: boolean;
  n: number;
  t: Uint32Array;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  heading?: Float32Array;
  pitch?: Float32Array;
  roll?: Float32Array;
  seekerMode?: Uint8Array;
  seekerKind?: Uint8Array;
  seekerRange?: Float32Array;
  tex?: Float32Array; tey?: Float32Array; tez?: Float32Array;
  missile?: any;
  cmType?: string;
  speed?: Float32Array;  // m/s, derived
  g?: Float32Array;      // load factor, derived
  mach?: Float32Array; agl?: Float32Array; climb?: Float32Array;
  radar?: RadarSnap[];
  owner: number;         // player slot this unit belongs to (aircraft, or weapon of that aircraft), -1 none
}

export interface Player {
  slot: number;
  name: string;
  clan: string;
  team: number;
  units: number[];
  results: any;
  hidden: boolean;
  highlight: boolean;
}

export interface GameEvent { t: number; type: string; [k: string]: any; }

export interface Terrain {
  n: number; x0: number; z0: number; x1: number; z1: number; cell: number;
  hMin: number; hMax: number; water: number;
  h: Float32Array;   // n*n, rows south to north
}

export interface Session {
  id: string;
  manifest: any;
  players: Player[];
  playerBySlot: Map<number, Player>;
  units: Unit[];
  events: GameEvent[];
  kills: GameEvent[];
  launches: any[];
  launchByMissile: Map<number, any>;
  map: any | null;          // airfields and mission areas (decoder 0.5.0+)
  stats: Map<number, any>;  // per player slot
  radars: any | null;       // radar catalogue from the game install
  t0: number;
  t1: number;
  terrain: Terrain | null;
  levelName: string;
}

const GLYPHS = /[␀-➿-]/g;
export function cleanName(s: string): string {
  return (s || '').replace(GLYPHS, '').trim();
}

let radarCatalog: any = undefined;

// Scan pattern of an aircraft's radar from the game-install catalogue, or null.
export function scanPattern(radars: any, cls: string, sensorName: string, pattern: string): any {
  if (!radars || !pattern) return null;
  const list: string[] = radars.byAircraft[cls.toLowerCase()] || [];
  const ids = [pattern, pattern.replace(/^radar/, '').replace(/^./, c => c.toLowerCase())];
  let best: any = null;
  for (const sid of list) {
    const s = radars.sensors[sid]; if (!s) continue;
    for (const id of ids) { const p = s.patterns[id]; if (p && (!best || s.name === sensorName)) { best = p; break; } }
    if (best && s.name === sensorName) break;
  }
  return best;
}

async function getJSON(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' → ' + r.status);
  return r.json();
}

export async function loadSession(id: string, progress: (s: string) => void): Promise<Session> {
  const base = '/api/session/' + encodeURIComponent(id) + '/';
  progress('Reading match…');
  const [manifest, playersRaw, unitsRaw, events, states, tracksBuf] = await Promise.all([
    getJSON(base + 'manifest.json'), getJSON(base + 'players.json'), getJSON(base + 'units.json'),
    getJSON(base + 'events.json'), getJSON(base + 'states.json'),
    fetch(base + 'tracks.bin').then(r => { if (!r.ok) throw new Error('tracks.bin → ' + r.status); return r.arrayBuffer(); }),
  ]);
  progress('Building tracks…');

  const units: Unit[] = unitsRaw.map((u: any) => {
    const col = (name: string): any => {
      const c = u.columns.find((c: any) => c.name === name);
      if (!c) return undefined;
      if (c.type === 'u32') return new Uint32Array(tracksBuf, c.offset, c.count);
      if (c.type === 'f32') return new Float32Array(tracksBuf, c.offset, c.count);
      return new Uint8Array(tracksBuf, c.offset, c.count);
    };
    const un: Unit = {
      id: u.id, kind: u.kind, name: cleanName(u.name).replace(' (estimated)', ''), cls: u.class || '',
      player: u.player === undefined ? -1 : u.player, ai: !!u.ai, team: u.team || 0,
      parent: u.parent === undefined ? -1 : u.parent, tStart: u.tStart, tEnd: u.tEnd,
      destroyed: !!u.destroyed, estimated: !!u.estimated, isStatic: !!u.static, n: u.samples,
      t: col('t'), x: col('x'), y: col('y'), z: col('z'),
      heading: col('heading'), pitch: col('pitch'), roll: col('roll'),
      seekerMode: col('seekerMode'), seekerKind: col('seekerKind'), seekerRange: col('seekerRange'),
      tex: col('targetEstX'), tey: col('targetEstY'), tez: col('targetEstZ'),
      missile: u.missile, cmType: u.countermeasure ? u.countermeasure.type : undefined,
      speed: col('speed'), g: col('g'), mach: col('mach'), agl: col('agl'), climb: col('climb'),
      owner: -1,
    };
    return un;
  });

  for (const u of units) {
    if (u.kind === 'aircraft') { u.owner = u.player; if (!u.speed) derive(u); }
  }
  for (const u of units) {
    if (u.kind !== 'aircraft' && u.parent >= 0 && units[u.parent]) {
      u.owner = units[u.parent].owner;
      if (!u.team) u.team = units[u.parent].team;
    }
  }

  const players: Player[] = playersRaw.map((p: any) => ({
    slot: p.slot, name: p.name, clan: p.clan || '', team: p.team, units: p.units || [],
    results: p.results || {}, hidden: false, highlight: false,
  }));
  const playerBySlot = new Map<number, Player>();
  for (const p of players) playerBySlot.set(p.slot, p);

  buildRadar(units, states);

  const levelName = String(manifest.match.level || '').split('/').pop()!.replace(/\.bin$/, '');
  progress('Reading terrain…');
  const terrain = await loadTerrain(levelName);

  const kills = (events as GameEvent[]).filter(e => e.type === 'kill');
  // launch records exist in files converted by decoder 0.3.0 and later
  let launches: any[] = [];
  try { const r = await fetch(base + 'launches.json'); if (r.ok) launches = await r.json(); } catch (e) { /* older file */ }
  launches.sort((a, b) => a.t - b.t);
  let map: any = null; try { const r = await fetch(base + 'map.json'); if (r.ok) map = await r.json(); } catch (e) { /* older file */ }
  const stats = new Map<number, any>(); try { const r = await fetch(base + 'stats.json'); if (r.ok) for (const s of await r.json()) stats.set(s.slot, s); } catch (e) { /* older file */ }
  if (radarCatalog === undefined) { radarCatalog = null; try { const r = await fetch('/api/catalog/radars.json'); if (r.ok) radarCatalog = await r.json(); } catch (e) { /* none */ } }
  const launchByMissile = new Map<number, any>(); for (const l of launches) launchByMissile.set(l.missile, l);
  return {
    id, manifest, players, playerBySlot, units, events, kills, launches, launchByMissile, map, stats, radars: radarCatalog,
    t0: manifest.match.tFirstMs, t1: manifest.match.tLastMs, terrain, levelName,
  };
}

export async function loadTerrain(level: string): Promise<Terrain | null> {
  try {
    const base = '/api/terrain/' + encodeURIComponent(level) + '/';
    const mr = await fetch(base + 'terrain.json');
    if (!mr.ok) return null;
    const m = await mr.json();
    const hb = await (await fetch(base + 'height.u16')).arrayBuffer();
    const raw = new Uint16Array(hb);
    const n = m.gridSize;
    const h = new Float32Array(n * n);
    const k = (m.hMax - m.hMin) / 65535;
    for (let i = 0; i < n * n; i++) h[i] = m.hMin + raw[i] * k;
    return { n, x0: m.x0, z0: m.z0, x1: m.x1, z1: m.z1, cell: m.cellM, hMin: m.hMin, hMax: m.hMax, water: m.waterLevel, h };
  } catch (e) {
    return null;
  }
}

export function groundHeight(tr: Terrain | null, x: number, z: number): number {
  if (!tr) return 0;
  const fx = (x - tr.x0) / tr.cell - 0.5, fz = (z - tr.z0) / tr.cell - 0.5;
  const n = tr.n;
  const cx = Math.max(0, Math.min(n - 1.001, fx)), cz = Math.max(0, Math.min(n - 1.001, fz));
  const ix = Math.floor(cx), iz = Math.floor(cz), ax = cx - ix, az = cz - iz;
  const h = tr.h;
  const a = h[iz * n + ix], b = h[iz * n + ix + 1], c = h[(iz + 1) * n + ix], d = h[(iz + 1) * n + ix + 1];
  const v = (a * (1 - ax) + b * ax) * (1 - az) + (c * (1 - ax) + d * ax) * az;
  return Math.max(v, tr.water);
}

// Speed and load factor from positions (the replay stores neither).
function derive(u: Unit) {
  const n = u.n;
  const sp = new Float32Array(n), g = new Float32Array(n);
  const vx = new Float32Array(n), vy = new Float32Array(n), vz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    const dt = (u.t[b] - u.t[a]) / 1000;
    if (dt <= 0) continue;
    vx[i] = (u.x[b] - u.x[a]) / dt; vy[i] = (u.y[b] - u.y[a]) / dt; vz[i] = (u.z[b] - u.z[a]) / dt;
    sp[i] = Math.hypot(vx[i], vy[i], vz[i]);
  }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2);
    const dt = (u.t[b] - u.t[a]) / 1000;
    if (dt <= 0) { g[i] = 1; continue; }
    const ax = (vx[b] - vx[a]) / dt, ay = (vy[b] - vy[a]) / dt + 9.81, az = (vz[b] - vz[a]) / dt;
    g[i] = Math.hypot(ax, ay, az) / 9.81;
  }
  u.speed = sp; u.g = g;
}

function buildRadar(units: Unit[], states: any[]) {
  const cur = new Map<number, any>();
  for (const s of states) {
    const u = units[s.unit];
    if (!u) continue;
    let c = cur.get(s.unit);
    if (!c) { c = {}; cur.set(s.unit, c); }
    Object.assign(c, s.set);
    const targets: number[] = [];
    for (let i = 1; i <= 8; i++) {
      const v = c['target' + i];
      if (v !== undefined && v !== '') { const id = parseInt(v, 10); if (!isNaN(id)) targets.push(id); }
    }
    const snap: RadarSnap = {
      t: s.t, on: c.radarOn === '1', state: c.radarState || 'off', pattern: c.radarPattern || '',
      label: c.radarLabel || '', sensor: c.radarSensor || '',
      az: parseFloat(c.antennaAzimuth) || 0, el: parseFloat(c.antennaElevation) || 0,
      targets, targetRange: parseFloat(c.targetRange) || 0,
    };
    if (!u.radar) u.radar = [];
    const last = u.radar[u.radar.length - 1];
    if (last && last.t === s.t) u.radar[u.radar.length - 1] = snap; else u.radar.push(snap);
  }
}

export function radarAt(u: Unit, t: number): RadarSnap | null {
  const r = u.radar;
  if (!r || !r.length || t < r[0].t) return null;
  let lo = 0, hi = r.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (r[m].t <= t) lo = m; else hi = m - 1; }
  return r[lo];
}

// Index of the last sample at or before t (clamped to 0..n-1).
export function idxAt(u: Unit, t: number): number {
  const a = u.t;
  let lo = 0, hi = u.n - 1;
  if (t <= a[0]) return 0;
  if (t >= a[hi]) return hi;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m] <= t) lo = m; else hi = m - 1; }
  return lo;
}

export interface Sample { x: number; y: number; z: number; heading: number; pitch: number; roll: number; i: number; f: number; }

function lerpAngle(a: number, b: number, f: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * f;
}

// Position (and attitude for aircraft) at time t. Aircraft use a smooth curve
// through the recorded points (they are only ~4 per second); everything else
// is straight-line between points.
export function sampleAt(u: Unit, t: number, out: Sample): Sample {
  const i = idxAt(u, t);
  const j = Math.min(u.n - 1, i + 1);
  const t0 = u.t[i], t1 = u.t[j];
  let f = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
  if (f < 0) f = 0; else if (f > 1) f = 1;
  out.i = i; out.f = f;
  const dt = t1 - t0;
  if (u.kind === 'aircraft' && dt > 0 && dt < 2000 && i > 0 && j < u.n - 1) {
    const h = i - 1, k = j + 1;
    const dA = u.t[j] - u.t[h], dB = u.t[k] - u.t[i];
    const f2 = f * f, f3 = f2 * f;
    const h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = -2 * f3 + 3 * f2, h11 = f3 - f2;
    const herm = (a: Float32Array) => {
      const m0 = dA > 0 ? (a[j] - a[h]) / dA * dt : 0;
      const m1 = dB > 0 ? (a[k] - a[i]) / dB * dt : 0;
      return h00 * a[i] + h10 * m0 + h01 * a[j] + h11 * m1;
    };
    out.x = herm(u.x); out.y = herm(u.y); out.z = herm(u.z);
  } else {
    out.x = u.x[i] + (u.x[j] - u.x[i]) * f;
    out.y = u.y[i] + (u.y[j] - u.y[i]) * f;
    out.z = u.z[i] + (u.z[j] - u.z[i]) * f;
  }
  if (u.heading) {
    out.heading = lerpAngle(u.heading[i], u.heading[j], f);
    out.pitch = u.pitch![i] + (u.pitch![j] - u.pitch![i]) * f;
    out.roll = lerpAngle(u.roll![i], u.roll![j], f);
  } else {
    // direction of travel
    const a = Math.max(0, i - 1), b = Math.min(u.n - 1, i + 1);
    const dx = u.x[b] - u.x[a], dy = u.y[b] - u.y[a], dz = u.z[b] - u.z[a];
    const hz = Math.hypot(dx, dz);
    out.heading = hz > 0.01 ? Math.atan2(dx, dz) * 180 / Math.PI : 0;
    out.pitch = Math.atan2(dy, hz) * 180 / Math.PI;
    out.roll = 0;
  }
  return out;
}

export function lerpCol(a: Float32Array | undefined, s: Sample, n: number): number {
  if (!a) return NaN;
  const j = Math.min(n - 1, s.i + 1);
  return a[s.i] + (a[j] - a[s.i]) * s.f;
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

const REASONS: { [k: string]: string } = {
  target_down: 'target was already destroyed', decoyed: 'decoyed by flares or chaff', out_of_energy: 'ran out of energy',
  no_lock: 'seeker never locked the target', lost_lock: 'seeker lost the target',
};
// Plain-words result of a missile shot. Everything except a kill is an estimate.
export function outcomeText(l: any): string {
  if (!l) return '';
  if (l.outcome === 'kill') return 'Kill';
  if (l.outcome === 'close') return 'Passed within ' + l.missDistanceM + ' m, no kill recorded';
  if (l.outcome === 'miss') return 'Missed' + (REASONS[l.reason] ? ': ' + REASONS[l.reason] : '') + (l.missDistanceM !== undefined ? ' (closest ' + (l.missDistanceM >= 1000 ? (l.missDistanceM / 1000).toFixed(1) + ' km' : l.missDistanceM + ' m') + ')' : '');
  return 'Target not identified';
}
