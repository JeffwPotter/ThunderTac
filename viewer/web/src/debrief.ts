// Debrief page: report card, shot scorecards, missiles fired at you with the
// notch meter, deaths, engagements, threats and position. Data comes from the
// viewer program's analysis (/api/analysis/<match>).
import { Session, Unit, fmtClock, idxAt } from './data';
import { Settings, fmtAlt, fmtSpeed, fmtDist } from './scene';
import { chart, bars, PAL } from './charts';
import { loadLibrary, usableShots, estimatePk, LibShot } from './pk';

export interface DebriefHost {
  ses(): Session | null;
  settings: Settings;
  meSlot(): number;
  watch(t: number, select: number, follow: boolean): void;
  seek(t: number): void;
  unitTitle(u: Unit): string;
}

function h(tag: string, cls = '', text = ''): HTMLElement { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
const GRADE_TXT: { [k: string]: string } = { good: '✓ Good', fair: '! Fair', poor: '✕ Poor', unknown: '? Unknown' };
function chip(g: string): HTMLElement { return h('span', 'chip g-' + (g || 'unknown'), GRADE_TXT[g] || g); }
function pct(v: number | null | undefined): string { return v == null ? '—' : Math.round(v * 100) + '%'; }
function secs(v: number | null | undefined): string { return v == null ? 'none' : v.toFixed(1) + ' s'; }

const TABS: [string, string][] = [['report', 'Report card'], ['shots', 'My shots'], ['incoming', 'Shots at me'], ['deaths', 'Deaths'], ['engage', 'Engagements'], ['position', 'Threats & position']];

export class Debrief {
  private host: DebriefHost;
  private root: HTMLElement;
  private body!: HTMLElement;
  private picker!: HTMLSelectElement;
  private ana: any = null;
  private anaFor = '';
  private slot = -1;
  private tab = 'report';
  private lib: LibShot[] | null = null;

  constructor(root: HTMLElement, host: DebriefHost) { this.root = root; this.host = host; }

  async open() {
    const ses = this.host.ses(); if (!ses) return;
    this.root.hidden = false;
    if (this.anaFor !== ses.id) {
      this.root.innerHTML = ''; this.root.appendChild(h('div', 'pageMsg', 'Analysing the match… (the first time takes a few seconds)'));
      try {
        const r = await fetch('/api/analysis/' + encodeURIComponent(ses.id));
        if (!r.ok) throw new Error(await r.text());
        this.ana = await r.json(); this.anaFor = ses.id;
      } catch (e: any) { this.root.innerHTML = ''; this.root.appendChild(h('div', 'pageMsg', 'Could not analyse this match: ' + (e && e.message || e))); return; }
      this.slot = this.host.meSlot();
      if (!this.ana.players.some((p: any) => p.slot === this.slot) && this.ana.players.length) this.slot = this.ana.players[0].slot;
    }
    if (!this.lib) loadLibrary().then(lib => { this.lib = usableShots(lib); if (!this.root.hidden && this.tab === 'shots') this.render(); });
    this.build();
  }
  close() { this.root.hidden = true; }
  invalidate() { this.anaFor = ''; }

  private player(): any { return this.ana.players.find((p: any) => p.slot === this.slot); }
  private unit(id: number): Unit | null { const s = this.host.ses(); return s && id >= 0 ? s.units[id] || null : null; }
  private title(id: number): string { const u = this.unit(id); return u ? this.host.unitTitle(u) : '?'; }
  private clock(t: number): string { return fmtClock(t - this.ana.t0); }
  private watchBtn(label: string, t: number, sel: number, follow = true): HTMLElement {
    const b = h('button', 'watch', '▶ ' + label) as HTMLButtonElement; b.onclick = e => { e.stopPropagation(); this.host.watch(t, sel, follow); }; return b;
  }

  private build() {
    const r = this.root; r.innerHTML = '';
    const head = h('div', 'pageHead');
    head.appendChild(h('div', 'pageTitle', 'Debrief'));
    this.picker = document.createElement('select');
    const ses = this.host.ses()!;
    const sorted = [...this.ana.players].sort((a: any, b: any) => (a.team - b.team) || a.name.localeCompare(b.name));
    for (const p of sorted) { const o = document.createElement('option'); o.value = String(p.slot); o.textContent = p.name + ' — ' + (p.vehicles || []).join(', ') + (p.slot === this.host.meSlot() ? '  (me)' : ''); this.picker.appendChild(o); }
    this.picker.value = String(this.slot);
    this.picker.onchange = () => { this.slot = Number(this.picker.value); this.render(); };
    head.appendChild(this.picker);
    const tabs = h('div', 'pageTabs');
    for (const [id, label] of TABS) {
      const b = h('button', id === this.tab ? 'on' : '', label) as HTMLButtonElement; b.dataset.tab = id;
      b.onclick = () => { this.tab = id; for (const x of Array.from(tabs.children) as HTMLElement[]) x.classList.toggle('on', x.dataset.tab === id); this.render(); };
      tabs.appendChild(b);
    }
    head.appendChild(tabs);
    const back = h('button', 'back', '← Back to replay') as HTMLButtonElement; back.onclick = () => this.host.watch(-1, -1, false);
    head.appendChild(back);
    r.appendChild(head);
    this.body = h('div', 'pageBody'); r.appendChild(this.body);
    void ses;
    this.render();
  }

  private render() {
    const b = this.body; b.innerHTML = ''; b.scrollTop = 0;
    const p = this.player(); if (!p) { b.appendChild(h('div', 'pageMsg', 'No data for this player.')); return; }
    for (const n of this.ana.notes || []) b.appendChild(h('div', 'note', n));
    switch (this.tab) {
      case 'report': this.report(b, p); break;
      case 'shots': this.shots(b, p); break;
      case 'incoming': this.incoming(b, p); break;
      case 'deaths': this.deaths(b, p); break;
      case 'engage': this.engagements(b, p); break;
      case 'position': this.position(b, p); break;
    }
  }

  // ---------------- report card ----------------
  private report(b: HTMLElement, p: any) {
    const s = p.summary, units = this.host.settings.units;
    const tiles = h('div', 'tiles');
    const tile = (k: string, v: string, sub = '') => { const t = h('div', 'tile'); t.append(h('span', '', k), h('b', '', v)); if (sub) t.appendChild(h('small', '', sub)); tiles.appendChild(t); };
    tile('Kills / deaths', (s.kills || 0) + ' / ' + (s.deaths || 0), s.teamKills ? s.teamKills + ' team kill' + (s.teamKills > 1 ? 's' : '') : '');
    tile('Missiles fired', String(s.shots || 0), (s.missileKills || 0) + ' killed');
    tile('Shot quality', (s.shotsGood || 0) + ' ✓  ' + (s.shotsFair || 0) + ' !  ' + (s.shotsPoor || 0) + ' ✕', 'good · fair · poor');
    tile('Missiles at you', String(s.missilesAtMe || 0), s.missilesAtMe ? pct(s.missilesSurvivedShare) + ' survived' : '');
    tile('Reaction to launches', s.avgReactionS != null ? s.avgReactionS.toFixed(1) + ' s' : '—', 'median' + (s.noReaction ? ' · ' + s.noReaction + ' with no reaction' : ''));
    tile('Notch held', pct(s.avgNotchShare), 'of the critical time, radar missiles');
    tile('Engagements', String(s.engagements || 0), (s.engagementsWon || 0) + ' won · ' + (s.engagementsLost || 0) + ' lost · first shot ' + pct(s.firstShotShare));
    tile('Average altitude', s.meanAltM != null ? fmtAlt(s.meanAltM, units) : '—');
    tile('Flying alone', pct(s.aloneShare), 'no teammate within 20 km');
    if (s.avgShotRangeM) tile('Average shot range', fmtDist(s.avgShotRangeM, units), s.avgRangeRatio != null ? Math.round(s.avgRangeRatio * 100) + '% of estimated max range' : '');
    b.appendChild(tiles);
    b.appendChild(h('h3', '', 'Biggest mistakes'));
    const ms = p.mistakes || [];
    if (!ms.length) b.appendChild(h('div', 'muted', 'Nothing flagged in this match.'));
    for (const m of ms.slice(0, 3)) b.appendChild(this.mistakeCard(m, true));
    if (ms.length > 3) {
      b.appendChild(h('h3', '', 'Everything else flagged'));
      for (const m of ms.slice(3)) b.appendChild(this.mistakeCard(m, false));
    }
    b.appendChild(h('p', 'fine', 'Shot grades use an estimated launch envelope from the game\'s missile data and the multipath and notch rules from the game files. Miss reasons and reactions are worked out from the recording, not recorded by the game.'));
  }
  private mistakeCard(m: any, big: boolean): HTMLElement {
    const c = h('div', 'mistake' + (big ? ' big' : '') + ' sev' + m.severity);
    c.appendChild(h('div', 'mt', this.clock(m.t)));
    c.appendChild(h('div', 'mx', m.text));
    if (m.select >= 0) c.appendChild(this.watchBtn('Watch', m.t - 5000, m.select));
    return c;
  }

  // ---------------- my shots ----------------
  private shots(b: HTMLElement, p: any) {
    const list = (p.shots || []).map((i: number) => this.ana.shots[i]);
    if (!list.length) { b.appendChild(h('div', 'muted', this.ana.hasShots ? 'No missiles fired.' : 'No shot records in this file.')); return; }
    b.appendChild(h('p', 'fine', 'Range bar: green = inside the estimated no-escape range, amber = the target can still outrun it, red = beyond the estimated max range. Pk from history = share of similar shots in your library that killed.'));
    const tbl = h('div', 'tbl shots');
    const head = h('div', 'tr th');
    for (const c of ['Time', 'Missile', 'Target', 'Range vs envelope', 'Aspect', 'Alt you / target', 'Target above ground', 'Pk (history)', 'Grade', 'Result']) head.appendChild(h('div', '', c));
    tbl.appendChild(head);
    const units = this.host.settings.units;
    for (const s of list) {
      const row = h('div', 'tr click');
      row.appendChild(h('div', 'num', this.clock(s.t)));
      row.appendChild(h('div', '', s.model));
      row.appendChild(h('div', '', s.target >= 0 ? this.title(s.target) : 'not identified'));
      row.appendChild(this.rangeBar(s));
      row.appendChild(h('div', 'num', s.aspectDeg != null ? s.aspectDeg + '° ' + (s.aspectDeg < 60 ? 'hot' : s.aspectDeg > 120 ? 'cold' : 'beam') : '—'));
      row.appendChild(h('div', 'num', s.shooterAltM != null ? fmtAlt(s.shooterAltM, units) + ' / ' + fmtAlt(s.targetAltM, units) : '—'));
      const agl = h('div', 'num', s.targetAglM != null ? fmtAlt(Math.max(0, s.targetAglM), units) : '—');
      if (s.multipathLaunch > 0) agl.appendChild(h('span', 'tag warn', 'multipath'));
      row.appendChild(agl);
      row.appendChild(this.pkCell(s));
      const gc = h('div', ''); gc.appendChild(chip(s.grade)); row.appendChild(gc);
      row.appendChild(h('div', 'res ' + (s.outcome === 'kill' ? 'kill' : ''), this.outcome(s)));
      const det = h('div', 'detail'); det.hidden = true;
      row.onclick = () => { det.hidden = !det.hidden; if (!det.hidden && !det.childElementCount) this.shotDetail(det, s); };
      tbl.append(row, det);
    }
    b.appendChild(tbl);
  }
  private outcome(s: any): string {
    if (s.outcome === 'kill') return 'Kill';
    const R: any = { target_down: 'target already down', decoyed: 'decoyed', out_of_energy: 'out of energy', no_lock: 'never locked', lost_lock: 'lost the target' };
    if (s.outcome === 'close') return 'Close pass, no kill';
    if (s.outcome === 'miss') return 'Miss' + (R[s.reason] ? ' — ' + R[s.reason] : '');
    return 'Unknown';
  }
  private rangeBar(s: any): HTMLElement {
    const c = h('div', 'rb');
    if (s.rangeM == null) { c.textContent = '—'; return c; }
    const units = this.host.settings.units;
    if (!s.rmaxM) { c.textContent = fmtDist(s.rangeM, units) + ' (no envelope)'; return c; }
    const top = Math.max(s.rangeM, s.rmaxM) * 1.1;
    const bar = h('div', 'rbar');
    const seg = (a: number, z: number, cls: string) => { const d = h('div', 'rs ' + cls); d.style.left = (a / top * 100) + '%'; d.style.width = (Math.max(0, z - a) / top * 100) + '%'; bar.appendChild(d); };
    seg(0, s.rneM || 0, 'ok'); seg(s.rneM || 0, s.rmaxM, 'mid'); seg(s.rmaxM, top, 'bad');
    const dot = h('div', 'rdot'); dot.style.left = (s.rangeM / top * 100) + '%'; bar.appendChild(dot);
    c.append(bar, h('span', 'rtxt', fmtDist(s.rangeM, units) + ' · max ' + fmtDist(s.rmaxM, units) + ' · NEZ ' + fmtDist(s.rneM || 0, units)));
    return c;
  }
  private pkFor(s: any) {
    if (!this.lib || s.rangeM == null || s.aspectDeg == null || s.shooterAltM == null || s.targetAltM == null) return null;
    return estimatePk(this.lib, { model: s.model, guidance: s.guidance, range: s.rangeM, aspect: s.aspectDeg, shooterAlt: s.shooterAltM, targetAlt: s.targetAltM,
      shooterMach: s.shooterMach ?? 0.9, targetMach: s.targetMach ?? 0.9, targetAgl: s.targetAglM }, { match: this.ana.session, t: s.t });
  }
  private pkCell(s: any): HTMLElement {
    const c = h('div', 'num');
    if (!this.lib) { c.textContent = '…'; return c; }
    const r = this.pkFor(s);
    if (!r) { c.textContent = 'too few shots'; c.className = 'muted'; return c; }
    c.textContent = Math.round(r.pk * 100) + '%'; c.title = 'Based on ' + r.n + ' similar shots (' + r.pool + '); 90% range ' + Math.round(r.lo * 100) + '–' + Math.round(r.hi * 100) + '%';
    if (r.pk < 0.15) c.classList.add('bad');
    return c;
  }
  private factors(host: HTMLElement, fs: any[]) {
    const ul = h('ul', 'factors');
    for (const f of fs || []) { const li = h('li', 'g-' + f.grade); li.append(h('span', 'fi', f.grade === 'good' ? '✓' : f.grade === 'fair' ? '!' : '✕'), document.createTextNode(' ' + f.text)); ul.appendChild(li); }
    host.appendChild(ul);
  }
  private shotDetail(d: HTMLElement, s: any) {
    const units = this.host.settings.units;
    const cols = h('div', 'cols');
    const left = h('div'); left.appendChild(h('h4', '', 'Why this grade')); this.factors(left, s.factors);
    if (s.multipathTerminal > 0 && s.targetAglMinM != null) left.appendChild(h('div', 'fine', 'Target\'s lowest height during the last 10 s of the flight: ' + fmtAlt(Math.max(0, s.targetAglMinM), units)));
    const r = this.pkFor(s);
    if (r) left.appendChild(h('div', 'fine', 'Pk from history: ' + Math.round(r.pk * 100) + '% (' + r.n + ' similar shots from ' + r.pool + ', 90% range ' + Math.round(r.lo * 100) + '–' + Math.round(r.hi * 100) + '%)'));
    const right = h('div'); right.appendChild(h('h4', '', 'After the launch'));
    const kv = h('div', 'kv2');
    const add = (k: string, v: string) => { kv.append(h('span', '', k), h('b', '', v)); };
    add('Lock held (until the missile went active)', pct(s.supportShare));
    add('Most you turned away from the target (crank)', s.maxOffAngleDeg != null ? s.maxOffAngleDeg + '°' : '—');
    add('Your distance to the target when the missile went active', s.distAtActiveM != null ? fmtDist(s.distAtActiveM, units) : '—');
    add('Your distance to the target when the missile arrived', s.distAtEndM != null ? fmtDist(s.distAtEndM, units) : '—');
    add('You turned away (cold)', s.shooterTurnedColdT != null ? '+' + ((s.shooterTurnedColdT - s.t) / 1000).toFixed(0) + ' s after launch' : 'no');
    add('Missile speed at the end', s.endSpeedMs != null ? fmtSpeed(s.endSpeedMs, units) : '—');
    add('Closest pass', s.missDistanceM != null ? Math.round(s.missDistanceM) + ' m' : '—');
    right.appendChild(kv);
    cols.append(left, right); d.appendChild(cols);
    d.appendChild(h('h4', '', 'Missile energy'));
    this.energyChart(d, s);
    const btns = h('div', 'btnRow');
    btns.append(this.watchBtn('Watch the launch', s.t - 3000, s.missile), this.watchBtn('Watch the end', (s.tClosest || this.unit(s.missile)?.tEnd || s.t) - 6000, s.missile));
    d.appendChild(btns);
  }

  // missile speed, target speed and closing speed over the flight
  energyChart(host: HTMLElement, s: any) {
    if (!this.host.ses()) return;
    const m = this.unit(s.missile), T = s.target >= 0 ? this.unit(s.target) : null;
    if (!m || m.n < 3) { host.appendChild(h('div', 'muted', 'No track for this missile.')); return; }
    const units = this.host.settings.units;
    const conv = (v: number) => units === 'aviation' ? v * 1.94384 : v * 3.6;
    const ms: number[][] = [], ts: number[][] = [], cl: number[][] = [];
    let stopped = NaN;
    const step = Math.max(1, Math.floor(m.n / 200));
    const posAt = (u: Unit, t: number) => { const i = idxAt(u, t); return [u.x[i], u.y[i], u.z[i]]; };
    for (let i = 0; i < m.n; i += step) {
      const t = m.t[i], x = (t - m.tStart) / 1000;
      const a = Math.max(0, i - 3), z = Math.min(m.n - 1, i + 3), dt = (m.t[z] - m.t[a]) / 1000;
      const sp = m.speed ? m.speed[i] : (dt > 0 ? Math.hypot(m.x[z] - m.x[a], m.y[z] - m.y[a], m.z[z] - m.z[a]) / dt : NaN);
      ms.push([x, conv(sp)]);
      if (T && t >= T.tStart && t <= T.tEnd && dt > 0) {
        const j = idxAt(T, t); ts.push([x, conv(T.speed ? T.speed[j] : NaN)]);
        const pa = posAt(T, m.t[a]), pz = posAt(T, m.t[z]);
        const d0 = Math.hypot(pa[0] - m.x[a], pa[1] - m.y[a], pa[2] - m.z[a]), d1 = Math.hypot(pz[0] - m.x[z], pz[1] - m.y[z], pz[2] - m.z[z]);
        const c = (d0 - d1) / dt; cl.push([x, conv(c)]);
        if (c < 0 && isNaN(stopped) && x > 3) stopped = x;
      }
    }
    const markers: any[] = [];
    if (s.activeT != null) markers.push({ x: (s.activeT - m.tStart) / 1000, label: 'seeker active', color: PAL.ink2 });
    if (!isNaN(stopped)) markers.push({ x: stopped, label: 'stopped closing', color: PAL.orange });
    chart(host, {
      x0: 0, x1: (m.tEnd - m.tStart) / 1000, height: 140, zeroLine: true, markers,
      series: [{ name: 'Missile speed', color: PAL.blue, pts: ms }, { name: 'Target speed', color: PAL.ink3, pts: ts, dashed: true }, { name: 'Closing speed', color: PAL.aqua, pts: cl }],
      xFmt: v => v.toFixed(0) + ' s', yFmt: v => Math.round(v) + (units === 'aviation' ? ' kt' : ' km/h'),
    });
  }

  // ---------------- shots at me ----------------
  private incoming(b: HTMLElement, p: any) {
    const list = p.incoming || [];
    if (!list.length) { b.appendChild(h('div', 'muted', 'No missiles were identified as fired at this player.')); return; }
    b.appendChild(h('p', 'fine', 'Reaction = first turn of more than 30°, dive of more than 600 m or countermeasure after the launch. Notch = your speed toward or away from the radar inside ±20 m/s (game radars filter a 40 m/s band of ground-clutter speeds) while the radar looks down at you.'));
    const tbl = h('div', 'tbl inc');
    const head = h('div', 'tr th');
    for (const c of ['Time', 'Missile', 'From', 'Range / aspect', 'Reaction', 'Notch held', 'Chaff / flares', 'Grade', 'Result']) head.appendChild(h('div', '', c));
    tbl.appendChild(head);
    const units = this.host.settings.units;
    for (const s of list) {
      const row = h('div', 'tr click');
      row.appendChild(h('div', 'num', this.clock(s.t)));
      row.appendChild(h('div', '', s.model + (s.guidance ? ' (' + s.guidance + ')' : '')));
      row.appendChild(h('div', '', s.shooter >= 0 ? this.title(s.shooter) : '?'));
      row.appendChild(h('div', 'num', (s.rangeM != null ? fmtDist(s.rangeM, units) : '—') + (s.aspectDeg != null ? ' · ' + s.aspectDeg + '°' : '')));
      row.appendChild(h('div', 'num', s.reactionS != null ? s.reactionS.toFixed(1) + ' s (' + s.reactionKind + ')' : 'none'));
      row.appendChild(h('div', 'num', s.notchApplies ? pct(s.notchShare) : 'n/a (IR)'));
      const ch = (s.cms || []).filter((c: any) => c.type === 'chaff').length, fl = (s.cms || []).length - ch;
      row.appendChild(h('div', 'num', ch + ' / ' + fl + (s.chaffInNotch ? ' · ' + s.chaffInNotch + ' chaff in notch' : '')));
      const gc = h('div', ''); gc.appendChild(chip(s.grade)); row.appendChild(gc);
      row.appendChild(h('div', 'res ' + (s.killedMe ? 'dead' : ''), s.killedMe ? 'Killed you' : this.outcome(s)));
      const det = h('div', 'detail'); det.hidden = true;
      row.onclick = () => { det.hidden = !det.hidden; if (!det.hidden && !det.childElementCount) this.incomingDetail(det, s); };
      tbl.append(row, det);
    }
    b.appendChild(tbl);
  }
  private incomingDetail(d: HTMLElement, s: any) {
    const cols = h('div', 'cols');
    const left = h('div'); left.appendChild(h('h4', '', 'Your defence')); this.factors(left, s.factors);
    if (s.shooterLOS === false) left.appendChild(h('div', 'fine', 'Terrain was between you and the shooter at launch.'));
    const right = h('div'); right.appendChild(h('h4', '', 'Timeline'));
    const kv = h('div', 'kv2');
    const add = (k: string, v: string) => { kv.append(h('span', '', k), h('b', '', v)); };
    add('Seeker went active', s.activeT != null ? '+' + ((s.activeT - s.t) / 1000).toFixed(1) + ' s' : '—');
    add('Seeker lost you', s.lostT != null ? '+' + ((s.lostT - s.t) / 1000).toFixed(1) + ' s' : 'no');
    add('Missile ended', '+' + ((s.tEnd - s.t) / 1000).toFixed(1) + ' s');
    add('Countermeasures', (s.cms || []).map((c: any) => c.type + ' +' + ((c.t - s.t) / 1000).toFixed(1)).join(', ') || 'none');
    right.appendChild(kv);
    cols.append(left, right); d.appendChild(cols);
    if (s.notchApplies && s.notchSeries && s.notchSeries.length) {
      d.appendChild(h('h4', '', 'Notch meter — your speed toward (−) or away from (+) the radar'));
      const down: number[][] = [], up: number[][] = [];
      for (const q of s.notchSeries) { const x = (q[0] - s.t) / 1000; down.push([x, q[2] ? q[1] : NaN]); up.push([x, q[2] ? NaN : q[1]]); }
      const markers: any[] = [];
      for (const c of s.cms || []) markers.push({ x: (c.t - s.t) / 1000, label: c.type, color: c.type === 'chaff' ? PAL.aqua : PAL.yellow });
      if (s.activeT != null) markers.push({ x: (s.activeT - s.t) / 1000, label: 'seeker active', color: PAL.ink });
      if (s.lostT != null) markers.push({ x: (s.lostT - s.t) / 1000, label: 'seeker lost you', color: PAL.aqua });
      const lim = Math.max(80, ...s.notchSeries.map((q: any) => Math.min(400, Math.abs(q[1]))));
      chart(d, {
        x0: 0, x1: (s.notchSeries[s.notchSeries.length - 1][0] - s.t) / 1000, height: 170, yMin: -lim, yMax: lim, zeroLine: true, markers,
        bands: [{ y0: -40, y1: 40, color: 'rgba(27,175,122,.10)' }, { y0: -20, y1: 20, color: 'rgba(27,175,122,.22)' }],
        series: [{ name: 'Radar looking down at you (notch possible)', color: PAL.blue, pts: down }, { name: 'Radar looking up at you (no notch)', color: PAL.ink3, pts: up, dashed: true }],
        xFmt: v => '+' + v.toFixed(0) + ' s', yFmt: v => Math.round(v) + ' m/s',
        onClick: x => this.host.seek(s.t + x * 1000),
      });
      d.appendChild(h('div', 'fine', 'Dark green band: inside the notch (±20 m/s). Light band: ±40 m/s. Click the chart to jump there in the replay.'));
    }
    const btns = h('div', 'btnRow');
    btns.append(this.watchBtn('Watch from the launch', s.t - 3000, s.missile), this.watchBtn('Watch the end', s.tEnd - 8000, s.missile));
    d.appendChild(btns);
  }

  // ---------------- deaths ----------------
  private deaths(b: HTMLElement, p: any) {
    const list = p.deaths || [];
    if (!list.length) { b.appendChild(h('div', 'muted', 'No deaths in this match.')); return; }
    const units = this.host.settings.units;
    for (const d of list) {
      const card = h('div', 'card');
      const top = h('div', 'cardHead');
      top.append(h('span', 'mt', this.clock(d.t)), h('b', '', d.crash ? 'Crashed / no recorded killer' : 'Killed by ' + (d.killerName || '?') + (d.weapon ? ' — ' + d.weapon : '')));
      top.appendChild(this.watchBtn('Watch the last 30 s', d.t - 30000, d.unit));
      if (d.missile >= 0) top.appendChild(this.watchBtn('Follow the missile', d.t - 15000, d.missile));
      card.appendChild(top);
      const tags = h('div', 'tags'); for (const t of d.tags || []) tags.appendChild(h('span', 'tag', t)); card.appendChild(tags);
      const kv = h('div', 'kv2 four');
      const add = (k: string, v: string) => { kv.append(h('span', '', k), h('b', '', v)); };
      add('Altitude', d.altM != null ? fmtAlt(d.altM, units) + (d.aglM != null ? ' (' + fmtAlt(Math.max(0, d.aglM), units) + ' above ground)' : '') : '—');
      add('Speed', d.speedMs != null ? fmtSpeed(d.speedMs, units) + ' · Mach ' + (d.mach ?? 0).toFixed(2) : '—');
      add('In the last 30 s', (d.altLost30M != null ? (d.altLost30M >= 0 ? 'lost ' : 'gained ') + fmtAlt(Math.abs(d.altLost30M), units) : '') + (d.speedLost30Ms != null ? ', ' + (d.speedLost30Ms >= 0 ? 'lost ' : 'gained ') + fmtSpeed(Math.abs(d.speedLost30Ms), units) : ''));
      add('Radar locks on you (last 30 s)', (d.lockedBy || []).join(', ') || 'none');
      add('Missiles at you (last minute)', String(d.missilesAt60 || 0));
      add('Reaction to the killing missile', d.missile >= 0 ? secs(d.reactionS) : '—');
      add('Notch held', d.missile >= 0 ? pct(d.notchShare) : '—');
      add('Nearest teammate', d.nearestTeammateKm != null && d.nearestTeammateKm >= 0 ? fmtDist(d.nearestTeammateKm * 1000, units) : 'none alive');
      add('Enemies within 20 km', String(d.enemiesWithin20));
      card.appendChild(kv);
      if (d.series && d.series.length > 2) {
        const row = h('div', 'cols');
        const a = h('div'), s2 = h('div');
        a.appendChild(h('div', 'cap', 'Altitude, last 30 s')); s2.appendChild(h('div', 'cap', 'Speed, last 30 s'));
        const x0 = (d.series[0][0] - d.t) / 1000;
        chart(a, { x0, x1: 0, height: 90, legend: false, series: [{ name: 'Altitude', color: PAL.blue, pts: d.series.map((q: any) => [(q[0] - d.t) / 1000, q[1]]) }], xFmt: v => v.toFixed(0) + ' s', yFmt: v => fmtAlt(v, units) });
        chart(s2, { x0, x1: 0, height: 90, legend: false, series: [{ name: 'Speed', color: PAL.blue, pts: d.series.map((q: any) => [(q[0] - d.t) / 1000, q[2]]) }], xFmt: v => v.toFixed(0) + ' s', yFmt: v => fmtSpeed(v, units) });
        row.append(a, s2); card.appendChild(row);
      }
      b.appendChild(card);
    }
  }

  // ---------------- engagements ----------------
  private engagements(b: HTMLElement, p: any) {
    const list = p.engagements || [];
    if (!list.length) { b.appendChild(h('div', 'muted', 'No engagements (no shots, kills or deaths against an enemy).')); return; }
    b.appendChild(h('p', 'fine', 'One row per enemy you exchanged shots with. Energy = altitude plus the height your speed is worth (h + v²/2g): more energy means more missile range and more room to defend.'));
    const units = this.host.settings.units;
    const tbl = h('div', 'tbl eng');
    const head = h('div', 'tr th');
    for (const c of ['Start', 'Enemy', 'First shot', 'Energy at first shot', 'Shots you / they', 'Result', '']) head.appendChild(h('div', '', c));
    tbl.appendChild(head);
    for (const e of list) {
      const row = h('div', 'tr');
      row.appendChild(h('div', 'num', this.clock(e.start)));
      row.appendChild(h('div', '', (e.opponentNames || []).join(', ')));
      row.appendChild(h('div', '', e.firstShotT != null ? (e.firstShotByMe ? 'You' : 'They') + ' at ' + (e.firstShotRangeM != null ? fmtDist(e.firstShotRangeM, units) : '?') : '—'));
      let en = '—';
      if (e.myEnergyM != null && e.theirEnergyM != null) {
        const diff = e.myEnergyM - e.theirEnergyM;
        en = (diff >= 0 ? '+' : '−') + fmtAlt(Math.abs(diff), units) + ' ' + (diff >= 0 ? 'more' : 'less') + ' than them';
        if (e.altDiffM != null) en += ' (alt ' + (e.altDiffM >= 0 ? '+' : '−') + fmtAlt(Math.abs(e.altDiffM), units) + ', speed ' + (e.speedDiffMs >= 0 ? '+' : '−') + fmtSpeed(Math.abs(e.speedDiffMs), units) + ')';
      }
      row.appendChild(h('div', 'num', en));
      row.appendChild(h('div', 'num', (e.myShots || []).length + ' / ' + (e.theirShots || []).length));
      row.appendChild(h('div', 'res ' + (e.result === 'won' ? 'kill' : e.result === 'lost' ? 'dead' : ''), e.result));
      const me = this.host.ses()?.playerBySlot.get(this.slot);
      let sel = -1; if (me) for (const id of me.units) { const u = this.unit(id); if (u && e.start >= u.tStart - 1000 && e.start <= u.tEnd) sel = id; }
      const w = h('div', ''); w.appendChild(this.watchBtn('Watch', (e.firstShotT ?? e.start) - 8000, sel)); row.appendChild(w);
      tbl.appendChild(row);
    }
    b.appendChild(tbl);
  }

  // ---------------- threats and position ----------------
  private position(b: HTMLElement, p: any) {
    const th = p.threat, units = this.host.settings.units;
    if (!th || !th.t || !th.t.length) { b.appendChild(h('div', 'muted', 'No flight data.')); return; }
    const t0 = this.ana.t0, X = (t: number) => (t - t0) / 60000;
    const markers: any[] = [];
    for (const k of p.kills || []) if (!k.teamKill) markers.push({ x: X(k.t), label: 'kill: ' + k.victimName, color: PAL.aqua });
    for (const d of p.deaths || []) markers.push({ x: X(d.t), label: 'death', color: PAL.orange });
    const x0 = X(th.t[0]), x1 = X(th.t[th.t.length - 1]);
    const ser = (arr: number[]) => th.t.map((t: number, i: number) => [X(t), arr[i]]);
    const mm = (v: number) => { const s = Math.max(0, v * 60); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
    b.appendChild(h('h3', '', 'Threat picture'));
    b.appendChild(h('p', 'fine', 'Enemies within 40 km, enemy radars locked on you, and missiles in the air at you. Click to jump there.'));
    chart(b, { x0, x1, height: 170, markers, series: [
      { name: 'Enemies within 40 km', color: PAL.blue, pts: ser(th.enemiesNear), step: true },
      { name: 'Radars locked on you', color: PAL.orange, pts: ser(th.radarsOnMe), step: true },
      { name: 'Missiles at you', color: PAL.aqua, pts: ser(th.missilesAtMe), step: true },
    ], xFmt: mm, yFmt: v => String(Math.round(v)), yMin: 0, onClick: x => this.host.seek(t0 + x * 60000) });
    if (this.ana.terrain) {
      b.appendChild(h('h3', '', 'Terrain masking'));
      b.appendChild(h('p', 'fine', 'Enemies within 60 km that could see you over the terrain, against all enemies within 40 km.' + (p.maskedShare != null ? ' Hidden from every nearby enemy ' + pct(p.maskedShare) + ' of the time they were near.' : '')));
      chart(b, { x0, x1, height: 120, markers, series: [
        { name: 'Enemies within 40 km', color: PAL.blue, pts: ser(th.enemiesNear), step: true },
        { name: 'Enemies with line of sight (60 km)', color: PAL.orange, pts: ser(th.enemiesLOS), step: true },
      ], xFmt: mm, yMin: 0, onClick: x => this.host.seek(t0 + x * 60000) });
    }
    b.appendChild(h('h3', '', 'Altitude and energy'));
    const lobby = [0, 0, 0, 0, 0]; let lobbyTotal = 0;
    for (const q of this.ana.players) for (let i = 0; i < 5; i++) { lobby[i] += q.bands.timeS[i]; lobbyTotal += q.bands.timeS[i]; }
    const mine = p.bands.timeS, myTotal = mine.reduce((a: number, v: number) => a + v, 0) || 1;
    const edges = p.bands.edgesM, labels = edges.map((e: number, i: number) => i < 4 ? fmtAlt(e, units) + '–' + fmtAlt(edges[i + 1], units) : 'above ' + fmtAlt(e, units));
    const rows: any[] = [];
    for (let i = 4; i >= 0; i--) {
      const share = mine[i] / myTotal, ls = lobbyTotal ? lobby[i] / lobbyTotal : 0;
      rows.push({ label: labels[i], value: share, compare: ls, text: pct(share) + ' (lobby ' + pct(ls) + ') · ' + p.bands.shots[i] + ' shots · ' + p.bands.kills[i] + ' kills · ' + p.bands.deaths[i] + ' deaths' });
    }
    bars(b, rows, 1);
    b.appendChild(h('div', 'fine', 'Bar: your share of flight time at that altitude. Tick: the whole lobby\'s share.'));
    chart(b, { x0, x1, height: 120, markers, legend: false, series: [{ name: 'Altitude', color: PAL.blue, pts: ser(th.altM) }], xFmt: mm, yFmt: v => fmtAlt(v, units), yMin: 0, onClick: x => this.host.seek(t0 + x * 60000) });
    b.appendChild(h('h3', '', 'Teammates'));
    b.appendChild(h('p', 'fine', 'Distance to the nearest teammate and the nearest enemy. Flying alone (no teammate within 20 km): ' + pct(p.aloneShare) + ' of the time.' +
      ((p.kills || []).length ? ' At your kills the nearest teammate was ' + p.kills.filter((k: any) => !k.teamKill).map((k: any) => k.nearestTeammateKm != null && k.nearestTeammateKm >= 0 ? k.nearestTeammateKm.toFixed(1) + ' km' : 'none').join(', ') + ' away.' : '') +
      ((p.deaths || []).length ? ' At your deaths: ' + p.deaths.map((d: any) => d.nearestTeammateKm != null && d.nearestTeammateKm >= 0 ? d.nearestTeammateKm.toFixed(1) + ' km' : 'none').join(', ') + '.' : '')));
    const nz = (arr: number[]) => arr.map(v => v < 0 ? NaN : v);
    chart(b, { x0, x1, height: 130, markers, bands: [{ y0: 0, y1: 20, color: 'rgba(42,120,214,.08)' }], series: [
      { name: 'Nearest teammate (km)', color: PAL.blue, pts: ser(nz(th.nearestTeammateKm)) },
      { name: 'Nearest enemy (km)', color: PAL.orange, pts: ser(nz(th.nearestEnemyKm)) },
    ], xFmt: mm, yFmt: v => v.toFixed(0) + ' km', yMin: 0, onClick: x => this.host.seek(t0 + x * 60000) });
  }
}
