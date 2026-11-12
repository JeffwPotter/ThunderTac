// Wide lines and ribbons. WebGL draws ordinary lines one pixel wide, so trails
// and other lines are drawn as thin strips of triangles:
//  - "line": a strip that always faces the screen, a fixed number of pixels wide
//  - "ribbon": a strip lying along the aircraft's wings, so banking and rolling
//    show as the ribbon twisting (Tacview style)
import * as THREE from 'three';

const VERT_TRAIL = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 prev;
attribute vec3 next;
attribute float side;
attribute vec3 wing;
attribute float upy;
attribute float tsec;
uniform float uWidth;
uniform float uRibbon;
uniform float uHalf;
uniform vec2 uRes;
varying float vShade;
varying float vT;
vec2 toScreen(vec4 c) { return c.xy / max(abs(c.w), 1e-6) * sign(c.w + 1e-9) * uRes * 0.5; }
void main() {
  vShade = 1.0; vT = tsec;
  if (uRibbon > 0.5) {
    vec3 p = position + wing * side * uHalf;
    vShade = 0.55 + 0.45 * clamp(upy, -1.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  } else {
    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 c = m * vec4(position, 1.0);
    vec4 a = m * vec4(prev, 1.0);
    vec4 b = m * vec4(next, 1.0);
    vec2 sc = toScreen(c), sa = toScreen(a), sb = toScreen(b);
    vec2 d1 = sc - sa, d2 = sb - sc;
    vec2 dir = length(d1) > 0.001 ? normalize(d1) : vec2(1.0, 0.0);
    if (length(d2) > 0.001) dir = normalize(length(d1) > 0.001 ? normalize(d1) + normalize(d2) : d2);
    vec2 nrm = vec2(-dir.y, dir.x);
    c.xy += nrm * side * uWidth / uRes * 2.0 * c.w * 0.5;
    gl_Position = c;
  }
  #include <logdepthbuf_vertex>
}`;

const FRAG_TRAIL = `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uOpacity;
uniform float uHead;
uniform float uFade;
varying float vShade;
varying float vT;
void main() {
  #include <logdepthbuf_fragment>
  float a = uOpacity;
  if (uFade > 0.0) a *= clamp(1.0 - (uHead - vT) / uFade, 0.12, 1.0);
  float s = gl_FrontFacing ? vShade : vShade * 0.8;
  gl_FragColor = vec4(uColor * s, a);
}`;

export function trailMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT_TRAIL, fragmentShader: FRAG_TRAIL, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uWidth: { value: 2 }, uRibbon: { value: 0 }, uHalf: { value: 10 }, uRes: { value: new THREE.Vector2(800, 600) },
      uColor: { value: new THREE.Color(1, 1, 1) }, uOpacity: { value: 0.8 }, uHead: { value: 0 }, uFade: { value: 0 },
    },
  });
}

// A track drawn as a strip: two vertices per sample, plus room to put the
// current (in-between) position after the newest sample.
export class Trail {
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  n: number;
  private cen: Float32Array; private prv: Float32Array; private nxt: Float32Array; private wng: Float32Array; private upy: Float32Array;
  private orig: Float32Array; private origW: Float32Array; private origU: Float32Array;
  private patched = -1;

  // pts: x,y,z per sample (3D-library coordinates); wing: right-wing unit vector per sample (or null); up: up-vector y per sample
  constructor(pts: Float32Array, wing: Float32Array | null, up: Float32Array | null, tsec: Float32Array) {
    const n = pts.length / 3; this.n = n;
    const V = n * 2;
    this.cen = new Float32Array(V * 3); this.prv = new Float32Array(V * 3); this.nxt = new Float32Array(V * 3);
    this.wng = new Float32Array(V * 3); this.upy = new Float32Array(V);
    const sideA = new Float32Array(V), tA = new Float32Array(V);
    this.orig = pts; this.origW = wing || new Float32Array(n * 3); this.origU = up || new Float32Array(n).fill(1);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 2; k++) {
        const v = i * 2 + k;
        sideA[v] = k ? 1 : -1; tA[v] = tsec[i];
      }
      this.writeCenter(i, pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      this.writeWing(i, this.origW[i * 3], this.origW[i * 3 + 1], this.origW[i * 3 + 2], this.origU[i]);
    }
    const idx = new Uint32Array(Math.max(1, n - 1) * 6);
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
    }
    const g = new THREE.BufferGeometry();
    const dyn = (arr: Float32Array, size: number) => new THREE.BufferAttribute(arr, size).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', dyn(this.cen, 3)); g.setAttribute('prev', dyn(this.prv, 3)); g.setAttribute('next', dyn(this.nxt, 3));
    g.setAttribute('wing', dyn(this.wng, 3)); g.setAttribute('upy', dyn(this.upy, 1));
    g.setAttribute('side', new THREE.BufferAttribute(sideA, 1)); g.setAttribute('tsec', new THREE.BufferAttribute(tA, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.geo = g; this.mat = trailMaterial();
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.visible = false;
  }

  private setV(arr: Float32Array, i: number, x: number, y: number, z: number) {
    if (i < 0 || i >= this.n) return;
    const o = i * 6; arr[o] = x; arr[o + 1] = y; arr[o + 2] = z; arr[o + 3] = x; arr[o + 4] = y; arr[o + 5] = z;
  }
  private writeCenter(i: number, x: number, y: number, z: number) {
    this.setV(this.cen, i, x, y, z);
    this.setV(this.prv, i + 1, x, y, z);
    this.setV(this.nxt, i - 1, x, y, z);
    if (i === 0) this.setV(this.prv, 0, x, y, z);
    if (i === this.n - 1) this.setV(this.nxt, i, x, y, z);
  }
  private writeWing(i: number, x: number, y: number, z: number, u: number) {
    this.setV(this.wng, i, x, y, z); this.upy[i * 2] = u; this.upy[i * 2 + 1] = u;
  }
  private touch() {
    for (const k of ['position', 'prev', 'next', 'wing', 'upy']) (this.geo.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
  }

  // Show samples start..head and, when alive, the current position in the slot after head.
  update(start: number, head: number, cur: number[] | null, curWing: number[] | null, curUp: number) {
    const slot = cur ? head + 1 : -1;
    let dirty = false;
    if (this.patched !== slot && this.patched >= 0 && this.patched < this.n) {
      const p = this.patched, o = this.orig;
      this.writeCenter(p, o[p * 3], o[p * 3 + 1], o[p * 3 + 2]);
      this.writeWing(p, this.origW[p * 3], this.origW[p * 3 + 1], this.origW[p * 3 + 2], this.origU[p]);
      dirty = true;
    }
    this.patched = slot;
    let count = head - start + 1;
    if (slot >= 0 && slot < this.n && cur) {
      this.writeCenter(slot, cur[0], cur[1], cur[2]);
      if (curWing) this.writeWing(slot, curWing[0], curWing[1], curWing[2], curUp);
      count += 1; dirty = true;
    }
    if (dirty) this.touch();
    if (count < 2) { this.mesh.visible = false; return; }
    this.geo.setDrawRange(start * 6, (count - 1) * 6);
    this.mesh.visible = true;
  }

  dispose() { this.geo.dispose(); this.mat.dispose(); }
}

// ---- wide line segments with per-vertex colours (lock lines, rings, etc.) ----

const VERT_SEG = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 other;
attribute float side;
attribute vec3 color;
uniform float uWidth;
uniform vec2 uRes;
varying vec3 vColor;
vec2 toScreen(vec4 c) { return c.xy / max(abs(c.w), 1e-6) * sign(c.w + 1e-9) * uRes * 0.5; }
void main() {
  vColor = color;
  mat4 m = projectionMatrix * modelViewMatrix;
  vec4 c = m * vec4(position, 1.0);
  vec4 o = m * vec4(other, 1.0);
  vec2 d = toScreen(o) - toScreen(c);
  vec2 dir = length(d) > 0.001 ? normalize(d) : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  c.xy += nrm * side * uWidth / uRes * c.w;
  gl_Position = c;
  #include <logdepthbuf_vertex>
}`;
const FRAG_SEG = `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uOpacity;
varying vec3 vColor;
void main() {
  #include <logdepthbuf_fragment>
  gl_FragColor = vec4(vColor, uOpacity);
}`;

export class Segments {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  private pos: Float32Array; private oth: Float32Array; private col: Float32Array;
  private geo: THREE.BufferGeometry;
  cap: number; count = 0;

  constructor(cap: number, width = 2, opacity = 0.9) {
    cap = Math.max(1, cap); this.cap = cap;
    const V = cap * 4;
    this.pos = new Float32Array(V * 3); this.oth = new Float32Array(V * 3); this.col = new Float32Array(V * 3);
    const side = new Float32Array(V);
    const idx = new Uint32Array(cap * 6);
    for (let i = 0; i < cap; i++) {
      side.set([-1, 1, 1, -1], i * 4);
      // vertices: a-, a+ (other = b), b-, b+ (other = a; side flipped so both sides line up)
      const v = i * 4; idx.set([v, v + 1, v + 3, v, v + 3, v + 2], i * 6);
    }
    const g = new THREE.BufferGeometry();
    const dyn = (arr: Float32Array) => new THREE.BufferAttribute(arr, 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', dyn(this.pos)); g.setAttribute('other', dyn(this.oth)); g.setAttribute('color', dyn(this.col));
    g.setAttribute('side', new THREE.BufferAttribute(side, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setDrawRange(0, 0);
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({ vertexShader: VERT_SEG, fragmentShader: FRAG_SEG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uWidth: { value: width }, uRes: { value: new THREE.Vector2(800, 600) }, uOpacity: { value: opacity } } });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false;
  }
  begin() { this.count = 0; }
  add(ax: number, ay: number, az: number, bx: number, by: number, bz: number, ca: THREE.Color, cb: THREE.Color = ca) {
    if (this.count >= this.cap) return;
    const v = this.count * 4, P = this.pos, O = this.oth, C = this.col;
    const set = (arr: Float32Array, i: number, x: number, y: number, z: number) => { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; };
    set(P, v, ax, ay, az); set(P, v + 1, ax, ay, az); set(P, v + 2, bx, by, bz); set(P, v + 3, bx, by, bz);
    set(O, v, bx, by, bz); set(O, v + 1, bx, by, bz); set(O, v + 2, ax, ay, az); set(O, v + 3, ax, ay, az);
    set(C, v, ca.r, ca.g, ca.b); set(C, v + 1, ca.r, ca.g, ca.b); set(C, v + 2, cb.r, cb.g, cb.b); set(C, v + 3, cb.r, cb.g, cb.b);
    this.count++;
  }
  end() {
    this.geo.setDrawRange(0, this.count * 6);
    for (const k of ['position', 'other', 'color']) (this.geo.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
  }
}

export function setResolution(mats: THREE.ShaderMaterial[], w: number, h: number) {
  for (const m of mats) (m.uniforms.uRes.value as THREE.Vector2).set(w, h);
}
