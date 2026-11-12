// Small canvas charts for the debrief and library pages: time series with
// optional shaded bands, event markers, a cursor and click-to-jump.

export const PAL = { blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a', ink: '#e6eaf0', ink2: '#a9b3c2', ink3: '#7b8696', grid: '#2f3948', yellow: '#ffe14d' };

export interface Series { name: string; color: string; pts: number[][]; step?: boolean; dashed?: boolean; width?: number; }
export interface Band { y0: number; y1: number; color: string; label?: string; }
export interface Marker { x: number; label: string; color: string; }
export interface ChartOpts {
  x0: number; x1: number;
  series: Series[];
  yMin?: number; yMax?: number;
  bands?: Band[];
  markers?: Marker[];
  cursorX?: number;
  xFmt?: (x: number) => string;
  yFmt?: (y: number) => string;
  onClick?: (x: number) => void;
  height?: number;
  legend?: boolean;
  zeroLine?: boolean;
}

export function chart(host: HTMLElement, o: ChartOpts): HTMLCanvasElement {
  const wrap = document.createElement('div'); wrap.className = 'chartBox';
  if (o.legend !== false && o.series.length > 1) {
    const lg = document.createElement('div'); lg.className = 'legendRow';
    for (const s of o.series) {
      const it = document.createElement('span'); const sw = document.createElement('i'); sw.style.background = s.color;
      if (s.dashed) sw.className = 'dash';
      it.append(sw, document.createTextNode(s.name)); lg.appendChild(it);
    }
    wrap.appendChild(lg);
  }
  const cv = document.createElement('canvas'); cv.style.height = (o.height || 120) + 'px'; wrap.appendChild(cv);
  const read = document.createElement('div'); read.className = 'readout'; wrap.appendChild(read);
  host.appendChild(wrap);
  const L = 70, R = 10, T = 8, B = 20;
  let geo: { X: (x: number) => number, Y: (y: number) => number, w: number, h: number, ix: (px: number) => number } | null = null;
  const draw = (hoverX: number | null) => {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const x = cv.getContext('2d')!; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    let lo = o.yMin, hi = o.yMax;
    if (lo === undefined || hi === undefined) {
      let a = Infinity, b = -Infinity;
      for (const s of o.series) for (const p of s.pts) if (isFinite(p[1])) { a = Math.min(a, p[1]); b = Math.max(b, p[1]); }
      for (const bd of o.bands || []) { a = Math.min(a, bd.y0); b = Math.max(b, bd.y1); }
      if (!isFinite(a)) { a = 0; b = 1; }
      if (lo === undefined) lo = a; if (hi === undefined) hi = b;
    }
    if (hi! - lo! < 1e-9) hi = lo! + 1;
    const pad = (hi! - lo!) * 0.06; const y0 = lo! - (o.yMin === undefined ? pad : 0), y1 = hi! + (o.yMax === undefined ? pad : 0);
    const X = (v: number) => L + (v - o.x0) / Math.max(1e-9, o.x1 - o.x0) * (w - L - R);
    const Y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (h - T - B);
    geo = { X, Y, w, h, ix: (px: number) => o.x0 + (px - L) / (w - L - R) * (o.x1 - o.x0) };
    // bands
    for (const bd of o.bands || []) { x.fillStyle = bd.color; const a = Y(Math.min(y1, bd.y1)), b = Y(Math.max(y0, bd.y0)); x.fillRect(L, a, w - L - R, b - a); }
    // grid + axis labels
    x.strokeStyle = PAL.grid; x.lineWidth = 1; x.fillStyle = PAL.ink3; x.font = '11px Segoe UI, system-ui, sans-serif';
    const yf0 = o.yFmt || ((v: number) => String(Math.round(v))); const yf = (v: number) => yf0(Math.abs(v) < 1e-9 ? 0 : v);
    for (const v of [y0 + (y1 - y0) * 0.05, (y0 + y1) / 2, y1 - (y1 - y0) * 0.05]) {
      x.beginPath(); x.moveTo(L, Math.round(Y(v)) + 0.5); x.lineTo(w - R, Math.round(Y(v)) + 0.5); x.stroke();
      x.textAlign = 'right'; x.fillText(yf(v), L - 5, Y(v) + 4);
    }
    if (o.zeroLine && y0 < 0 && y1 > 0) { x.strokeStyle = PAL.ink3; x.beginPath(); x.moveTo(L, Y(0)); x.lineTo(w - R, Y(0)); x.stroke(); }
    const xf = o.xFmt || ((v: number) => String(Math.round(v)));
    x.textAlign = 'left'; x.fillText(xf(o.x0), L, h - 5); x.textAlign = 'right'; x.fillText(xf(o.x1), w - R, h - 5);
    // markers
    for (const m of o.markers || []) {
      const px = Math.round(X(m.x)) + 0.5; if (px < L || px > w - R) continue;
      x.strokeStyle = m.color; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(px, T); x.lineTo(px, h - B); x.stroke(); x.setLineDash([]);
    }
    // series
    for (const s of o.series) {
      x.strokeStyle = s.color; x.lineWidth = s.width || 2; x.lineJoin = 'round'; if (s.dashed) x.setLineDash([5, 4]);
      x.beginPath(); let first = true, prevY = 0;
      for (const p of s.pts) {
        if (!isFinite(p[1])) { first = true; continue; }
        const px = X(p[0]), py = Y(Math.max(y0, Math.min(y1, p[1])));
        if (first) { x.moveTo(px, py); first = false; } else { if (s.step) x.lineTo(px, prevY); x.lineTo(px, py); }
        prevY = py;
      }
      x.stroke(); x.setLineDash([]);
    }
    // cursor
    const cx = hoverX !== null ? hoverX : o.cursorX;
    if (cx !== undefined && cx !== null && cx >= o.x0 && cx <= o.x1) {
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(cx) + 0.5, T); x.lineTo(X(cx) + 0.5, h - B); x.stroke();
    }
    // readout
    if (hoverX !== null) {
      const parts = [xf(hoverX)];
      for (const s of o.series) {
        let best: number[] | null = null; for (const p of s.pts) if (p[0] <= hoverX) best = p; else break;
        if (best && isFinite(best[1])) parts.push(s.name + ' ' + yf(best[1]));
      }
      const near = (o.markers || []).filter(m => Math.abs(X(m.x) - X(hoverX)) < 4).map(m => m.label);
      read.textContent = parts.concat(near).join(' · ');
    } else read.textContent = '';
  };
  cv.addEventListener('mousemove', e => { if (!geo) return; const r = cv.getBoundingClientRect(); const v = geo.ix(e.clientX - r.left); draw(Math.max(o.x0, Math.min(o.x1, v))); });
  cv.addEventListener('mouseleave', () => draw(null));
  if (o.onClick) { cv.style.cursor = 'pointer'; cv.addEventListener('click', e => { if (!geo) return; const r = cv.getBoundingClientRect(); o.onClick!(geo.ix(e.clientX - r.left)); }); }
  requestAnimationFrame(() => draw(null));
  new ResizeObserver(() => draw(null)).observe(cv);
  return cv;
}

// Horizontal bars: label, value, optional comparison value (drawn as a tick).
export function bars(host: HTMLElement, rows: { label: string, value: number, compare?: number, text?: string }[], max: number, color = PAL.blue) {
  const box = document.createElement('div'); box.className = 'barList';
  for (const r of rows) {
    const row = document.createElement('div'); row.className = 'barRow';
    const lab = document.createElement('span'); lab.className = 'bl'; lab.textContent = r.label;
    const track = document.createElement('div'); track.className = 'bt';
    const fill = document.createElement('div'); fill.className = 'bf'; fill.style.width = Math.max(0, Math.min(100, r.value / max * 100)) + '%'; fill.style.background = color;
    track.appendChild(fill);
    if (r.compare !== undefined) { const tk = document.createElement('div'); tk.className = 'bc'; tk.style.left = Math.max(0, Math.min(100, r.compare / max * 100)) + '%'; track.appendChild(tk); }
    const val = document.createElement('span'); val.className = 'bv'; val.textContent = r.text || String(r.value);
    row.append(lab, track, val); box.appendChild(row);
  }
  host.appendChild(box);
}
