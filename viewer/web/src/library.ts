// Library page: every converted match, with trends, a Pk calculator, heatmaps
// and a comparison with the best players. Data: /api/library.
import { loadTerrain, Terrain } from './data';
import { Settings, fmtAlt, fmtDist } from './scene';
import { chart, PAL } from './charts';
import { loadLibrary, usableShots, estimatePk, family, LibShot } from './pk';
import { loadWeapons, physFor, envelope } from './envelope';

function h(tag: string, cls = '', text = ''): HTMLElement { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
const pct = (v: number | null | undefined) => v == null || !isFinite(v) ? '—' : Math.round(v * 100) + '%';
const avg = (a: number[]) => { const v = a.filter(x => x != null && isFinite(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; };
const prettyLevel = (l: string) => (l || '').replace(/^(air|avg)_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export interface LibraryHost { settings: Settings; openMatch(id: string): void; close(): void; }

interface MatchRow { m: any; me: any | null; date: Date; }

const TABS: [string, string][] = [['overview', 'Overview & trends'], ['pk', 'Pk calculator'], ['heat', 'Heatmaps'], ['compare', 'Compare with the best']];

export class Library {
  private root: HTMLElement; private host: LibraryHost;
  private lib: any = null;
  private rows: MatchRow[] = [];
  private selected = new Set<string>();
  private tab = 'overview';
  private body!: HTMLElement; private list!: HTMLElement;
  private fMap = ''; private fAc = '';
  private pkState: any = null;
  private heatState = { level: '', layer: 'fly' };
  private terrains = new Map<string, Terrain | null>();

  constructor(root: HTMLElement, host: LibraryHost) { this.root = root; this.host = host; }

  async open(force = false) {
    this.root.hidden = false;
    if (!this.lib || force) {
      this.root.innerHTML = ''; this.root.appendChild(h('div', 'pageMsg', 'Reading the library… (new matches are analysed the first time, a few seconds each)'));
      this.lib = await loadLibrary(force);
      await loadWeapons();
      this.index();
      if (!this.selected.size) for (const r of this.rows) this.selected.add(r.m.id);
    }
    this.build();
  }
  close() { this.root.hidden = true; }
  reset() { this.lib = null; this.selected.clear(); this.pkState = null; }

  private meName() { return (this.host.settings.me || '').trim().toLowerCase(); }
  private index() {
    const me = this.meName();
    this.rows = (this.lib.matches || []).map((m: any) => ({ m, me: me ? (m.players || []).find((p: any) => p.name.toLowerCase() === me) || null : null, date: new Date(m.startUTC || 0) }));
    this.rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  private sel(): MatchRow[] { return this.rows.filter(r => this.selected.has(r.m.id)); }

  private build() {
    const r = this.root; r.innerHTML = '';
    const head = h('div', 'pageHead');
    head.appendChild(h('div', 'pageTitle', 'Library'));
    head.appendChild(h('div', 'muted', this.rows.length + ' matches · me = ' + (this.host.settings.me || '(set your name in the top bar)')));
    const tabs = h('div', 'pageTabs');
    for (const [id, label] of TABS) {
      const b = h('button', id === this.tab ? 'on' : '', label) as HTMLButtonElement; b.dataset.tab = id;
      b.onclick = () => { this.tab = id; for (const x of Array.from(tabs.children) as HTMLElement[]) x.classList.toggle('on', x.dataset.tab === id); this.render(); };
      tabs.appendChild(b);
    }
    head.appendChild(tabs);
    const re = h('button', '', 'Refresh') as HTMLButtonElement; re.onclick = () => this.open(true);
    const back = h('button', 'back', '← Back to replay') as HTMLButtonElement; back.onclick = () => this.host.close();
    head.append(re, back);
    r.appendChild(head);
    const split = h('div', 'libSplit');
    const side = h('div', 'libSide');
    // filters
    const maps = [...new Set(this.rows.map(x => x.m.level))].sort();
    const acs = [...new Set(this.rows.flatMap(x => x.me ? x.me.vehicles || [] : []))].sort();
    const fm = document.createElement('select'); fm.appendChild(new Option('All maps', ''));
    for (const m of maps) fm.appendChild(new Option(prettyLevel(m), m)); fm.value = this.fMap;
    const fa = document.createElement('select'); fa.appendChild(new Option('All my aircraft', ''));
    for (const a of acs) fa.appendChild(new Option(a, a)); fa.value = this.fAc;
    const apply = () => {
      this.fMap = fm.value; this.fAc = fa.value; this.selected.clear();
      for (const x of this.rows) if ((!this.fMap || x.m.level === this.fMap) && (!this.fAc || (x.me && (x.me.vehicles || []).includes(this.fAc)))) this.selected.add(x.m.id);
      this.renderList(); this.render();
    };
    fm.onchange = apply; fa.onchange = apply;
    const fr = h('div', 'filters'); fr.append(fm, fa);
    const allB = h('button', '', 'All') as HTMLButtonElement; allB.onclick = () => { for (const x of this.rows) this.selected.add(x.m.id); this.renderList(); this.render(); };
    const noneB = h('button', '', 'None') as HTMLButtonElement; noneB.onclick = () => { this.selected.clear(); this.renderList(); this.render(); };
    fr.append(allB, noneB);
    side.appendChild(fr);
    this.list = h('div', 'matchList'); side.appendChild(this.list);
    this.body = h('div', 'pageBody');
    split.append(side, this.body); r.appendChild(split);
    this.renderList(); this.render();
  }

  private renderList() {
    const l = this.list; l.innerHTML = '';
    for (const x of [...this.rows].reverse()) {
      const row = h('label', 'mrow');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = this.selected.has(x.m.id);
      cb.onchange = () => { if (cb.checked) this.selected.add(x.m.id); else this.selected.delete(x.m.id); this.render(); };
      const txt = h('div', '');
      txt.appendChild(h('div', '', prettyLevel(x.m.level) + ' · ' + x.date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + x.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
      txt.appendChild(h('div', 'muted', x.me ? (x.me.vehicles || []).join(', ') + ' · ' + (x.me.summary.kills || 0) + ' / ' + (x.me.summary.deaths || 0) : 'you are not in this match'));
      const open = h('button', 'mini', 'Open') as HTMLButtonElement; open.onclick = e => { e.preventDefault(); this.host.openMatch(x.m.id); };
      row.append(cb, txt, open); l.appendChild(row);
    }
  }

  private render() {
    const b = this.body; b.innerHTML = '';
    if (!this.rows.length) { b.appendChild(h('div', 'pageMsg', 'No converted matches yet.')); return; }
    if (!this.sel().length) { b.appendChild(h('div', 'pageMsg', 'Tick at least one match on the left.')); return; }
    switch (this.tab) {
      case 'overview': this.overview(b); break;
      case 'pk': this.pk(b); break;
      case 'heat': this.heat(b); break;
      case 'compare': this.compare(b); break;
    }
  }

  // metrics for one player in one match
  private metrics(p: any) {
    const s = p.summary || {};
    return {
      kills: s.kills || 0, deaths: s.deaths || 0, shots: s.shots || 0,
      killRate: s.shots ? (s.missileKills || 0) / s.shots : NaN,
      poorShare: s.shots ? (s.shotsPoor || 0) / s.shots : NaN,
      shotRangeKm: s.avgShotRangeM ? s.avgShotRangeM / 1000 : NaN,
      rangeRatio: s.avgRangeRatio ?? NaN,
      reaction: s.avgReactionS ?? NaN, notch: s.avgNotchShare ?? NaN, survived: s.missilesSurvivedShare ?? NaN,
      alone: s.aloneShare ?? NaN, alt: s.meanAltM ?? NaN, firstShot: s.engagements ? s.firstShotShare : NaN,
    };
  }

  // ---------------- overview & trends ----------------
  private overview(b: HTMLElement) {
    const rows = this.sel().filter(r => r.me);
    if (!rows.length) { b.appendChild(h('div', 'pageMsg', 'You are not in the selected matches. Check your name in the top bar ("Me").')); return; }
    const units = this.host.settings.units;
    const ms = rows.map(r => this.metrics(r.me));
    const sum = (k: string) => ms.reduce((a, m: any) => a + (m[k] || 0), 0);
    const tk = rows.reduce((a, r) => a + (r.me.summary.teamKills || 0), 0);
    const mk = rows.reduce((a, r) => a + (r.me.summary.missileKills || 0), 0);
    const poor = rows.reduce((a, r) => a + (r.me.summary.shotsPoor || 0), 0);
    const tiles = h('div', 'tiles');
    const tile = (k: string, v: string, sub = '') => { const t = h('div', 'tile'); t.append(h('span', '', k), h('b', '', v)); if (sub) t.appendChild(h('small', '', sub)); tiles.appendChild(t); };
    tile('Matches', String(rows.length));
    tile('Kills / deaths', sum('kills') + ' / ' + sum('deaths'), 'K/D ' + (sum('deaths') ? (sum('kills') / sum('deaths')).toFixed(2) : '∞') + (tk ? ' · ' + tk + ' team kills' : ''));
    tile('Missiles fired', String(sum('shots')), (sum('shots') ? Math.round(mk / sum('shots') * 100) : 0) + '% killed');
    tile('Poor shots', pct(sum('shots') ? poor / sum('shots') : NaN), 'graded poor at launch');
    tile('Average shot range', isFinite(avg(ms.map(m => m.shotRangeKm))) ? fmtDist(avg(ms.map(m => m.shotRangeKm)) * 1000, units) : '—', pct(avg(ms.map(m => m.rangeRatio))) + ' of max range');
    tile('Reaction to launches', isFinite(avg(ms.map(m => m.reaction))) ? avg(ms.map(m => m.reaction)).toFixed(1) + ' s' : '—');
    tile('Notch held', pct(avg(ms.map(m => m.notch))));
    tile('Missiles survived', pct(avg(ms.map(m => m.survived))));
    tile('Flying alone', pct(avg(ms.map(m => m.alone))));
    tile('Average altitude', isFinite(avg(ms.map(m => m.alt))) ? fmtAlt(avg(ms.map(m => m.alt)), units) : '—');
    b.appendChild(tiles);
    b.appendChild(h('h3', '', 'Trends, match by match'));
    b.appendChild(h('p', 'fine', 'Solid: you. Dashed: the average of everyone in that match. Click a point to open the match.'));
    const fmtX = (i: number) => { const r = rows[Math.max(0, Math.min(rows.length - 1, Math.round(i)))]; return r ? r.date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''; };
    const lobbyAvg = (r: MatchRow, k: string) => avg((r.m.players || []).map((p: any) => (this.metrics(p) as any)[k]));
    const grid = h('div', 'grid2');
    const small = (title: string, k: string, fmt: (v: number) => string, withLobby = true) => {
      const box = h('div', 'gbox'); box.appendChild(h('div', 'cap', title));
      const series = [{ name: 'You', color: PAL.blue, pts: rows.map((r, i) => [i, (ms[i] as any)[k]]) }];
      if (withLobby) series.push({ name: 'Lobby average', color: PAL.ink3, pts: rows.map((r, i) => [i, lobbyAvg(r, k)]), dashed: true } as any);
      chart(box, { x0: 0, x1: Math.max(1, rows.length - 1), height: 110, series, xFmt: fmtX, yFmt: fmt, onClick: x => this.host.openMatch(rows[Math.max(0, Math.min(rows.length - 1, Math.round(x)))].m.id) });
      grid.appendChild(box);
    };
    small('Kills per match', 'kills', v => v.toFixed(1));
    small('Deaths per match', 'deaths', v => v.toFixed(1));
    small('Share of missiles that killed', 'killRate', v => Math.round(v * 100) + '%');
    small('Share of poor shots', 'poorShare', v => Math.round(v * 100) + '%');
    small('Reaction time to launches', 'reaction', v => v.toFixed(1) + ' s');
    small('Notch held', 'notch', v => Math.round(v * 100) + '%');
    small('Flying alone', 'alone', v => Math.round(v * 100) + '%');
    small('Average altitude', 'alt', v => fmtAlt(v, units));
    b.appendChild(grid);
    if (rows.length < 5) b.appendChild(h('p', 'fine', 'Trends become meaningful after 10 or more matches.'));
  }

  // ---------------- Pk calculator ----------------
  private pk(b: HTMLElement) {
    const ids = new Set(this.sel().map(r => r.m.id));
    const shots = usableShots(this.lib, ids);
    if (shots.length < 10) { b.appendChild(h('div', 'pageMsg', 'Not enough recorded shots in the selected matches.')); return; }
    const units = this.host.settings.units;
    const counts = new Map<string, number>(); for (const s of shots) counts.set(s.model, (counts.get(s.model) || 0) + 1);
    const models = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const me = this.meName();
    const mySlots = new Map<string, number>(); for (const r of this.sel()) if (r.me) mySlots.set(r.m.id, r.me.slot);
    const mine = (s: LibShot) => mySlots.get(s.match) === s.shooterSlot;
    if (!this.pkState || !counts.has(this.pkState.model)) {
      const myTop = models.find(([m]) => shots.some(s => s.model === m && mine(s)));
      const model = (myTop || models[0])[0];
      this.pkState = this.defaultsFor(model, shots.filter(s => s.model === model));
    }
    const st = this.pkState;
    b.appendChild(h('p', 'fine', 'Set up a shot. The estimate comes from the most similar shots recorded in the selected matches (all players), plus the fly-out estimate from the game\'s missile data. Shots whose target was destroyed by something else are left out.'));
    const form = h('div', 'pkForm');
    const ms = document.createElement('select');
    for (const [m, n] of models) ms.appendChild(new Option(m + ' (' + n + ' shots)', m));
    ms.value = st.model;
    ms.onchange = () => { this.pkState = this.defaultsFor(ms.value, shots.filter(s => s.model === ms.value)); this.render(); };
    const fld = (label: string, key: string, step: number, min: number, max: number, fmt: (v: number) => string) => {
      const w = h('label', 'pkf'); w.appendChild(h('span', '', label));
      const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(st[key]);
      const out = h('b', '', fmt(st[key]));
      inp.oninput = () => { st[key] = Number(inp.value); out.textContent = fmt(st[key]); update(); };
      w.append(inp, out); form.appendChild(w);
    };
    const mw = h('label', 'pkf'); mw.append(h('span', '', 'Missile'), ms); form.appendChild(mw);
    fld('Range', 'range', 500, 1000, 90000, v => fmtDist(v, units));
    fld('Target aspect (0 = flying at you)', 'aspect', 5, 0, 180, v => v + '°');
    fld('Your altitude', 'shooterAlt', 250, 0, 14000, v => fmtAlt(v, units));
    fld('Target altitude', 'targetAlt', 250, 0, 14000, v => fmtAlt(v, units));
    fld('Your Mach', 'shooterMach', 0.05, 0.3, 2.2, v => v.toFixed(2));
    fld('Target Mach', 'targetMach', 0.05, 0.3, 2.2, v => v.toFixed(2));
    fld('Target height above ground', 'targetAgl', 10, 0, 3000, v => fmtAlt(v, units));
    b.appendChild(form);
    const out = h('div', 'pkOut'); b.appendChild(out);
    const table = h('div', ''); b.appendChild(table);
    const update = () => {
      out.innerHTML = '';
      const pool = shots;
      const r = estimatePk(pool, { model: st.model, guidance: pool.find(s => s.model === st.model)?.guidance || '', range: st.range, aspect: st.aspect, shooterAlt: st.shooterAlt, targetAlt: st.targetAlt, shooterMach: st.shooterMach, targetMach: st.targetMach, targetAgl: st.targetAgl });
      const big = h('div', 'pkBig');
      if (r) {
        big.append(h('b', '', Math.round(r.pk * 100) + '%'), h('span', '', 'chance of a kill · ' + r.n + ' similar shots from ' + r.pool + ' · 90% range ' + Math.round(r.lo * 100) + '–' + Math.round(r.hi * 100) + '%'));
      } else big.append(h('b', '', '—'), h('span', '', 'too few similar shots'));
      out.appendChild(big);
      const ph = physFor(undefined, st.model);
      if (ph) {
        const [snd] = [Math.sqrt(1.4 * 287.05 * (288.15 - 0.0065 * Math.min(st.shooterAlt, 11000)))];
        const [sndT] = [Math.sqrt(1.4 * 287.05 * (288.15 - 0.0065 * Math.min(st.targetAlt, 11000)))];
        const [rmax, rne] = envelope(ph, st.shooterAlt, st.shooterMach * snd, st.targetAlt, st.targetMach * sndT, st.aspect);
        const zone = st.range <= rne ? 'inside no-escape range' : st.range <= rmax ? 'inside max range, but the target can outrun it' : 'beyond max range';
        out.appendChild(h('div', 'pkEnv', 'Fly-out estimate: max range ' + fmtDist(rmax, units) + ', no-escape range ' + fmtDist(rne, units) + ' — ' + zone + '.'));
        if (ph.multipath && ph.multipath.length === 4 && st.targetAgl < ph.multipath[2] && ph.guidance !== 'IR')
          out.appendChild(h('div', 'pkEnv warn', 'Target below ' + Math.round(ph.multipath[2]) + ' m above ground: this radar missile suffers multipath.'));
      }
      if (r) {
        const my = r.neighbours.filter(mine);
        out.appendChild(h('div', 'fine', 'Of these similar shots, ' + my.length + ' were yours (' + my.filter(s => s.kill).length + ' killed).'));
      }
    };
    update();
    // range x aspect table
    const fam = family(st.model);
    const famShots = shots.filter(s => family(s.model) === fam);
    table.appendChild(h('h3', '', 'Kill rate by range and aspect — ' + fam + ' family (' + famShots.length + ' shots)'));
    const bandsR = [[0, 10000], [10000, 20000], [20000, 30000], [30000, 40000], [40000, 1e9]];
    const bandsA: [string, number, number][] = [['Hot (0–60°)', 0, 60], ['Beam (60–120°)', 60, 120], ['Cold (120–180°)', 120, 181]];
    const tbl = h('div', 'tbl pkTbl');
    const hd = h('div', 'tr th'); hd.appendChild(h('div', '', 'Range'));
    for (const a of bandsA) hd.appendChild(h('div', '', a[0]));
    tbl.appendChild(hd);
    for (const [r0, r1] of bandsR) {
      const row = h('div', 'tr');
      row.appendChild(h('div', '', fmtDist(r0, units) + (r1 < 1e9 ? '–' + fmtDist(r1, units) : '+')));
      for (const a of bandsA) {
        const sel = famShots.filter(s => s.range >= r0 && s.range < r1 && s.aspect >= a[1] && s.aspect < a[2]);
        const k = sel.filter(s => s.kill).length;
        const c = h('div', 'num cell', sel.length ? Math.round(k / sel.length * 100) + '%' : '—');
        if (sel.length) { c.title = k + ' kills of ' + sel.length + ' shots'; c.style.background = 'rgba(27,175,122,' + (0.08 + 0.5 * k / sel.length) + ')'; c.appendChild(h('small', '', ' ' + k + '/' + sel.length)); }
        row.appendChild(c);
      }
      tbl.appendChild(row);
    }
    table.appendChild(tbl);
    void me;
  }
  private defaultsFor(model: string, list: LibShot[]): any {
    const med = (k: keyof LibShot, d: number) => { const v = list.map(s => s[k] as number).filter(x => x != null && isFinite(x)).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : d; };
    return { model, range: Math.round(med('range', 20000) / 500) * 500, aspect: Math.round(med('aspect', 45) / 5) * 5, shooterAlt: Math.round(med('shooterAlt', 6000) / 250) * 250,
      targetAlt: Math.round(med('targetAlt', 6000) / 250) * 250, shooterMach: Math.round(med('shooterMach', 1) * 20) / 20, targetMach: Math.round(med('targetMach', 1) * 20) / 20, targetAgl: 2000 };
  }

  // ---------------- heatmaps ----------------
  private heat(b: HTMLElement) {
    const rows = this.sel();
    const levels = [...new Set(rows.map(r => r.m.level))].sort();
    const hs = this.heatState;
    if (!levels.includes(hs.level)) hs.level = levels[0];
    const bar = h('div', 'filters');
    const ls = document.createElement('select'); for (const l of levels) ls.appendChild(new Option(prettyLevel(l) + ' (' + rows.filter(r => r.m.level === l).length + ')', l)); ls.value = hs.level;
    const layers: [string, string][] = [['fly', 'Where I fly'], ['kills', 'Where I get kills'], ['deaths', 'Where I die'], ['launches', 'Where I fire missiles'], ['allDeaths', 'Where everyone dies'], ['allKills', 'Where everyone gets kills'], ['top', 'Where each match\'s top scorer flies']];
    const ly = document.createElement('select'); for (const [k, v] of layers) ly.appendChild(new Option(v, k)); ly.value = hs.layer;
    ls.onchange = () => { hs.level = ls.value; this.render(); }; ly.onchange = () => { hs.layer = ly.value; this.render(); };
    bar.append(ls, ly); b.appendChild(bar);
    const cv = document.createElement('canvas'); cv.className = 'heat'; cv.width = cv.height = 720; b.appendChild(cv);
    const note = h('p', 'fine', ''); b.appendChild(note);
    const ctx = cv.getContext('2d')!;
    const draw = (tr: Terrain | null) => {
      const W = cv.width, ext = tr ? { x0: tr.x0, z0: tr.z0, x1: tr.x1, z1: tr.z1 } : { x0: -65536, z0: -65536, x1: 65536, z1: 65536 };
      // relief, grey so the heat stands out
      const img = ctx.createImageData(W, W); const d = img.data;
      for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
        let v = 0.18;
        if (tr) {
          const c = Math.min(tr.n - 2, Math.floor(px / W * tr.n)), r = Math.min(tr.n - 2, Math.floor((1 - py / W) * tr.n));
          const hh = tr.h[r * tr.n + c];
          if (hh <= tr.water + 0.5) v = 0.12;
          else { const dx = tr.h[r * tr.n + c + 1] - hh, dz = tr.h[(r + 1) * tr.n + c] - hh; v = 0.22 + 0.10 * (hh - tr.hMin) / Math.max(1, tr.hMax - tr.hMin) + Math.max(-0.06, Math.min(0.08, (-dx + dz) / tr.cell * 0.6)); }
        }
        const o = (py * W + px) * 4; d[o] = d[o + 1] = d[o + 2] = Math.round(v * 255); d[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      // heat grid, 1 km cells
      const N = 128, grid = new Float32Array(N * N);
      const addPts = (arr: number[] | undefined, wgt = 1) => {
        if (!arr) return;
        for (let i = 0; i + 1 < arr.length; i += 2) {
          const gx = Math.floor((arr[i] * 1000 - ext.x0) / (ext.x1 - ext.x0) * N), gz = Math.floor((arr[i + 1] * 1000 - ext.z0) / (ext.z1 - ext.z0) * N);
          if (gx >= 0 && gx < N && gz >= 0 && gz < N) grid[gz * N + gx] += wgt;
        }
      };
      let nPts = 0; const me = this.meName();
      for (const r of rows.filter(r => r.m.level === hs.level)) {
        const players = r.m.players || [];
        const meP = players.find((p: any) => p.name.toLowerCase() === me);
        switch (hs.layer) {
          case 'fly': if (meP) { addPts(meP.track); nPts += meP.track.length / 2; } break;
          case 'kills': if (meP) { addPts(meP.kills, 8); nPts += meP.kills.length / 2; } break;
          case 'deaths': if (meP) { addPts(meP.deaths, 8); nPts += meP.deaths.length / 2; } break;
          case 'launches': if (meP) { addPts(meP.launches, 8); nPts += meP.launches.length / 2; } break;
          case 'allDeaths': for (const p of players) { addPts(p.deaths, 8); nPts += p.deaths.length / 2; } break;
          case 'allKills': for (const p of players) { addPts(p.kills, 8); nPts += p.kills.length / 2; } break;
          case 'top': {
            const top = players.filter((p: any) => p.name.toLowerCase() !== me).sort((a: any, b2: any) => ((b2.results || {}).score || 0) - ((a.results || {}).score || 0))[0];
            if (top) { addPts(top.track); nPts += top.track.length / 2; }
            break;
          }
        }
      }
      // blur (3x3 twice) and paint with a single-hue ramp
      const blur = (src: Float32Array) => { const out = new Float32Array(N * N); for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { let s = 0, w = 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && xx < N && zz >= 0 && zz < N) { const k = dx === 0 && dz === 0 ? 4 : (dx === 0 || dz === 0 ? 2 : 1); s += src[zz * N + xx] * k; w += k; } } out[z * N + x] = s / w; } return out; };
      const g2 = blur(blur(grid)); let mx = 0; for (const v of g2) mx = Math.max(mx, v);
      const cell = W / N;
      if (mx > 0) for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
        const v = g2[z * N + x] / mx; if (v < 0.03) continue;
        const a = Math.min(0.9, 0.15 + 0.85 * Math.sqrt(v));
        const r0 = 255, g0 = Math.round(200 - 140 * v), b0 = Math.round(80 - 60 * v);
        ctx.fillStyle = `rgba(${r0},${g0},${b0},${a})`; ctx.fillRect(x * cell, W - (z + 1) * cell, cell + 0.5, cell + 0.5);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
      for (let km = Math.ceil(ext.x0 / 10000) * 10; km * 1000 <= ext.x1; km += 10) { const px = (km * 1000 - ext.x0) / (ext.x1 - ext.x0) * W; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, W); ctx.stroke(); }
      for (let km = Math.ceil(ext.z0 / 10000) * 10; km * 1000 <= ext.z1; km += 10) { const py = W - (km * 1000 - ext.z0) / (ext.z1 - ext.z0) * W; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); }
      note.textContent = Math.round(nPts) + ' points from ' + rows.filter(r => r.m.level === hs.level).length + ' matches. North is up; grid lines every 10 km. Darker orange = more.';
    };
    if (this.terrains.has(hs.level)) draw(this.terrains.get(hs.level)!);
    else loadTerrain(hs.level).then(tr => { this.terrains.set(hs.level, tr); draw(tr); });
  }

  // ---------------- compare ----------------
  private compare(b: HTMLElement) {
    const rows = this.sel().filter(r => r.me);
    if (!rows.length) { b.appendChild(h('div', 'pageMsg', 'You are not in the selected matches.')); return; }
    const units = this.host.settings.units;
    const me = this.meName();
    const mine: any[] = [], tops: any[] = [], lobby: any[] = [], same: any[] = [];
    for (const r of rows) {
      const ps = (r.m.players || []).filter((p: any) => p.name.toLowerCase() !== me);
      mine.push(this.metrics(r.me));
      const top = [...ps].sort((a: any, b2: any) => ((b2.results || {}).score || 0) - ((a.results || {}).score || 0))[0];
      if (top) tops.push(this.metrics(top));
      for (const p of ps) lobby.push(this.metrics(p));
      const myAc = new Set(r.me.vehicles || []);
      for (const p of ps) if ((p.vehicles || []).some((v: string) => myAc.has(v))) same.push(this.metrics(p));
    }
    b.appendChild(h('p', 'fine', 'Averages per match over the ' + rows.length + ' selected matches you played. "Top scorer" = the highest-scoring other player of each match. "Same aircraft" = other players who flew one of your aircraft in that match (' + same.length + ' player-matches).'));
    const col = (arr: any[], k: string) => avg(arr.map(m => m[k]));
    const lines: [string, string, (v: number) => string, boolean][] = [
      ['Kills', 'kills', v => v.toFixed(2), true], ['Deaths', 'deaths', v => v.toFixed(2), false], ['Missiles fired', 'shots', v => v.toFixed(1), true],
      ['Share of missiles that killed', 'killRate', v => pct(v), true], ['Share of poor shots', 'poorShare', v => pct(v), false],
      ['Average shot range', 'shotRangeKm', v => fmtDist(v * 1000, units), true], ['Shot range as share of max range', 'rangeRatio', v => pct(v), false],
      ['Reaction time to launches', 'reaction', v => v.toFixed(1) + ' s', false], ['Notch held', 'notch', v => pct(v), true], ['Missiles survived', 'survived', v => pct(v), true],
      ['First shot in engagements', 'firstShot', v => pct(v), true], ['Flying alone', 'alone', v => pct(v), false], ['Average altitude', 'alt', v => fmtAlt(v, units), true],
    ];
    const tbl = h('div', 'tbl cmp');
    const hd = h('div', 'tr th'); for (const c of ['', 'You', 'Top scorer', 'Same aircraft', 'Lobby average']) hd.appendChild(h('div', '', c)); tbl.appendChild(hd);
    for (const [label, k, fmt] of lines) {
      const row = h('div', 'tr'); row.appendChild(h('div', '', label));
      for (const arr of [mine, tops, same, lobby]) { const v = col(arr, k); row.appendChild(h('div', 'num' + (arr === mine ? ' me' : ''), isFinite(v) ? fmt(v) : '—')); }
      tbl.appendChild(row);
    }
    b.appendChild(tbl);
  }
}
