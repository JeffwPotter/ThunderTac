// Probability of kill from history: among all recorded missile shots in the
// library (every player, every match), find the shots most like this one and
// count how many killed. Shots whose target was destroyed by something else,
// or whose target is unknown, are left out. A scope (a set of player names)
// limits the pool to those shooters, e.g. only my own shots, or mine and my
// wingman's.

let libCache: Promise<any> | null = null;
export function loadLibrary(force = false): Promise<any> {
  if (!libCache || force) libCache = fetch('/api/library').then(r => r.ok ? r.json() : { matches: [] }).catch(() => ({ matches: [] }));
  return libCache;
}

export interface LibShot {
  match: string; t: number; model: string; guidance: string; range: number; aspect: number;
  shooterAlt: number; targetAlt: number; shooterMach: number; targetMach: number; targetAgl: number | null;
  rangeRatio: number | null; rmax: number | null; rne: number | null; multipath: number; notch: boolean; locked: boolean;
  outcome: string; reason: string; grade: string; shooterSlot: number; targetSlot: number; kill: boolean;
  shooterName: string; // lower case, '' when unknown
}

export function family(model: string): string {
  const m = /^([A-Za-z]+[- ]?\d+)/.exec(model || '');
  return m ? m[1].toUpperCase().replace(' ', '-') : (model || '').toUpperCase();
}

export function usableShots(lib: any, matchIds?: Set<string>): LibShot[] {
  const out: LibShot[] = [];
  for (const m of lib.matches || []) {
    if (matchIds && !matchIds.has(m.id)) continue;
    const names = new Map<number, string>(); for (const p of m.players || []) names.set(p.slot, String(p.name || '').toLowerCase());
    for (const s of m.shots || []) {
      if (s.range == null || s.aspect == null || s.shooterAlt == null || s.targetAlt == null) continue;
      if (!['kill', 'miss', 'close'].includes(s.outcome) || s.reason === 'target_down') continue;
      out.push({
        match: m.id, t: s.t, model: s.model, guidance: s.guidance, range: s.range, aspect: s.aspect, shooterAlt: s.shooterAlt, targetAlt: s.targetAlt,
        shooterMach: s.shooterMach ?? 0.9, targetMach: s.targetMach ?? 0.9, targetAgl: s.targetAgl ?? null, rangeRatio: s.rangeRatio ?? null,
        rmax: s.rmax ?? null, rne: s.rne ?? null, multipath: s.multipath || 0, notch: !!s.notch, locked: !!s.locked,
        outcome: s.outcome, reason: s.reason || '', grade: s.grade, shooterSlot: s.shooterSlot, targetSlot: s.targetSlot, kill: s.outcome === 'kill',
        shooterName: names.get(s.shooterSlot) || '',
      });
    }
  }
  return out;
}

// multipath: the missile's multipath effect at the target's height (0 none … 1 full, from the
// game data); when not given it is taken as 1 below 60 m above ground and 0 above.
export interface PkQuery { model: string; guidance: string; range: number; aspect: number; shooterAlt: number; targetAlt: number; shooterMach: number; targetMach: number; targetAgl?: number | null; multipath?: number; }

export type PkScope = 'all' | 'self' | 'squad';
// names (lower case) whose shots a scope keeps; null = everyone
export function scopeNames(scope: PkScope, me: string, wingmen: string): Set<string> | null {
  if (scope === 'all') return null;
  const out = new Set<string>(); const m = (me || '').trim().toLowerCase(); if (m) out.add(m);
  if (scope === 'squad') for (const w of (wingmen || '').split(',')) { const n = w.trim().toLowerCase(); if (n) out.add(n); }
  return out;
}
export interface PkResult { pk: number; n: number; lo: number; hi: number; pool: string; poolSize: number; neighbours: LibShot[]; }

// Wilson score interval, 90 %
function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [0, 1];
  const z = 1.645, p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

export function estimatePk(shots: LibShot[], q: PkQuery, exclude?: { match: string, t: number }, scope?: Set<string> | null): PkResult | null {
  const fam = family(q.model);
  const notSelf = (s: LibShot) => !(exclude && s.match === exclude.match && Math.abs(s.t - exclude.t) < 1);
  if (scope) shots = shots.filter(s => scope.has(s.shooterName));
  let pool = shots.filter(s => s.model === q.model && notSelf(s)), label = q.model;
  if (pool.length < 25) { pool = shots.filter(s => family(s.model) === fam && notSelf(s)); label = fam + ' family'; }
  if (pool.length < 25 && q.guidance) { pool = shots.filter(s => s.guidance === q.guidance && notSelf(s)); label = 'all ' + q.guidance + ' missiles'; }
  if (pool.length < 8) return null;
  // Multipath is compared as the effect strength (0–1, from each missile's own game data) rather
  // than "below / above 60 m", so shots at 48 m and 52 m above ground count as alike.
  const mpOf = (agl: number | null | undefined, mp: number | undefined) => mp != null ? mp : (agl != null && agl < 60 ? 1 : 0);
  const mpQ = mpOf(q.targetAgl, q.multipath);
  const d = (s: LibShot) => {
    const mpS = s.multipath != null ? s.multipath : mpOf(s.targetAgl, undefined);
    return Math.hypot((s.range - q.range) / 8000, (s.aspect - q.aspect) / 40, (s.shooterAlt - q.shooterAlt) / 3000,
      (s.targetAlt - q.targetAlt) / 3000, (s.targetMach - q.targetMach) / 0.3, (s.shooterMach - q.shooterMach) / 0.3) + (q.guidance !== 'IR' ? 1.5 * Math.abs(mpS - mpQ) : 0);
  };
  const ranked = pool.map(s => [d(s), s] as [number, LibShot]).sort((a, b) => a[0] - b[0]);
  const k = Math.min(30, Math.max(8, Math.round(pool.length / 4)));
  const near = ranked.slice(0, k).map(r => r[1]);
  const kills = near.filter(s => s.kill).length;
  const [lo, hi] = wilson(kills, near.length);
  return { pk: kills / near.length, n: near.length, lo, hi, pool: label + (scope ? ' (your shots)' : ''), poolSize: pool.length, neighbours: near };
}
