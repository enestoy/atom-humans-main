# Atom Humans

Animated human characters made of glowing atoms, with expressive faces, nine animation states, and interactive particle effects. Built with React and Canvas 2D.

This project adapts the animation system and playground from `robot-heads-main` and the procedural human silhouette from the companion `human` project. It includes its own geometry and renderer.

## Getting started

Requires Node.js 22.12 or later and pnpm.

```sh
git clone https://github.com/enestoy/atom-humans-main.git
cd atom-humans-main
pnpm install
npm run dev
```

Open the local URL printed by Vite. English is the default language; use the EN / TR buttons to switch to Turkish.

## Languages

The playground uses `i18next` and `react-i18next` with English (`en`) as the default and fallback language, and Turkish (`tr`) as the second language. The language selector updates labels, state descriptions, tooltips, accessibility text, the HTML language attribute, and the page description. Your selection is saved locally for future visits; switching still works when browser storage is unavailable.

Translation files live in `site/src/locales/en.json` and `site/src/locales/tr.json`. The reusable React component provides an English accessibility label by default; pass a translated `aria-label` when integrating it into another application.

## Development commands

```sh
npm run typecheck
npm test
npm run build:site
npm run preview
```

`npm run build` builds the React library into `dist/`. `npm run build:site` builds both the library and the playground, with the playground output in `site/dist/`. `npm run preview` serves the built playground locally.

## Characters and interactions

- Four human forms: Human, Slender, Athletic, and Youth.
- Nine states: idle, thinking, searching, listening, speaking, working, happy, error, and sleeping.
- Full body and face detail views. Facial atoms form the forehead, cheeks, chin, ears, nose, eyes, eyebrows, and lips.
- Pointer tracking, blinking, and breathing. Click the character or press Enter or Space to trigger a jump, a full turn, and a burst of atoms.
- State effects include orbital particles, scanning waves, rising energy, speaking lips, and smiles. Listening and speaking rings use procedural animation.
- Controls for body, accent, and face colors, the floor halo, animation speed, pause, and theme.
- Support for reduced motion preferences and a shared animation loop that pauses when the browser tab is hidden.

The renderer projects three-dimensional atom positions onto Canvas 2D. The full body view uses approximately 6,500 generated atoms, with denser sampling for face detail and fewer atoms for small previews. Rendering runs without WebGL or external image services.

## React component

The playground imports the component directly from this repository. After building the library, its exports are available through the `atom-humans` package entry point.

```tsx
import { AtomHuman } from 'atom-humans';

<AtomHuman
  form="human"
  state="thinking"
  view="body"
  size={400}
  color="#b4d7ff"
  accentColor="#e6b96d"
  faceColor="#e8f4ff"
  halo
/>
```

Additional props include `speed`, `paused`, `interactive`, `seed`, and HTML span attributes. A forwarded ref points to the canvas element.

## Preview parameters

Use URL parameters to select a form, state, or view and to pause the animation or hide the halo:

```text
?form=athletic&state=thinking&view=face&paused&nohalo
```

Invalid form and state values fall back to the defaults.

## Credits and license

The spring animation system, shared ticker, and playground foundation were adapted from Fayaz Ahmed's MIT-licensed [robot-heads](https://github.com/fayazara/robot-heads) project. The original MIT license is preserved in [LICENSE](LICENSE).

The body particle geometry was adapted from `human/src/experience/particles/particleGenerators.ts` in the companion Human project. Facial anatomy, the atom renderer, and particle effects were added in this repository.
