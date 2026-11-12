// Missile fly-out estimate, the same model as viewer/server/envelope.go
// (keep the two identical). Used for the live launch-zone rings and the Pk calculator.

export interface Phys {
  name: string; caliber: number; cxK: number; thrust: number; burn: number; mass: number; massEnd: number;
  machMax: number; life: number; guidanceTime: number; loft: boolean; multipath: number[] | null; guidance: string;
}

const SHAPE: [number, number][] = [[0, 0.30], [0.8, 0.32], [1.0, 0.55], [1.2, 0.62], [1.4, 0.58], [1.8, 0.48], [2.2, 0.43], [2.7, 0.37], [3.2, 0.34], [3.7, 0.32], [5, 0.29]];
function dragRatio(m: number): number {
  for (let i = 0; i < SHAPE.length - 1; i++) if (m <= SHAPE[i + 1][0]) { const a = SHAPE[i], b = SHAPE[i + 1]; return a[1] + (b[1] - a[1]) * (m - a[0]) / (b[0] - a[0]); }
  return SHAPE[SHAPE.length - 1][1];
}
export function atmosphere(h: number): [number, number] {
  h = Math.max(0, h); let T: number, p: number;
  if (h <= 11000) { T = 288.15 - 0.0065 * h; p = 101325 * Math.pow(T / 288.15, 5.2559); } else { T = 216.65; p = 22632 * Math.exp(-(h - 11000) / 6341.6); }
  return [p / (287.05 * T), Math.sqrt(1.4 * 287.05 * T)];
}

function reaches(m: Phys, r: number, h0: number, h1: number, v0: number, tvx: number, tvz: number, tSpeed: number): boolean {
  const A = Math.PI * m.caliber * m.caliber / 4;
  let hEff = (h0 + h1) / 2; if (m.loft) hEff += Math.min(5000, 0.08 * r);
  const [rho, snd] = atmosphere(hEff);
  const dh = h1 - h0; const d0 = Math.hypot(r, dh); const sinG = d0 > 0 ? dh / d0 : 0;
  const vMin = Math.max(280, 1.1 * tSpeed);
  let tMax = Math.min(m.life, m.guidanceTime); if (tMax <= 0) tMax = 60;
  let v = Math.max(v0, 50), s = 0, t = 0; const dt = 0.1;
  while (t < tMax) {
    const mass = m.burn > 0 ? m.mass - (m.mass - m.massEnd) * Math.min(t, m.burn) / m.burn : m.mass;
    const F = t < m.burn ? m.thrust : 0;
    const D = 0.5 * rho * v * v * A * m.cxK * dragRatio(v / snd);
    v += ((F - D) / mass - 9.81 * sinG) * dt;
    if (m.machMax > 0) v = Math.min(v, m.machMax * snd);
    s += v * dt; t += dt;
    const px = r + tvx * t, pz = tvz * t;
    if (s >= Math.sqrt(px * px + pz * pz + dh * dh)) return v >= vMin || t < m.burn;
    if (v < vMin && t > m.burn) return false;
  }
  return false;
}

// [max range (target keeps flying), no-escape range (target turns away)], metres
export function envelope(m: Phys, shooterAlt: number, shooterSpeed: number, targetAlt: number, targetSpeed: number, aspectDeg: number): [number, number] {
  if (!m || m.thrust <= 0 || m.caliber <= 0 || m.mass <= 0) return [0, 0];
  const a = aspectDeg * Math.PI / 180;
  const search = (tvx: number, tvz: number) => {
    let lo = 1000, hi = 250000;
    if (!reaches(m, lo, shooterAlt, targetAlt, shooterSpeed, tvx, tvz, targetSpeed)) return 0;
    for (let i = 0; i < 22 && hi - lo > 100; i++) { const mid = (lo + hi) / 2; if (reaches(m, mid, shooterAlt, targetAlt, shooterSpeed, tvx, tvz, targetSpeed)) lo = mid; else hi = mid; }
    return lo;
  };
  return [Math.round(search(-targetSpeed * Math.cos(a), targetSpeed * Math.sin(a))), Math.round(search(targetSpeed, 0))];
}

let weapons: any = undefined;
let byName: Map<string, string> | null = null;
export async function loadWeapons(): Promise<any> {
  if (weapons !== undefined) return weapons;
  weapons = null;
  try { const r = await fetch('/api/catalog/weapons.json'); if (r.ok) weapons = (await r.json()).missiles; } catch (e) { /* none */ }
  if (weapons) {
    byName = new Map();
    for (const k of Object.keys(weapons).sort()) { const n = String(weapons[k].name || '').toLowerCase(); if (!byName.has(n) && weapons[k].physics) byName.set(n, k); }
  }
  return weapons;
}

export function physFor(internalName: string | undefined, name: string): Phys | null {
  if (!weapons || !byName) return null;
  let key = internalName && weapons[internalName] ? internalName : byName.get(name.toLowerCase()) || '';
  if (!key) {
    const fam = name.toLowerCase(); let best = '';
    for (const [n, k] of byName) if (n.length > fam.length && n.startsWith(fam) && (!best || n < best)) { best = n; key = k; }
  }
  const e = key ? weapons[key] : null; if (!e || !e.physics) return null;
  const p = e.physics;
  return {
    name: e.name, caliber: p.caliberM || 0, cxK: p.cxK || 1, thrust: p.thrustN || 0, burn: p.burnS || 0, mass: p.massKg || 0,
    massEnd: p.massEndKg || p.massKg || 0, machMax: p.machMax || 0, life: p.lifeS || 60, guidanceTime: p.guidanceTimeS || 60,
    loft: !!p.loft, multipath: p.multipath || null, guidance: e.guidance || '',
  };
}

// all guided air-to-air missiles in the catalogue, for pickers: [key, name]
export function missileList(): [string, string][] {
  if (!weapons) return [];
  const out: [string, string][] = [];
  for (const k of Object.keys(weapons)) { const w = weapons[k]; if (w.type === 'aam' && w.physics && !k.endsWith('_default')) out.push([k, w.name]); }
  return out.sort((a, b) => a[1].localeCompare(b[1]));
}
