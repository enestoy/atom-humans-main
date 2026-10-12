import type { CSSProperties, HTMLAttributes } from 'react';

export type AtomHumanState = 'idle' | 'thinking' | 'searching' | 'listening' | 'speaking' | 'working' | 'happy' | 'error' | 'sleeping';
export type AtomHumanForm = 'human' | 'slender' | 'athletic' | 'youth';
export type AtomHumanView = 'body' | 'face';

export interface AtomHumanProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  form?: AtomHumanForm;
  state?: AtomHumanState;
  view?: AtomHumanView;
  /** Square layout box in CSS pixels. The glow extends slightly outside it. */
  size?: number;
  /** Main, secondary and facial atom colours. */
  color?: string;
  accentColor?: string;
  faceColor?: string;
  speed?: number;
  paused?: boolean;
  interactive?: boolean;
  /** Orbital atoms and a soft halo under the feet. */
  halo?: boolean;
  /** Stable seed in the 0–1 range. */
  seed?: number;
  className?: string;
  style?: CSSProperties;
}
