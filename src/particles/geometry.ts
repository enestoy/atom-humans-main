import type { AtomHumanForm } from '../types';

type Vec3 = [number, number, number];
export type AtomGroup = 'body' | 'head' | 'eye' | 'brow' | 'mouth' | 'ring';
export interface Atom { x: number; y: number; z: number; group: AtomGroup; side: number; phase: number; size: number; tone: number }
type Primitive = { kind: 'ellipsoid'; c: Vec3; r: Vec3 } | { kind: 'tube'; a: Vec3; b: Vec3; ra: number; rb: number };

function random(seed: number) {
  let a = Math.floor(seed * 0xffffffff) >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ a >>> 15, a | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Adapted from human/src/experience/particles/particleGenerators.ts.
// Surface samples preserve the original silhouette; the face has its own anatomy.
function bodyParts(form: AtomHumanForm): Primitive[] {
  const width = form === 'athletic' ? 1.15 : form === 'slender' ? 0.86 : form === 'youth' ? 0.93 : 1;
  const parts: Primitive[] = [
    { kind: 'tube', a: [0, 1.36, 0], b: [0, 1.5, 0], ra: 0.083, rb: 0.075 },
    { kind: 'ellipsoid', c: [0, 1.02, 0], r: [0.34 * width, 0.4, 0.19] },
    { kind: 'ellipsoid', c: [0, 0.55, 0], r: [0.25 * width, 0.3, 0.16] },
    { kind: 'ellipsoid', c: [0, 0.18, 0], r: [0.3 * width, 0.22, 0.18] },
  ];
  for (const s of [-1, 1]) {
    const w = (x: number) => s * x * width;
    parts.push(
      { kind: 'ellipsoid', c: [w(0.35), 1.28, 0], r: [0.115, 0.12, 0.115] },
      { kind: 'tube', a: [w(0.39), 1.26, 0], b: [w(0.51), 0.72, 0.015], ra: 0.087, rb: 0.066 },
      { kind: 'tube', a: [w(0.51), 0.72, 0.015], b: [w(0.6), 0.22, 0.065], ra: 0.064, rb: 0.042 },
      { kind: 'ellipsoid', c: [w(0.62), 0.105, 0.07], r: [0.044, 0.105, 0.03] },
      { kind: 'tube', a: [w(0.16), 0.1, 0], b: [w(0.22), -0.88, 0.02], ra: 0.131, rb: 0.086 },
      { kind: 'tube', a: [w(0.22), -0.88, 0.02], b: [w(0.255), -1.84, -0.01], ra: 0.08, rb: 0.05 },
      { kind: 'ellipsoid', c: [w(0.26), -1.92, 0.07], r: [0.058, 0.05, 0.14] },
    );
    for (let f = 0; f < 5; f++) {
      const x = w(0.594 + f * 0.014);
      parts.push({ kind: 'tube', a: [x, 0.075, 0.08], b: [x + s * 0.012, -0.005 - Math.sin(f / 4 * Math.PI) * 0.05, 0.088], ra: 0.009, rb: 0.006 });
    }
  }
  return parts;
}

function area(p: Primitive): number {
  if (p.kind === 'ellipsoid') {
    const [a, b, c] = p.r, k = 1.6075;
    return 4 * Math.PI * ((Math.pow(a * b, k) + Math.pow(a * c, k) + Math.pow(b * c, k)) / 3) ** (1 / k);
  }
  return Math.PI * (p.ra + p.rb) * Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]);
}

export function generateHuman(form: AtomHumanForm, count: number, seed: number): Atom[] {
  const rng = random(seed), atoms: Atom[] = [];
  const add = (x: number, y: number, z: number, group: AtomGroup = 'body', side = 0) => {
    atoms.push({ x, y, z, group, side, phase: rng() * Math.PI * 2, size: 0.55 + rng() ** 3 * 1.25, tone: rng() });
  };
  const parts = bodyParts(form), weights = parts.map(area);
  const total = weights.reduce((a, b) => a + b, 0);
  const bodyCount = Math.round(count * 0.67);
  parts.forEach((p, index) => {
    const n = Math.round(bodyCount * weights[index] / total);
    for (let i = 0; i < n; i++) {
      const theta = rng() * Math.PI * 2, inset = 0.88 + rng() * 0.12;
      if (p.kind === 'ellipsoid') {
        const u = rng() * 2 - 1, r = Math.sqrt(1 - u * u);
        add(p.c[0] + Math.cos(theta) * r * p.r[0] * inset, p.c[1] + u * p.r[1] * inset, p.c[2] + Math.sin(theta) * r * p.r[2] * inset);
      } else {
        const t = rng(), ax = p.b[0] - p.a[0], ay = p.b[1] - p.a[1], az = p.b[2] - p.a[2];
        const len = Math.hypot(ax, ay, az), ux = ax / len, uy = ay / len, uz = az / len;
        let nx = 1 - ux * ux, ny = -ux * uy, nz = -ux * uz;
        const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const radius = (p.ra + (p.rb - p.ra) * t) * inset, c = Math.cos(theta) * radius, s = Math.sin(theta) * radius;
        add(p.a[0] + ax * t + nx * c + (uy * nz - uz * ny) * s, p.a[1] + ay * t + ny * c + (uz * nx - ux * nz) * s, p.a[2] + az * t + nz * c + (ux * ny - uy * nx) * s);
      }
    }
  });

  const headWidth = form === 'slender' ? 0.205 : form === 'youth' ? 0.24 : 0.222;
  for (let i = 0; i < count * 0.17; i++) {
    const u = rng() * 2 - 1, theta = rng() * Math.PI * 2, radius = Math.sqrt(1 - u * u);
    let x = Math.cos(theta) * radius * headWidth * (u < -0.25 ? 1 + (u + 0.25) * 0.3 : 1);
    const y = 1.69 + u * 0.29;
    let z = Math.sin(theta) * radius * 0.205;
    if (z > 0) {
      if (Math.abs(Math.abs(x) - 0.082) < 0.042 && Math.abs(y - 1.736) < 0.022) continue;
      const cheek = Math.exp(-(((Math.abs(x) - 0.105) / 0.065) ** 2) - ((y - 1.66) / 0.07) ** 2);
      z += cheek * 0.024;
      x *= 0.97;
    }
    add(x, y, z, 'head');
  }
  for (let i = 0; i < count * 0.045; i++) {
    const x = (rng() * 2 - 1) * 0.17, y = 1.45 + rng() * 0.44;
    const e = (x / headWidth) ** 2 + ((y - 1.69) / 0.29) ** 2;
    if (e >= 1 || (Math.abs(Math.abs(x) - 0.082) < 0.04 && Math.abs(y - 1.736) < 0.025)) continue;
    add(x, y, Math.sqrt(1 - e) * 0.207, 'head');
  }
  // Nose bridge and tip project from the face instead of sitting on a screen.
  for (let i = 0; i < count * 0.018; i++) {
    const t = rng(), theta = rng() * Math.PI * 2;
    const w = 0.013 + t * 0.017;
    add(Math.cos(theta) * w, 1.77 - t * 0.13 + Math.sin(theta) * 0.009, 0.202 + t * 0.075 + Math.sin(theta) * 0.008, 'head');
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < count * 0.007; i++) {
      const theta = rng() * Math.PI * 2, v = rng() * 2 - 1;
      add(side * 0.222 + Math.cos(theta) * 0.018, 1.685 + v * 0.064, Math.sin(theta) * 0.03, 'head');
    }
    for (let i = 0; i < count * 0.012; i++) {
      const theta = rng() * Math.PI * 2;
      const eyelid = Math.cos(theta);
      add(side * 0.081 + eyelid * 0.036, 1.736 + Math.sin(theta) * 0.011 - side * eyelid * 0.003, 0.202 + Math.sin(theta) * 0.004, 'eye', side);
    }
    for (let i = 0; i < count * 0.005; i++) {
      const theta = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 0.008;
      add(side * 0.081 + Math.cos(theta) * r, 1.736 + Math.sin(theta) * r, 0.219, 'eye', side);
    }
    for (let i = 0; i < count * 0.007; i++) {
      const t = rng();
      add(side * (0.04 + t * 0.086), 1.775 + Math.sin(t * Math.PI) * 0.009, 0.192 - t * 0.018, 'brow', side);
    }
  }
  for (let i = 0; i < count * 0.018; i++) {
    const t = rng() * 2 - 1, upper = rng() > 0.5;
    add(t * 0.07, 1.58 + (upper ? 0.005 + Math.exp(-((Math.abs(t) - 0.3) ** 2) * 25) * 0.009 : -0.01 * (1 - t * t)), 0.21 + (1 - t * t) * 0.015, 'mouth');
  }
  for (let i = 0; i < count * 0.08; i++) {
    const theta = rng() * Math.PI * 2, r = 0.78 + rng() ** 0.7 * 0.72;
    add(Math.cos(theta) * r, -2.04 + (rng() - 0.5) * 0.025, Math.sin(theta) * r, 'ring');
  }
  return atoms;
}
