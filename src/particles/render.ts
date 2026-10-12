import { parseColor } from '../color';
import type { AtomHumanView } from '../types';
import type { Atom } from './geometry';
import type { HumanSim } from './sim';

export interface Palette { color: string; accentColor: string; faceColor: string }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

function sprite(color: string, light: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const rgb = parseColor(color) ?? [186, 216, 255];
  const tint = light ? rgb.map(v => Math.round(v * 0.66)) : rgb;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, light ? `rgb(${tint.join(',')})` : '#ffffff');
  g.addColorStop(0.12, `rgba(${tint.join(',')},1)`);
  g.addColorStop(0.27, `rgba(${tint.join(',')},.75)`);
  g.addColorStop(0.55, `rgba(${tint.join(',')},.15)`);
  g.addColorStop(1, `rgba(${tint.join(',')},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
  return canvas;
}

export class HumanRenderer {
  private sprites: HTMLCanvasElement[] = [];
  private paletteKey = '';
  private burstAt = -10;
  burst(time: number) { this.burstAt = time; }

  draw(ctx: CanvasRenderingContext2D, size: number, dpr: number, atoms: Atom[], sim: HumanSim, palette: Palette, view: AtomHumanView, halo: boolean, assembled: boolean) {
    const width = size * 1.16, height = size * 1.22;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const light = document.documentElement.dataset.theme === 'light';
    const key = [palette.color, palette.accentColor, palette.faceColor, light].join('|');
    if (key !== this.paletteKey) {
      this.paletteKey = key;
      this.sprites = [palette.color, palette.accentColor, palette.faceColor, '#ff596d', '#f7cb87'].map(c => sprite(c, light));
    }
    const t = sim.time, state = sim.shown, pose = sim.pose;
    const faceView = view === 'face';
    const scale = size / (faceView ? 1.04 : 4.55);
    const cx = width / 2, cy = faceView ? height * 0.58 : height * 0.49;
    const centerY = faceView ? 1.63 : 0;
    const progress = assembled ? 1 : clamp(sim.age / 1.5, 0, 1);
    const gather = 1 - (progress * progress * (3 - 2 * progress));
    const burst = clamp((t - this.burstAt) / 1.35, 0, 1);
    const burstAmount = Math.sin(burst * Math.PI) * Math.exp(-burst * 2);
    const sleep = state === 'sleeping';
    const energy = sleep ? 0.4 : 1;
    // Full turns come from the original Robot Heads jump rig; ordinary glances turn the head.
    const bodyYaw = Math.abs(pose.yaw) > 1.1 ? pose.yaw : pose.yaw * 0.2;
    const headYaw = Math.abs(pose.yaw) > 1.1 ? 0 : pose.yaw * 0.85;
    const byc = Math.cos(bodyYaw), bys = Math.sin(bodyYaw), hyc = Math.cos(headYaw), hys = Math.sin(headYaw);
    const pitch = pose.pitch * 0.65, pc = Math.cos(pitch), ps = Math.sin(pitch);
    const roll = pose.roll * (faceView ? 0.8 : 0.3), rc = Math.cos(roll), rs = Math.sin(roll);
    const project = (x: number, y: number, z: number) => {
      const perspective = 7 / (7 - z);
      return { x: cx + x * scale * perspective, y: cy - (y - centerY) * scale * perspective, z };
    };

    if (halo) {
      const center = faceView ? { x: cx, y: cy - 0.04 * scale } : project(0, -1.98, 0);
      const radius = size * (faceView ? 0.46 : 0.24);
      const rgb = parseColor(palette.color) ?? [145, 190, 255];
      const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
      glow.addColorStop(0, `rgba(${rgb.join(',')},${(light ? 0.06 : 0.16) * energy})`);
      glow.addColorStop(0.45, `rgba(${rgb.join(',')},${(light ? 0.025 : 0.07) * energy})`);
      glow.addColorStop(1, `rgba(${rgb.join(',')},0)`);
      ctx.fillStyle = glow; ctx.fillRect(center.x - radius, center.y - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
    const point = (x: number, y: number, diameter: number, tone: number, alpha: number) => {
      ctx.globalAlpha = clamp(alpha, 0, 1);
      const s = this.sprites[tone], w = diameter * 3.3;
      ctx.drawImage(s, x - w / 2, y - w / 2, w, w);
    };
    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i], isRing = a.group === 'ring', isFace = a.group !== 'body' && !isRing;
      if (isRing && (!halo || faceView)) continue;
      if (isFace && !faceView && i % 3 !== 0) continue;
      if (faceView && a.y < 1.22) continue;
      let x = a.x, y = a.y, z = a.z;
      let emphasis = 1;
      if (a.group === 'eye') {
        const closing = sleep ? 0.96 : sim.face.blink;
        y = 1.736 + (y - 1.736) * (1 - closing);
        x += sim.face.lookX * 0.004;
        y -= sim.face.lookY * 0.004;
        if (state === 'happy') y += Math.abs(x - a.side * 0.081) * 0.16;
        emphasis = 0.82;
      }
      if (a.group === 'brow') {
        if (state === 'thinking') y += a.side * 0.018;
        if (state === 'error') y -= 0.016 * (1 - Math.abs(x) / 0.15);
      }
      if (a.group === 'mouth') {
        if (state === 'happy') y += 0.025 * ((x / 0.07) ** 2 - 0.4);
        if (state === 'speaking') y = 1.58 + (y - 1.58) * (1 + Math.abs(Math.sin(t * 9) * Math.sin(t * 2.3)) * 5);
        if (state === 'error') y -= 0.018 * (x / 0.07) ** 2;
        emphasis = 0.88;
      }
      if (isRing) {
        const angle = t * 0.16;
        x = a.x * Math.cos(angle) - a.z * Math.sin(angle);
        z = a.x * Math.sin(angle) + a.z * Math.cos(angle);
      } else {
        const drift = isFace ? 0.0015 : 0.008;
        x += Math.sin(t * 1.1 + a.phase) * drift;
        z += Math.cos(t * 0.9 + a.phase) * drift;
        if (y > 0.5 && !isFace) x *= 1 + Math.sin(t * 1.9) * 0.012;
        if (isFace) {
          const hx = x * hyc + z * hys, hz = -x * hys + z * hyc;
          const dy = y - 1.4;
          x = hx; y = 1.4 + dy * pc - hz * ps; z = dy * ps + hz * pc;
        }
        const tx = x * byc + z * bys;
        z = -x * bys + z * byc; x = tx;
        const dy = y + 1.95;
        x *= pose.sx; y = dy * pose.sy - 1.95 + (faceView ? 0 : pose.lift * 1.7);
        const rx = x * rc - (y - (faceView ? 1.63 : 0.1)) * rs;
        y = x * rs + (y - (faceView ? 1.63 : 0.1)) * rc + (faceView ? 1.63 : 0.1); x = rx;
        const scatter = gather * (isFace ? 0.6 : 1.5) + burstAmount * (isFace ? 0.025 : 0.055);
        x += Math.cos(a.phase * 3 + t) * scatter;
        y += Math.sin(a.phase * 2 + t * 0.4) * scatter;
        z += Math.cos(a.phase * 4) * scatter;
      }
      const p = project(x, y, z);
      const twinkle = 0.74 + Math.sin(t * (1.2 + a.tone) + a.phase * 4) * 0.23;
      const depth = isFace ? clamp(0.52 + z * 2.5, 0.2, 1) : clamp(0.65 + z * 1.8, 0.25, 1);
      let tone = a.tone < 0.67 ? 0 : a.tone < 0.86 ? 1 : 2;
      if (a.group === 'eye' || a.group === 'mouth') tone = 2;
      if (state === 'error' && (a.tone > 0.5 || isFace)) tone = 3;
      if (state === 'happy' && a.tone > 0.72) tone = 4;
      if (state === 'searching') emphasis += Math.exp(-((y - (Math.sin(t * 1.6) * 1.65)) ** 2) / 0.045) * 1.8;
      if (state === 'working') emphasis += Math.exp(-((y - (-2 + (t * 0.85 % 4))) ** 2) / 0.06) * 1.2;
      const diameter = (faceView ? 0.7 + a.size * 0.72 : 0.45 + a.size * 0.6) * Math.sqrt(size / 340);
      // The dense facial samples stay visible as individual atoms at full-body scale.
      const density = isFace && !faceView ? 0.8 : 1;
      point(p.x, p.y, diameter, tone, twinkle * depth * emphasis * energy * density * (isRing ? 0.67 : 1));
    }
    if (halo && !faceView) {
      // Sparse ambient atoms, kept separate from the body so the silhouette stays clear.
      for (let i = 0; i < (size < 110 ? 18 : 100); i++) {
        const phase = i * 2.39996, r = 0.95 + Math.sin(i * 1.71) * 0.5;
        const a = phase + t * 0.075;
        const p = project(Math.cos(a) * r, Math.sin(i * 3.73) * 1.85, Math.sin(a) * r);
        point(p.x, p.y, 0.5 + (i % 4) * 0.12, i % 5 === 0 ? 1 : 0, 0.12 + Math.sin(t + phase) * 0.07);
      }
    }
    if (state === 'thinking' || state === 'listening' || state === 'speaking' || state === 'happy' || state === 'working') {
      const count = size < 110 ? 18 : 56;
      for (let i = 0; i < count; i++) {
        const phase = i / count * Math.PI * 2;
        let x: number, y: number, z: number;
        if (state === 'thinking') {
          const a = phase + t * 0.8;
          x = Math.cos(a) * 0.37; y = 1.98 + Math.sin(a) * 0.045; z = Math.sin(a) * 0.28;
        } else if (state === 'listening' || state === 'speaking') {
          const r = 0.31 + (Math.sin(t * 3 - phase * 2) + 1) * 0.075;
          x = Math.cos(phase) * r; y = 1.68 + Math.sin(phase) * r; z = -0.14;
        } else if (state === 'happy') {
          const h = (t * 0.6 + i / count) % 1;
          x = Math.sin(phase * 7 + t) * (0.5 + h * 0.2); y = -1.8 + h * 4; z = Math.cos(phase) * 0.2;
        } else {
          const a = phase + t * 1.4;
          x = Math.cos(a) * 0.48; y = -0.4 + ((t * 0.4 + i / count) % 1) * 1.6; z = Math.sin(a) * 0.28;
        }
        const p = project(x, y, z);
        point(p.x, p.y, Math.sqrt(size / 340) * 0.85, state === 'happy' ? 4 : 2, 0.3 + 0.4 * Math.sin(phase + t) ** 2);
      }
    }
    if (burst < 1) {
      for (let i = 0; i < 80; i++) {
        const angle = i * 2.39996;
        const r = mix(0.2, 1.8, burst);
        const p = project(Math.cos(angle) * r, (faceView ? 1.68 : 0.4) + Math.sin(angle) * r, 0.1);
        point(p.x, p.y, 0.8 * Math.sqrt(size / 340), 2, (1 - burst) * 0.6);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}
