import { loadSession, Session, Unit, Player, GameEvent, sampleAt, radarAt, lerpCol, idxAt, fmtClock, Sample, outcomeText } from './data';
import { Viewer, Settings, COLORS, fmtAlt, fmtSpeed, fmtDist } from './scene';
import { Debrief } from './debrief';
import { Library } from './library';
import { loadWeapons } from './envelope';

const $ = (id: string) => document.getElementById(id)!;
function el(tag: string, cls = '', text = ''): HTMLElement { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

const DEFAULTS: Settings = {
  me: 'spurzz', units: 'metric', labels: 'all', lblName: true, lblType: true, lblAlt: true, lblSpeed: false, missileLabels: true,
  acTrail: 30, msTrail: -1, missiles: true, cms: true, bombs: true, ground: true, ai: true, dead: false, sticks: true,
  radar: 'focus', desig: 'focus', seeker: true, msKeep: 'focus', view: '3d', scanZone: true, airfields: true, areas: false, trailStyle: 'ribbon', lineWidth: 2, vector: false, dlz: true, shade: true, grid: true,
};
const settings: Settings = Object.assign({}, DEFAULTS);
try { Object.assign(settings, JSON.parse(localStorage.getItem('wtrv.settings') || '{}')); } catch (e) { /* first run */ }
const save = () => { try { localStorage.setItem('wtrv.settings', JSON.stringify(settings)); } catch (e) { /* ignore */ } };

const viewer = new Viewer($('canvasHost'), $('labels'), settings);
let ses: Session | null = null;
let t = 0, playing = false, speed = 1, lastFrame = performance.now();
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64];
const tmp: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, i: 0, f: 0 };
const tmp2: Sample = { x: 0, y: 0, z: 0, heading: 0, pitch: 0, roll: 0, i: 0, f: 0 };

// ---------- helpers ----------
function playerOf(u: Unit): Player | null { return ses && u.owner >= 0 ? ses.playerBySlot.get(u.owner) || null : null; }
function unitTitle(u: Unit): string {
  const p = u.kind === 'aircraft' ? playerOf(u) : null;
  return p ? p.name : (u.ai ? u.name + ' (AI)' : u.name);
}
// the aircraft a player is flying at time tt (or the nearest one in time)
function unitOfPlayer(p: Player, tt: number): Unit | null {
  if (!ses || !p.units.length) return null;
  let best: Unit | null = null, bd = Infinity;
  for (const id of p.units) {
    const u = ses.units[id]; if (!u) continue;
    const d = tt < u.tStart ? u.tStart - tt : tt > u.tEnd ? tt - u.tEnd : 0;
    if (d < bd) { bd = d; best = u; }
  }
  return best;
}
function weaponName(e: GameEvent): string {
  if (e.missile !== undefined && ses!.units[e.missile]) return ses!.units[e.missile].name;
  const w = String(e.weapon || ''); if (!w) return '';
  return w.replace(/^[a-z]{2,3}_/, '').replace(/_/g, ' ').toUpperCase();
}

// ---------- session list ----------
// ---------- add a match by session ID ----------
function bindFetch() {
  const box = $('fetchBox'), inp = $('fetchId') as HTMLInputElement, msg = $('fetchMsg'), go = $('fetchGo') as HTMLButtonElement;
  let busy = false;
  const say = (m: string, err = false) => { msg.textContent = m; msg.classList.toggle('err', err); };
  $('btnFetch').onclick = () => { box.hidden = false; if (!busy) say(''); inp.focus(); inp.select(); };
  $('fetchClose').onclick = () => { box.hidden = true; };
  inp.onkeydown = (e) => { if (e.key === 'Enter') go.click(); if (e.key === 'Escape') box.hidden = true; };
  go.onclick = async () => {
    if (busy) return;
    const raw = inp.value.trim(); if (!raw) { say('Paste a session ID first.', true); return; }
    let st: any;
    try {
      const r = await fetch('/api/fetch?id=' + encodeURIComponent(raw), { method: 'POST' });
      if (!r.ok) { say(await r.text(), true); return; }
      st = await r.json();
    } catch (e) { say('Could not reach the viewer program.', true); return; }
    busy = true; go.disabled = true;
    const id = st.id;
    for (;;) {
      const mb = (st.bytes / 1e6).toFixed(1);
      if (st.state === 'downloading') say(`Session ${id}: downloading… ${st.pieces} pieces, ${mb} MB`);
      else if (st.state === 'converting') say(`Session ${id}: ${st.pieces} pieces, ${mb} MB downloaded. Converting…`);
      else if (st.state === 'done') { say(`Session ${id}: ready. Opening it…`); break; }
      else { say(`Session ${id}: failed.\n${st.message || ''}`, true); busy = false; go.disabled = false; return; }
      await new Promise(res => setTimeout(res, 700));
      try { st = await (await fetch('/api/fetch/' + id)).json(); } catch (e) { /* keep polling */ }
    }
    busy = false; go.disabled = false;
    location.href = location.pathname + '?s=' + encodeURIComponent(id);
  };
}

async function boot() {
  bindDisplay(); bindTop(); bindBar(); bindTabs(); bindFetch(); loadWeapons();
  let list: any;
  try { list = await (await fetch('/api/sessions')).json(); } catch (e) { loading('Could not reach the viewer program.\nIs wtviewer still running?'); return; }
  const sel = $('session') as HTMLSelectElement;
  if (!list.sessions.length) {
    loading('No converted matches found in\n' + list.sessionsFolder + '\n\nUse “+ Add match” at the top to download one by session ID,\nor drag a downloaded replay zip onto tools\\convert.bat.');
    return;
  }
  for (const s of list.sessions) {
    const o = document.createElement('option'); o.value = s.id;
    const when = s.startTimeUtc ? new Date(s.startTimeUtc).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    o.textContent = prettyLevel(s.level) + ' — ' + when + (s.terrain ? '' : ' (no terrain)');
    sel.appendChild(o);
  }
  const want = new URLSearchParams(location.search).get('s');
  if (want && list.sessions.some((s: any) => s.id === want)) sel.value = want;
  sel.onchange = () => open(sel.value);
  await open(sel.value);
  requestAnimationFrame(frame);
}
function prettyLevel(l: string): string { return (l || '').replace(/^(air|avg)_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function loading(msg: string | null) { $('loading').style.display = msg === null ? 'none' : 'flex'; if (msg !== null) $('loadingText').textContent = msg; }

async function open(id: string) {
  playing = false; setPlayIcon();
  loading('Loading…');
  try {
    ses = await loadSession(id, loading);
  } catch (e: any) { loading('Could not open this match.\n' + (e && e.message || e)); return; }
  viewer.setSession(ses);
  debrief.invalidate();
  if (!$('debrief').hidden) debrief.open();
  viewer.onSelect = (uid, shift) => select(uid, shift);
  viewer.onHover = (uid, x, y) => {
    const tip = $('tip');
    if (uid < 0 || !ses) { tip.hidden = true; return; }
    const u = ses.units[uid]; sampleAt(u, Math.min(Math.max(t, u.tStart), u.tEnd), tmp2);
    const sp = u.speed ? lerpCol(u.speed, tmp2, u.n) : speedOf(u, t);
    tip.textContent = (u.kind === 'aircraft' ? unitTitle(u) + ' · ' + u.name : u.name + (u.parent >= 0 && ses.units[u.parent] ? ' from ' + unitTitle(ses.units[u.parent]) : '')) +
      '\n' + fmtAlt(tmp2.y, settings.units) + ' · ' + fmtSpeed(sp, settings.units);
    tip.style.transform = `translate(${Math.round(x + 14)}px, ${Math.round(y + 14)}px)`; tip.hidden = false;
  };
  const me = viewer.meSlot >= 0 ? ses.playerBySlot.get(viewer.meSlot)! : null;
  if (me) me.highlight = true;
  viewer.restyle();
  t = ses.t0;
  const m = ses.manifest.match;
  $('matchInfo').textContent = prettyLevel(ses.levelName) + ' · ' + fmtClock(ses.t1 - ses.t0) + ' · ' + ses.players.length + ' players' + (ses.terrain ? '' : ' · no terrain file for this map');
  $('dur').textContent = fmtClock(ses.t1 - ses.t0);
  buildPlayers(); buildEvents(); drawStrip(); renderSelected(true);
  setMode(settings.view === '2d' ? '2d' : '3d');
  loading(null);
}

// ---------- players panel ----------
function buildPlayers() {
  const host = $('players'); host.innerHTML = '';
  if (!ses) return;
  const teams = [...new Set(ses.players.map(p => p.team))].sort((a, b) => (a === viewer.myTeam ? -1 : b === viewer.myTeam ? 1 : a - b));
  for (const team of teams) {
    const list = ses.players.filter(p => p.team === team).sort((a, b) => (b.results.score || 0) - (a.results.score || 0));
    const head = el('div', 'team');
    const sw = el('i'); const anyU = list[0] && ses.units[list[0].units[0]];
    const teamColor = anyU ? (anyU.team === (viewer.myTeam || 1) ? COLORS.friend : COLORS.enemy) : COLORS.neutral;
    sw.style.background = hex(teamColor); head.appendChild(sw);
    head.appendChild(el('span', '', (viewer.myTeam ? (team === viewer.myTeam ? 'My team' : 'Enemy team') : 'Team ' + team) + ' · ' + list.length));
    const tb = el('button', '', list.every(p => p.hidden) ? 'Show' : 'Hide') as HTMLButtonElement;
    tb.onclick = () => { const hide = !list.every(p => p.hidden); for (const p of list) p.hidden = hide; viewer.restyle(); buildPlayers(); };
    head.appendChild(tb); host.appendChild(head);
    for (const p of list) {
      const row = el('div', 'pl' + (p.slot === viewer.meSlot ? ' me' : '') + (p.hidden ? ' hidden' : ''));
      row.dataset.slot = String(p.slot);
      const eye = el('button', 'ic' + (p.hidden ? '' : ' on'), p.hidden ? '○' : '●') as HTMLButtonElement; eye.title = p.hidden ? 'Show this player' : 'Hide this player';
      eye.onclick = e => { e.stopPropagation(); p.hidden = !p.hidden; viewer.restyle(); buildPlayers(); };
      const star = el('button', 'ic star' + (p.highlight ? ' on' : ''), p.highlight ? '★' : '☆') as HTMLButtonElement; star.title = 'Highlight this player';
      star.onclick = e => { e.stopPropagation(); p.highlight = !p.highlight; viewer.restyle(); buildPlayers(); };
      const mid = el('div');
      mid.appendChild(el('div', 'nm', p.name));
      const u0 = ses.units[p.units[0]];
      mid.appendChild(el('div', 'ac', u0 ? u0.name : 'did not fly'));
      const r = p.results;
      const kd = el('div', 'kd', (r.kills || 0) + ' / ' + (r.deaths || 0)); kd.title = 'Air kills / deaths';
      row.append(eye, star, mid, kd);
      row.onclick = () => { const u = unitOfPlayer(p, t); if (u) select(u.id, false); };
      row.ondblclick = () => { const u = unitOfPlayer(p, t); if (u) { select(u.id, false); viewer.setFollow(u.id); syncFollowBtn(); } };
      host.appendChild(row);
    }
  }
  markPlayers();
}
function markPlayers() {
  if (!ses) return;
  const selU = viewer.selected >= 0 ? ses.units[viewer.selected] : null;
  for (const row of Array.from($('players').querySelectorAll('.pl')) as HTMLElement[]) {
    const p = ses.playerBySlot.get(Number(row.dataset.slot))!;
    const last = p.units.length ? ses.units[p.units[p.units.length - 1]] : null;
    row.classList.toggle('down', !!last && last.destroyed && t > last.tEnd);
    row.classList.toggle('sel', !!selU && selU.owner === p.slot);
  }
}
function involvedWithMe(): Set<number> {
  const out = new Set<number>(); if (!ses || viewer.meSlot < 0) return out;
  const me = viewer.meSlot; out.add(me);
  const mine = new Set(ses.playerBySlot.get(me)!.units);
  const add = (uid: number | undefined) => { if (uid === undefined) return; const u = ses!.units[uid]; if (u && u.owner >= 0) out.add(u.owner); };
  for (const e of ses.events) {
    if (e.type === 'kill') {
      const vOwner = e.victim !== undefined && ses.units[e.victim] ? ses.units[e.victim].owner : -1;
      if (e.killerPlayer === me) add(e.victim);
      if (vOwner === me) { if (e.killerPlayer !== undefined) out.add(e.killerPlayer); add(e.killer); }
    } else if (e.type === 'message' && e.units && e.units.some((id: number) => mine.has(id))) for (const id of e.units) add(id);
  }
  for (const u of ses.units) {
    if (!u.radar) continue;
    const isMine = mine.has(u.id);
    for (const r of u.radar) for (const id of r.targets) { if (isMine) add(id); else if (mine.has(id)) out.add(u.owner); }
  }
  out.delete(-1);
  return out;
}

// ---------- selection ----------
function select(uid: number, shift: boolean) {
  if (!ses) return;
  if (shift && viewer.selected >= 0 && uid !== viewer.selected) viewer.measure = uid;
  else { viewer.selected = uid; if (viewer.measure === uid) viewer.measure = -1; }
  viewer.restyle(); markPlayers(); showTab('selected'); renderSelected(true); drawStrip();
}
function clearSelection() { viewer.selected = -1; viewer.measure = -1; viewer.setFollow(-1); viewer.restyle(); markPlayers(); renderSelected(true); syncFollowBtn(); drawStrip(); }
function syncFollowBtn() { renderSelected(true); $('btnFollow').classList.toggle('on', viewer.follow >= 0); $('btnFollow').textContent = viewer.follow >= 0 ? 'Following' : 'Follow'; }

let selBuiltFor = -2;
function renderSelected(rebuild: boolean) {
  const body = $('selBody');
  if (!ses || viewer.selected < 0) { if (selBuiltFor !== -1) { body.className = 'muted'; body.textContent = 'Click an aircraft or a missile.'; selBuiltFor = -1; } return; }
  const u = ses.units[viewer.selected];
  if (rebuild || selBuiltFor !== u.id) {
    selBuiltFor = u.id; body.className = ''; body.innerHTML = '';
    const p = playerOf(u);
    body.appendChild(el('div', 'selName', u.kind === 'aircraft' ? unitTitle(u) : u.name));
    let sub = '';
    if (u.kind === 'aircraft') sub = u.name + (p && p.clan ? ' · ' + p.clan : '');
    else if (u.kind === 'missile') { const par = u.parent >= 0 ? ses.units[u.parent] : null; sub = (u.missile && u.missile.guidance ? guidanceText(u.missile.guidance) + ' · ' : '') + (par ? 'launched by ' + unitTitle(par) : ''); }
    body.appendChild(el('div', 'selSub', sub));
    const btns = el('div', 'btnRow');
    const bf = el('button', viewer.follow === u.id ? 'on' : '', viewer.follow === u.id ? 'Following' : 'Follow') as HTMLButtonElement; bf.onclick = () => { viewer.setFollow(viewer.follow === u.id ? -1 : u.id); syncFollowBtn(); };
    btns.appendChild(bf);
    if (u.kind === 'missile' && u.parent >= 0) { const b = el('button', '', 'Select launcher') as HTMLButtonElement; b.onclick = () => select(u.parent, false); btns.appendChild(b); }
    const bs = el('button', '', 'Go to start') as HTMLButtonElement; bs.onclick = () => seek(u.tStart); btns.appendChild(bs);
    const bc = el('button', '', 'Clear') as HTMLButtonElement; bc.onclick = clearSelection; btns.appendChild(bc);
    body.appendChild(btns);
    const kv = el('div', 'kv'); kv.id = 'selKV'; body.appendChild(kv);
    if (u.kind === 'missile') {
      const l = ses.launchByMissile.get(u.id);
      body.appendChild(el('div', 'cap', 'Missile energy'));
      const act = u.seekerMode ? Array.from(u.seekerMode).indexOf(2) : -1;
      debrief.energyChart(body, { missile: u.id, target: l && l.target !== undefined ? l.target : -1, activeT: act >= 0 ? u.t[act] : null });
    }
    if (u.kind === 'aircraft' || u.kind === 'missile') {
      for (const [key, cap] of [['alt', 'Altitude'], ['spd', 'Speed']] as const) {
        const c = el('div', 'chart'); const capEl = el('div', 'cap'); capEl.append(el('span', '', cap), el('span', '', '')); capEl.id = 'cap-' + key;
        const cv = document.createElement('canvas'); cv.id = 'chart-' + key;
        cv.onclick = ev => { const r = cv.getBoundingClientRect(); seek(u.tStart + (u.tEnd - u.tStart) * (ev.clientX - r.left) / r.width); };
        c.append(capEl, cv); body.appendChild(c);
      }
    }
  }
  // live values
  const kv = $('selKV'); kv.innerHTML = '';
  const add = (k: string, v: string, wide = false) => { const d = el('div', wide ? 'wide' : ''); d.append(el('span', '', k), el('b', '', v)); kv.appendChild(d); };
  const alive = t >= u.tStart && t <= u.tEnd;
  if (!alive) add('Status', t < u.tStart ? 'Not yet in the match (starts ' + fmtClock(u.tStart - ses.t0) + ')' : (u.destroyed ? 'Destroyed at ' : 'Ended at ') + fmtClock(u.tEnd - ses.t0), true);
  const tt = Math.min(Math.max(t, u.tStart), u.tEnd);
  sampleAt(u, tt, tmp);
  const spd = u.speed ? lerpCol(u.speed, tmp, u.n) : speedOf(u, tt);
  const mach = u.mach ? lerpCol(u.mach, tmp, u.n) : NaN, agl = u.agl ? lerpCol(u.agl, tmp, u.n) : NaN;
  add('Altitude', fmtAlt(tmp.y, settings.units) + (isFinite(agl) ? ' (' + fmtAlt(Math.max(0, agl), settings.units) + ' above ground)' : ''), isFinite(agl));
  add('Speed', fmtSpeed(spd, settings.units)); if (isFinite(mach)) add('Mach', mach.toFixed(2));
  if (u.kind === 'aircraft') {
    add('Heading', String(Math.round((tmp.heading + 360) % 360)).padStart(3, '0') + '°'); add('G (estimated)', lerpCol(u.g, tmp, u.n).toFixed(1));
    add('Pitch', tmp.pitch.toFixed(0) + '°'); add('Roll', tmp.roll.toFixed(0) + '°');
    const r = radarAt(u, tt);
    if (r) {
      add('Radar', (r.sensor || 'Radar') + ' — ' + (r.on ? (r.label || r.state) : 'off'), true);
      if (r.targets.length) add('Locked on', r.targets.map(id => ses!.units[id] ? unitTitle(ses!.units[id]) : '?').join(', '), true);
    }
    const lockedBy: string[] = [];
    for (const o of ses.units) { if (o.kind !== 'aircraft' || !o.radar || o.id === u.id) continue; const rr = radarAt(o, tt); if (rr && rr.targets.includes(u.id) && tt >= o.tStart && tt <= o.tEnd) lockedBy.push(unitTitle(o)); }
    if (lockedBy.length) add('Locked by', lockedBy.join(', '), true);
    const ps = u.owner >= 0 ? ses.stats.get(u.owner) : null;
    if (ps) {
      add('Flight time (match)', fmtClock(ps.flightTimeS * 1000)); add('Distance flown', fmtDist(ps.distanceKm * 1000, settings.units));
      add('Highest G', ps.maxG.toFixed(1)); add('Top speed', 'Mach ' + ps.maxMach.toFixed(2));
      add('Missiles fired / kills', ps.missilesFired + ' / ' + ps.missileKills); add('Missiles fired at them', String(ps.missilesFiredAtPlayer));
    }
  } else if (u.kind === 'missile') {
    const i = idxAt(u, tt); const sm = u.seekerMode ? u.seekerMode[i] : 0;
    add('Seeker', sm === 2 ? 'Tracking' : sm === 1 ? 'Searching' : '—'); add('Flight time', ((tt - u.tStart) / 1000).toFixed(1) + ' s');
    const spec = u.missile && u.missile.spec;
    if (spec && spec.maxG) { add('Missile limit', spec.maxG + ' G'); add('Top speed (game data)', 'Mach ' + spec.machMax); }
    const l = ses.launchByMissile.get(u.id);
    if (l) {
      if (l.target !== undefined && ses.units[l.target]) add('Fired at', unitTitle(ses.units[l.target]) + ' (' + ses.units[l.target].name + ')', true);
      if (l.rangeM !== undefined) { add('Launch range', fmtDist(l.rangeM, settings.units)); add('Target aspect', l.aspectDeg === undefined ? '—' : l.aspectDeg + '° ' + (l.aspectDeg < 60 ? '(head-on)' : l.aspectDeg > 120 ? '(tail)' : '(beam)')); }
      if (l.closureMs !== undefined) { add('Closure at launch', fmtSpeed(l.closureMs, settings.units)); add('Off the nose', l.offBoresightDeg + '°'); }
      add(l.outcome === 'kill' ? 'Result' : 'Result (estimate, ' + l.confidence + ' confidence)', outcomeText(l), true);
    } else {
      const hit = ses.kills.find(e => e.missile === u.id);
      add('Result', hit ? 'Kill' : 'No kill recorded', true);
    }
  }
  drawChart('alt', u, (i) => u.y[i], v => fmtAlt(v, settings.units));
  drawChart('spd', u, (i) => speedIdx(u, i), v => fmtSpeed(v, settings.units));
}
function guidanceText(g: string): string { return ({ ARH: 'Active radar', SARH: 'Semi-active radar', IR: 'Infrared' } as any)[g] || g; }
function speedIdx(u: Unit, i: number): number {
  if (u.speed) return u.speed[i];
  const a = Math.max(0, i - 2), b = Math.min(u.n - 1, i + 2); const dt = (u.t[b] - u.t[a]) / 1000;
  return dt > 0 ? Math.hypot(u.x[b] - u.x[a], u.y[b] - u.y[a], u.z[b] - u.z[a]) / dt : 0;
}
function speedOf(u: Unit, tt: number): number { return speedIdx(u, idxAt(u, tt)); }

function drawChart(key: string, u: Unit, val: (i: number) => number, fmt: (v: number) => string) {
  const cv = document.getElementById('chart-' + key) as HTMLCanvasElement | null; if (!cv) return;
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const x = cv.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  let lo = Infinity, hi = -Infinity; const step = Math.max(1, Math.floor(u.n / w));
  for (let i = 0; i < u.n; i += step) { const v = val(i); if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(lo)) return; if (hi - lo < 1) hi = lo + 1;
  const X = (tt: number) => (tt - u.tStart) / Math.max(1, u.tEnd - u.tStart) * w, Y = (v: number) => h - 5 - (v - lo) / (hi - lo) * (h - 10);
  x.strokeStyle = '#4da3ff'; x.lineWidth = 2; x.lineJoin = 'round'; x.beginPath();
  for (let i = 0; i < u.n; i += step) { const px = X(u.t[i]), py = Y(val(i)); if (i === 0) x.moveTo(px, py); else x.lineTo(px, py); }
  x.stroke();
  const tt = Math.min(Math.max(t, u.tStart), u.tEnd), i = idxAt(u, tt);
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(tt), 0); x.lineTo(X(tt), h); x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(X(tt), Y(val(i)), 3, 0, 7); x.fill();
  const cap = document.getElementById('cap-' + key); if (cap) (cap.lastChild as HTMLElement).textContent = fmt(lo) + ' – ' + fmt(hi);
}

// ---------- measure ----------
function renderMeasure() {
  const box = $('measure');
  if (!ses || viewer.selected < 0 || viewer.measure < 0) { box.hidden = true; return; }
  const a = ses.units[viewer.selected], b = ses.units[viewer.measure];
  if (t < a.tStart || t > a.tEnd || t < b.tStart || t > b.tEnd) { box.hidden = true; return; }
  const range = (tt: number) => { sampleAt(a, tt, tmp); sampleAt(b, tt, tmp2); return Math.hypot(tmp.x - tmp2.x, tmp.y - tmp2.y, tmp.z - tmp2.z); };
  const r0 = range(Math.max(a.tStart, b.tStart, t - 250)), r1 = range(t);
  const brg = (Math.atan2(tmp2.x - tmp.x, tmp2.z - tmp.z) * 180 / Math.PI + 360) % 360;
  const closure = (r0 - r1) / Math.max(0.05, Math.min(250, t - Math.max(a.tStart, b.tStart)) / 1000);
  const dAlt = tmp2.y - tmp.y;
  box.hidden = false; box.innerHTML = '';
  box.append(el('b', '', unitTitle(a)), document.createTextNode(' → '), el('b', '', unitTitle(b)),
    document.createTextNode('   range ' + fmtDist(r1, settings.units) + ' · bearing ' + String(Math.round(brg)).padStart(3, '0') + '° · ' + (dAlt >= 0 ? '+' : '−') + fmtAlt(Math.abs(dAlt), settings.units) + ' · closing ' + fmtSpeed(closure, settings.units)));
  const dz = viewer.dlzInfo;
  if (dz && dz.rmax > 0) {
    const where = dz.range <= dz.rne ? 'inside no-escape range' : dz.range <= dz.rmax ? 'inside max range only' : 'out of range';
    box.appendChild(el('div', 'dlz', dz.missile + ': max ' + fmtDist(dz.rmax, settings.units) + ' · no-escape ' + fmtDist(dz.rne, settings.units) + ' — ' + where + ' (estimate)'));
  }
  const x = el('button', '', '×') as HTMLButtonElement; x.onclick = () => { viewer.measure = -1; viewer.restyle(); }; box.appendChild(x);
}

// ---------- events ----------
function buildShots(host: HTMLElement, onlyMine: boolean) {
  const me = viewer.meSlot; let n = 0;
  for (const l of ses!.launches) {
    const mU = ses!.units[l.missile]; if (!mU) continue;
    const mine = me >= 0 && l.shooterPlayer === me, atMe = me >= 0 && l.targetPlayer === me;
    if (onlyMine && !mine && !atMe) continue;
    const row = el('div', 'ev' + (mine ? ' mine' : atMe ? ' lost' : ''));
    row.appendChild(el('div', 'tm', fmtClock(l.t - ses!.t0)));
    const mid = el('div');
    const sh = l.shooter !== undefined && ses!.units[l.shooter] ? unitTitle(ses!.units[l.shooter]) : '?';
    const tg = l.target !== undefined && ses!.units[l.target] ? unitTitle(ses!.units[l.target]) : '?';
    mid.appendChild(el('div', '', sh + ' → ' + tg));
    mid.appendChild(el('div', 'wp', l.model + (l.rangeM !== undefined ? ' · ' + fmtDist(l.rangeM, settings.units) : '') + ' · ' + outcomeText(l)));
    row.appendChild(mid);
    row.onclick = () => { seek(l.t - 2000); select(l.missile, false); };
    host.appendChild(row); n++;
  }
  if (!n) host.appendChild(el('div', 'muted', ses!.launches.length ? 'No missile shots to show.' : 'This match was converted before shot records existed. Convert it again to see them.'));
}
function buildEvents() {
  const host = $('events'); host.innerHTML = ''; if (!ses) return;
  const onlyMine = ($('evMine') as HTMLInputElement).checked; const me = viewer.meSlot;
  if (($('evKind') as HTMLSelectElement).value === 'shots') { buildShots(host, onlyMine); return; }
  let n = 0;
  for (const e of ses.kills) {
    const vU = e.victim !== undefined ? ses.units[e.victim] : null; const kU = e.killer !== undefined ? ses.units[e.killer] : null;
    if (!vU || vU.kind !== 'aircraft') continue;
    const kSlot = e.killerPlayer !== undefined ? e.killerPlayer : (kU ? kU.owner : -1);
    const mine = me >= 0 && kSlot === me, lost = me >= 0 && vU.owner === me;
    if (onlyMine && !mine && !lost) continue;
    const row = el('div', 'ev' + (mine ? ' mine' : lost ? ' lost' : ''));
    row.appendChild(el('div', 'tm', fmtClock(e.t - ses.t0)));
    const mid = el('div');
    const kName = kSlot >= 0 && ses.playerBySlot.get(kSlot) ? ses.playerBySlot.get(kSlot)!.name : (kU ? unitTitle(kU) : '');
    const line = el('div'); line.textContent = (kName ? kName + ' → ' : 'Lost: ') + unitTitle(vU);
    if (e.teamKill) line.appendChild(el('span', 'tk', '  team kill'));
    mid.appendChild(line);
    const w = weaponName(e); mid.appendChild(el('div', 'wp', (kU ? kU.name + ' · ' : '') + (w || 'crash / unknown') + ' → ' + vU.name));
    row.appendChild(mid);
    row.onclick = () => { seek(e.t - 8000); select(e.missile !== undefined ? e.missile : vU.id, false); };
    host.appendChild(row); n++;
  }
  if (!n) host.appendChild(el('div', 'muted', 'No shoot-downs to show.'));
}

// ---------- timeline ----------
function drawStrip() {
  const cv = $('strip') as HTMLCanvasElement; if (!ses) return;
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const x = cv.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  const X = (tt: number) => 6 + (tt - ses!.t0) / Math.max(1, ses!.t1 - ses!.t0) * (w - 12);
  const mid = 24;
  x.fillStyle = '#2f3948'; x.fillRect(6, mid - 2, w - 12, 4);
  if (viewer.selected >= 0) { const u = ses.units[viewer.selected]; x.fillStyle = '#5a6b8a'; x.fillRect(X(u.tStart), mid - 2, Math.max(2, X(u.tEnd) - X(u.tStart)), 4); }
  x.fillStyle = '#ffe14d'; x.fillRect(6, mid - 2, X(t) - 6, 4);
  const me = viewer.meSlot;
  for (const e of ses.kills) {
    const vU = e.victim !== undefined ? ses.units[e.victim] : null; if (!vU || vU.kind !== 'aircraft') continue;
    const mine = me >= 0 && e.killerPlayer === me, lost = me >= 0 && vU.owner === me;
    x.fillStyle = mine ? '#ffe14d' : lost ? '#ff6a3d' : '#7b8696';
    const hh = mine || lost ? 14 : 7; x.fillRect(Math.round(X(e.t)) - 1, mid - 5 - hh, 2, hh);
  }
  if (me >= 0) { x.fillStyle = '#e6eaf0'; for (const e of ses.events) if (e.type === 'launch' && ses.units[e.unit] && ses.units[e.unit].kind === 'missile' && ses.units[e.unit].owner === me) { x.beginPath(); x.arc(X(e.t), mid + 8, 2, 0, 7); x.fill(); } }
  x.fillStyle = '#fff'; x.beginPath(); x.arc(X(t), mid, 6, 0, 7); x.fill();
}
function seek(tt: number) { if (!ses) return; t = Math.min(ses.t1, Math.max(ses.t0, tt)); uiTick(true); }
function setPlayIcon() { $('play').textContent = playing ? '❚❚' : '▶'; }
function bindBar() {
  const sp = $('speed') as HTMLSelectElement;
  for (const s of SPEEDS) { const o = document.createElement('option'); o.value = String(s); o.textContent = s + '×'; sp.appendChild(o); }
  sp.value = '1'; sp.onchange = () => { speed = Number(sp.value); };
  $('play').onclick = togglePlay;
  const cv = $('strip'); let drag = false;
  const at = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); seek(ses!.t0 + (ses!.t1 - ses!.t0) * Math.min(1, Math.max(0, (e.clientX - r.left - 6) / (r.width - 12)))); };
  cv.addEventListener('pointerdown', e => { if (!ses) return; drag = true; cv.setPointerCapture(e.pointerId); at(e); });
  cv.addEventListener('pointermove', e => { if (drag && ses) at(e); });
  cv.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('resize', drawStrip);
  window.addEventListener('keydown', e => {
    const tag = (e.target as HTMLElement).tagName; if (tag === 'INPUT' || tag === 'SELECT') return;
    if (e.code === 'Space') { togglePlay(); e.preventDefault(); }
    else if (e.code === 'ArrowLeft') seek(t - (e.shiftKey ? 30000 : 5000));
    else if (e.code === 'ArrowRight') seek(t + (e.shiftKey ? 30000 : 5000));
    else if (e.key === ',' || e.key === '.') { const i = SPEEDS.indexOf(speed) + (e.key === '.' ? 1 : -1); if (i >= 0 && i < SPEEDS.length) { speed = SPEEDS[i]; sp.value = String(speed); } }
    else if (e.key === 'f' || e.key === 'F') $('btnFollow').click();
    else if (e.key === 'm' || e.key === 'M') $('btnMe').click();
    else if (e.key === 't' || e.key === 'T') viewer.topView();
    else if (e.key === '2') setMode('2d'); else if (e.key === '3') setMode('3d');
    else if (e.key === 'h' || e.key === 'H') { viewer.homeCamera(); syncFollowBtn(); }
    else if (e.key === 'Escape') { if (!$('debrief').hidden || !$('library').hidden) showPage(''); else clearSelection(); }
  });
}
function togglePlay() { if (!ses) return; if (!playing && t >= ses.t1) t = ses.t0; playing = !playing; setPlayIcon(); }

// ---------- top bar, display settings, tabs ----------
function bindTop() {
  $('btnHome').onclick = () => { viewer.homeCamera(); syncFollowBtn(); };
  $('btnTop').onclick = () => viewer.topView();
  $('btn3d').onclick = () => setMode('3d'); $('btn2d').onclick = () => setMode('2d');
  $('btnDebrief').onclick = () => showPage($('debrief').hidden ? 'debrief' : '');
  $('btnLibrary').onclick = () => showPage($('library').hidden ? 'library' : '');
  $('btnMe').onclick = () => {
    if (!ses || viewer.meSlot < 0) return; const p = ses.playerBySlot.get(viewer.meSlot)!; const u = unitOfPlayer(p, t);
    if (u) { select(u.id, false); viewer.setFollow(u.id); syncFollowBtn(); }
  };
  $('btnFollow').onclick = () => { if (viewer.follow >= 0) viewer.setFollow(-1); else if (viewer.selected >= 0) viewer.setFollow(viewer.selected); syncFollowBtn(); };
  const un = $('units') as HTMLSelectElement; un.value = settings.units; un.onchange = () => { settings.units = un.value as any; save(); renderSelected(true); buildEvents(); };
  const me = $('me') as HTMLInputElement; me.value = settings.me;
  me.onchange = () => {
    settings.me = me.value.trim(); save(); if (!ses) return;
    for (const p of ses.players) p.highlight = false;
    viewer.resolveMe(); const mp = ses.playerBySlot.get(viewer.meSlot); if (mp) mp.highlight = true;
    viewer.restyle(); buildPlayers(); buildEvents(); drawStrip();
    library.reset(); debrief.invalidate();
  };
  $('btnAll').onclick = () => { if (!ses) return; for (const p of ses.players) p.hidden = false; viewer.restyle(); buildPlayers(); };
  $('btnInvolved').onclick = () => { if (!ses) return; const keep = involvedWithMe(); if (!keep.size) return; for (const p of ses.players) p.hidden = !keep.has(p.slot); viewer.restyle(); buildPlayers(); };
  ($('evMine') as HTMLInputElement).onchange = buildEvents; ($('evKind') as HTMLSelectElement).onchange = buildEvents;
}
const HINT3 = 'Drag: rotate · Right-drag: move · Wheel: zoom · Click: select · Double-click: follow · Shift-click: measure';
const HINT2 = 'Drag: move · Wheel: zoom · Click: select · Double-click: follow · Shift-click: measure';
function setMode(m: '3d' | '2d') {
  viewer.setMode(m); settings.view = m; save();
  $('btn3d').classList.toggle('on', m === '3d'); $('btn2d').classList.toggle('on', m === '2d');
  ($('btnTop') as HTMLButtonElement).disabled = m === '2d';
  $('hint').textContent = m === '2d' ? HINT2 : HINT3; $('scale').hidden = m !== '2d';
}
function renderScale() {
  if (viewer.mode !== '2d') return;
  const mpp = viewer.metresPerPx(); const aviation = settings.units === 'aviation'; const unit = aviation ? 1852 : 1000;
  const nice = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]; let len = nice[0];
  for (const n of nice) if (n * unit / mpp <= 160) len = n;
  $('scaleBar').style.width = Math.round(len * unit / mpp) + 'px'; $('scaleTxt').textContent = len + (aviation ? ' nm' : ' km');
}
function bindDisplay() {
  for (const c of Array.from(document.querySelectorAll('[data-set]')) as (HTMLInputElement | HTMLSelectElement)[]) {
    const key = c.dataset.set as keyof Settings;
    if (c instanceof HTMLInputElement) c.checked = !!settings[key]; else c.value = String(settings[key]);
    c.onchange = () => {
      (settings as any)[key] = c instanceof HTMLInputElement ? c.checked : (c.dataset.num ? Number(c.value) : c.value);
      save(); if (key === 'shade' || key === 'grid') viewer.paintTerrain();
    };
  }
}
function showTab(name: string) {
  for (const b of Array.from(document.querySelectorAll('.tabs button')) as HTMLElement[]) b.classList.toggle('on', b.dataset.tab === name);
  for (const n of ['display', 'selected', 'events']) $('tab-' + n).hidden = n !== name;
}
function bindTabs() { for (const b of Array.from(document.querySelectorAll('.tabs button')) as HTMLElement[]) b.onclick = () => showTab(b.dataset.tab!); }

// ---------- debrief and library pages ----------
function showPage(name: '' | 'debrief' | 'library') {
  $('debrief').hidden = name !== 'debrief'; $('library').hidden = name !== 'library';
  $('btnDebrief').classList.toggle('on', name === 'debrief'); $('btnLibrary').classList.toggle('on', name === 'library');
  if (name === 'debrief') debrief.open(); else if (name === 'library') library.open();
}
const debrief = new Debrief($('debrief'), {
  ses: () => ses, settings, meSlot: () => viewer.meSlot, unitTitle,
  seek: (tt: number) => { showPage(''); seek(tt); },
  watch: (tt: number, sel: number, follow: boolean) => {
    showPage('');
    if (tt < 0 || !ses) return;
    seek(tt);
    if (sel >= 0) { select(sel, false); if (follow) { viewer.setFollow(sel); syncFollowBtn(); } }
  },
});
const library = new Library($('library'), {
  settings,
  close: () => showPage(''),
  openMatch: async (id: string) => { showPage(''); const s = $('session') as HTMLSelectElement; if (s.value !== id) { s.value = id; await open(id); } },
});

// ---------- main loop ----------
let lastUi = 0;
function uiTick(force: boolean) {
  const now = performance.now(); if (!force && now - lastUi < 120) return; lastUi = now;
  if (!ses) return;
  $('clock').textContent = fmtClock(t - ses.t0);
  drawStrip(); renderSelected(false); renderMeasure(); markPlayers(); renderScale();
  $('needle').style.transform = 'rotate(' + (-viewer.viewHeading()) + 'deg)';
}
function frame(now: number) {
  const dt = Math.min(100, now - lastFrame); lastFrame = now;
  if (ses) {
    if (playing) { t += dt * speed; if (t >= ses.t1) { t = ses.t1; playing = false; setPlayIcon(); } }
    viewer.update(t); uiTick(false);
  }
  requestAnimationFrame(frame);
}
(window as any).wtrv = { viewer, seek, select, showPage, debrief, library, get t() { return t; }, get ses() { return ses; }, play: togglePlay };
boot();
