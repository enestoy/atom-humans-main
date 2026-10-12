import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, type MouseEvent, type KeyboardEvent } from 'react';
import type { AtomHumanForm, AtomHumanProps, AtomHumanState } from './types';
import { generateHuman } from './particles/geometry';
import { HumanSim, restPose } from './particles/sim';
import { HumanRenderer } from './particles/render';
import { pointer, subscribe } from './ticker';

export const atomHumanForms: AtomHumanForm[] = ['human', 'slender', 'athletic', 'youth'];
export const atomHumanStates: AtomHumanState[] = ['idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping'];

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export const AtomHuman = forwardRef<HTMLCanvasElement, AtomHumanProps>(function AtomHuman({
  form = 'human', state = 'idle', view = 'body', size = 160,
  color = '#b4d7ff', accentColor = '#e6b96d', faceColor = '#e8f4ff',
  speed = 1, paused = false, interactive = true, halo = true, seed,
  className, style, onClick, onKeyDown, 'aria-label': ariaLabel, ...rest
}, ref) {
  const boxRef = useRef<HTMLSpanElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);
  const id = useId(), seedValue = Math.min(1, Math.max(0, seed ?? hashSeed(id)));
  const stateKey = atomHumanStates.includes(state) ? state : 'idle';
  const formKey = atomHumanForms.includes(form) ? form : 'human';
  const count = size < 100 ? 950 : view === 'face' ? 10500 : 6500;
  const atoms = useMemo(() => generateHuman(formKey, count, seedValue), [formKey, count, seedValue]);
  const sim = useRef<HumanSim | null>(null), renderer = useRef<HumanRenderer | null>(null);
  if (!sim.current) sim.current = new HumanSim(seedValue, stateKey);
  if (!renderer.current) renderer.current = new HumanRenderer();
  const options = useRef({ size, speed, interactive, halo, color, accentColor, faceColor, view, atoms });
  options.current = { size, speed, interactive, halo, color, accentColor, faceColor, view, atoms };
  const still = paused || !(speed > 0);
  const reduced = useRef(false);

  const paint = (assembled = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const o = options.current, dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(o.size * 1.16 * dpr), h = Math.round(o.size * 1.22 * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d');
    if (ctx) renderer.current!.draw(ctx, o.size, dpr, o.atoms, sim.current!, o, o.view, o.halo, assembled);
  };

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const stateChanged = sim.current!.state !== stateKey;
    let unsubscribe: (() => void) | undefined;
    const start = () => {
      unsubscribe?.(); reduced.current = motion.matches;
      if (still || motion.matches) {
        if (sim.current!.age === 0 || motion.matches || stateChanged) {
          sim.current!.pose = restPose(stateKey); sim.current!.shown = stateKey;
        }
        paint(true); return;
      }
      paint();
      unsubscribe = subscribe(dt => {
        const s = sim.current!, o = options.current, el = boxRef.current;
        if (o.interactive && el && Number.isFinite(pointer.x)) {
          const box = el.getBoundingClientRect();
          const x = pointer.x - (box.left + box.width / 2), y = pointer.y - (box.top + box.height * (o.view === 'face' ? 0.4 : 0.18));
          s.pointer = Math.hypot(x, y) < 700 ? { x, y } : null;
        } else s.pointer = null;
        // Keep all the original spring motions stable even at 2× speed.
        s.update(Math.min(dt, 0.05) * Math.min(4, Math.max(0, o.speed)));
        paint();
      });
    };
    sim.current!.setState(stateKey);
    start();
    motion.addEventListener('change', start);
    // Also refresh frozen canvases when the page theme changes.
    const observer = new MutationObserver(() => { if (still || reduced.current) paint(true); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { unsubscribe?.(); motion.removeEventListener('change', start); observer.disconnect(); };
    // All live values are read through options; these values also repaint paused canvases.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, stateKey, formKey, size, color, accentColor, faceColor, view, halo, atoms]);

  const react = () => {
    if (interactive && !still && !reduced.current) {
      sim.current!.poke(); renderer.current!.burst(sim.current!.time);
    }
  };
  const click = (e: MouseEvent<HTMLSpanElement>) => { react(); onClick?.(e); };
  const keyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); react(); }
    onKeyDown?.(e);
  };

  return <span ref={boxRef} role={interactive ? 'button' : 'img'} tabIndex={interactive ? 0 : undefined}
    aria-label={ariaLabel ?? `Atom human, ${stateKey}.${interactive ? " Click or press Enter or Space to react." : ""}`} className={className}
    onClick={click} onKeyDown={keyDown}
    style={{ position: 'relative', display: 'block', flex: 'none', width: size, height: size, cursor: interactive ? 'pointer' : undefined, ...style }} {...rest}>
    <canvas ref={canvasRef} aria-hidden style={{ position: 'absolute', left: -size * 0.08, top: -size * 0.11, width: size * 1.16, height: size * 1.22, display: 'block', pointerEvents: 'none' }} />
  </span>;
});
