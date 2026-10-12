import { useEffect, useState } from 'react';
import { AtomHuman, atomHumanForms, atomHumanStates, type AtomHumanForm, type AtomHumanState } from 'atom-humans';

/* ?form=human&state=thinking&paused for screenshots */
const q = new URLSearchParams(location.search);

const formLabels: Record<AtomHumanForm, string> = {
  human: 'İnsan',
  slender: 'İnce',
  athletic: 'Atletik',
  youth: 'Genç',
};

const stateLabels: Record<AtomHumanState, string> = {
  idle: 'Sakin', thinking: 'Düşünüyor', searching: 'Arıyor', listening: 'Dinliyor',
  speaking: 'Konuşuyor', working: 'Çalışıyor', happy: 'Mutlu', error: 'Hata', sleeping: 'Uyuyor',
};
const stateHints: Record<AtomHumanState, string> = {
  idle: 'Nefes alır, göz kırpar ve bakışlarıyla seni takip eder.',
  thinking: 'Başını eğer; düşünceler atom yörüngelerine dönüşür.',
  searching: 'Etrafına bakınır; ışık dalgası bedenini tarar.',
  listening: 'Sana doğru eğilir; atom halkaları ritmik olarak titreşir.',
  speaking: 'Atomlardan dudakları hareket eder, yüzüne ışık yayılır.',
  working: 'Odaklanır; enerji dalgaları bedeninde yükselir.',
  happy: 'Gülümser, zıplar ve etrafına altın atomlar saçar.',
  error: 'Başını sallar; atomları kırmızı ışıkla yanıp söner.',
  sleeping: 'Gözleri kapanır, atom ışığı yavaşça soluk alır.',
};

interface Colors {
  color: string;
  accentColor: string;
  faceColor: string;
}

const DEFAULTS: Colors = { color: '#b4d7ff', accentColor: '#e6b96d', faceColor: '#e8f4ff' };

const SWATCHES: Record<keyof Colors, Array<[string, string]>> = {
  color: [
    ['Yıldız mavisi', '#b4d7ff'],
    ['Kobalt', '#2b49a3'],
    ['Mercan', '#c8372d'],
    ['Turuncu', '#e2762a'],
    ['Kehribar', '#e0ad1f'],
    ['Nane', '#2f8f58'],
    ['Turkuaz', '#1f8189'],
    ['Mor', '#6a45b8'],
    ['Pembe', '#d9558f'],
    ['Grafit', '#3a3d44'],
    ['Porselen', '#e6e6ea'],
  ],
  accentColor: [
    ['Altın', '#e6b96d'],
    ['Çelik', '#93a6c8'],
    ['Gümüş', '#c4c9d2'],
    ['Pirinç', '#c9a45c'],
    ['Bakır', '#c27a52'],
    ['Siyah', '#2a2c31'],
  ],
  faceColor: [
    ['Beyaz', '#e8f4ff'],
    ['Buz', '#7fe7ff'],
    ['Yeşil', '#7dff9a'],
    ['Kehribar', '#ffc46b'],
    ['Neon', '#ff8fd0'],
  ],
};

const ROW_LABELS: Record<keyof Colors, string> = { color: 'Beden atomları', accentColor: 'Vurgu atomları', faceColor: 'Yüz atomları' };
const SPEEDS = [0.5, 1, 1.5, 2];



/* Fit a full human silhouette into the available stage. */
function useStageSize() {
  const measure = () => {
    const w = window.innerWidth, h = window.innerHeight;
    if (w < 900) return Math.round(Math.min(w - 64, 390));
    return Math.round(Math.max(260, Math.min(w - 560, h - 310, 490)));
  };
  const [size, setSize] = useState(measure);
  useEffect(() => {
    const on = () => setSize(measure());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return size;
}

function Dock({ form, onChange, colors, halo, paused, speed }: { form: AtomHumanForm; onChange: (s: AtomHumanForm) => void; colors: Colors; halo: boolean; paused: boolean; speed: number }) {
  return (
    <nav className="dock" aria-label="Karakter">
      {atomHumanForms.map((s) => (
        <button key={s} className="dock-item" aria-pressed={s === form} aria-label={formLabels[s]} onClick={() => onChange(s)}>
          <span className="dock-icon">
            <AtomHuman form={s} view="face" size={52} interactive={false} halo={halo} paused={paused} speed={speed} aria-hidden seed={0.42} {...colors} />
          </span>
          <span className="dock-tip">{formLabels[s]}</span>
        </button>
      ))}
    </nav>
  );
}

function Swatches({ name, value, onChange }: { name: keyof Colors; value: string; onChange: (v: string) => void }) {
  const known = SWATCHES[name].find(([, hex]) => hex === value);
  return (
    <div className="control">
      <div className="control-head">
        <span className="control-label">{ROW_LABELS[name]}</span>
        <span className="control-value">{known ? known[0] : value}</span>
      </div>
      <div className="swatches">
        {SWATCHES[name].map(([label, hex]) => (
          <button
            key={hex}
            className="swatch"
            style={{ background: hex }}
            title={label}
            aria-label={`${ROW_LABELS[name]}: ${label}`}
            aria-pressed={hex === value}
            onClick={() => onChange(hex)}
          />
        ))}
        <label className="swatch swatch-custom" title="Özel renk" aria-pressed={!known} style={known ? undefined : { background: value }}>
          <input type="color" value={value} aria-label={`${ROW_LABELS[name]}: özel renk`} onChange={(e) => onChange(e.target.value)} />
        </label>
      </div>
    </div>
  );
}

type Theme = 'dark' | 'light';

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('atom-humans-theme', next);
    } catch {
      /* private mode: the choice lasts the visit */
    }
  };
  return [theme, toggle] as const;
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const light = theme === 'light';
  return (
    <button className="theme" onClick={onToggle} aria-label={light ? 'Koyu temaya geç' : 'Açık temaya geç'} title={light ? 'Koyu tema' : 'Açık tema'}>
      {light ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}

interface PropLine {
  key: string;
  /* the prop's name and value; strings are quoted, anything else goes in braces */
  name: string;
  value: string | number | boolean;
  on: boolean;
}

const propText = (l: PropLine) => (typeof l.value === 'string' ? `${l.name}="${l.value}"` : `${l.name}={${l.value}}`);

/* one prop, coloured like GitHub's own theme */
function PropTokens({ line }: { line: PropLine }) {
  return (
    <>
      <span className="tok-attr">{line.name}</span>
      <span className="tok-punct">=</span>
      {typeof line.value === 'string' ? (
        <span className="tok-string">"{line.value}"</span>
      ) : (
        <>
          <span className="tok-punct">{'{'}</span>
          <span className="tok-number">{String(line.value)}</span>
          <span className="tok-punct">{'}'}</span>
        </>
      )}
    </>
  );
}

/* the snippet, one line per prop; a prop line opens and closes on its own,
   so the block grows a line at a time instead of jumping */
function Snippet({ lines }: { lines: PropLine[] }) {
  /* a closing line keeps its last value while it folds away: each open
     line's value is remembered as it renders (React's way of adjusting
     state from props, no effect needed) */
  const [last, setLast] = useState<Record<string, PropLine>>({});
  const stale = lines.filter((l) => l.on && last[l.key]?.value !== l.value);
  if (stale.length) setLast({ ...last, ...Object.fromEntries(stale.map((l) => [l.key, l])) });
  return (
    <pre className="code">
      <code>
        <span className="code-line">
          <span className="tok-punct">{'<'}</span>
          <span className="tok-tag">AtomHuman</span>
        </span>
        {lines.map((l) => (
          <span key={l.key} className="code-prop" data-open={l.on}>
            <span className="code-prop-inner">
              {'  '}
              <PropTokens line={l.on ? l : last[l.key] ?? l} />
            </span>
          </span>
        ))}
        <span className="code-line tok-punct">{'/>'}</span>
      </code>
    </pre>
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) =>
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1400);
    }, () => {});
  return [copied, copy] as const;
}

export default function App() {
  const [state, setState] = useState<AtomHumanState>(atomHumanStates.includes(q.get('state') as AtomHumanState) ? q.get('state') as AtomHumanState : 'idle');
  const [form, setFormState] = useState<AtomHumanForm>(atomHumanForms.includes(q.get('form') as AtomHumanForm) ? q.get('form') as AtomHumanForm : 'human');
  const [view, setView] = useState<'body' | 'face'>(q.get('view') === 'face' ? 'face' : 'body');
  const [colors, setColors] = useState<Colors>(DEFAULTS);
  const [speed, setSpeed] = useState(1);
  const [halo, setHalo] = useState(!q.has('nohalo'));
  const [paused, setPaused] = useState(q.has('paused'));
  const [copied, copy] = useCopy();
  const [theme, toggleTheme] = useTheme();
  const size = useStageSize();
  const setForm = (s: AtomHumanForm) => {
    setFormState(s);
    const u = new URL(location.href);
    u.searchParams.set('form', s);
    history.replaceState(null, '', u);
  };
  const changed = colors.color !== DEFAULTS.color || colors.accentColor !== DEFAULTS.accentColor || colors.faceColor !== DEFAULTS.faceColor || speed !== 1 || paused || !halo || view !== 'body';
  const lines: PropLine[] = [
    { key: 'form', name: 'form', value: form, on: true },
    { key: 'state', name: 'state', value: state, on: true },
    { key: 'view', name: 'view', value: view, on: view === 'face' },
    { key: 'paused', name: 'paused', value: paused, on: paused },
    { key: 'color', name: 'color', value: colors.color, on: colors.color !== DEFAULTS.color },
    { key: 'accentColor', name: 'accentColor', value: colors.accentColor, on: colors.accentColor !== DEFAULTS.accentColor },
    { key: 'faceColor', name: 'faceColor', value: colors.faceColor, on: colors.faceColor !== DEFAULTS.faceColor },
    { key: 'speed', name: 'speed', value: speed, on: speed !== 1 },
    { key: 'halo', name: 'halo', value: halo, on: !halo },
  ];
  const snippet = `<AtomHuman\n${lines.filter((l) => l.on).map((l) => `  ${propText(l)}\n`).join('')}/>`;

  return (
    <div className="app">
      <Dock form={form} onChange={setForm} colors={colors} halo={halo} paused={paused} speed={speed} />

      <header className="masthead">
        <div className="byline">
          <span className="brand-orbit" aria-hidden>✧</span>
          <span className="name">atom humans</span>
          <span className="edition">yıldız tozundan insana</span>
        </div>
        <div className="masthead-end">
          <span className="project-note">Human × Robot Heads</span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="stage" aria-label="Atom insan önizlemesi">
        <AtomHuman form={form} state={state} size={size} view={view} seed={0.42} paused={paused} speed={speed} halo={halo} {...colors} />
        <div className="caption">
          <h1 className="font-bold">{stateLabels[state]}</h1>
          <p>{stateHints[state]}</p>
          <span className="interaction-hint">İmleci takip eder · Tepki için karaktere tıkla</span>
        </div>
      </main>

      <aside className="controls" aria-label="Kontroller">
        {(Object.keys(SWATCHES) as Array<keyof Colors>).map((key) => (
          <Swatches key={key} name={key} value={colors[key]} onChange={(v) => setColors((c) => ({ ...c, [key]: v }))} />
        ))}

        <div className="control">
          <div className="control-head">
            <span className="control-label">Atom halkası</span>
          </div>
          <div className="segments" role="group" aria-label="Atom halkası">
            {[true, false].map((v) => (
              <button key={String(v)} className="segment" aria-pressed={v === halo} onClick={() => setHalo(v)}>
                {v ? 'Açık' : 'Kapalı'}
              </button>
            ))}
          </div>
        </div>

        <div className="control">
          <div className="control-head"><span className="control-label">Görünüm</span></div>
          <div className="segments" role="group" aria-label="Görünüm">
            <button className="segment" aria-pressed={view === 'body'} onClick={() => setView('body')}>Tam beden</button>
            <button className="segment" aria-pressed={view === 'face'} onClick={() => setView('face')}>Yüz detayı</button>
          </div>
        </div>

        <div className="control">
          <div className="control-head">
            <span className="control-label">Hız</span>
            <button className="text-button" onClick={() => setPaused(!paused)}>{paused ? 'Oynat' : 'Durdur'}</button>
          </div>
          <div className="segments" role="group" aria-label="Hız">
            {SPEEDS.map((v) => (
              <button key={v} className="segment" aria-pressed={v === speed} onClick={() => setSpeed(v)}>
                {v}×
              </button>
            ))}
          </div>
        </div>

        <div className="control">
          <div className="control-head">
            <span className="control-label">Bileşen</span>
            <span className="control-actions">
              <button
                className="text-button reset"
                aria-hidden={!changed}
                tabIndex={changed ? 0 : -1}
                onClick={() => {
                  setColors(DEFAULTS);
                  setSpeed(1);
                  setHalo(true);
                  setPaused(false);
                  setView('body');
                }}
              >
                Sıfırla
              </button>
              <button className="text-button" onClick={() => copy('snippet', snippet)}>{copied === 'snippet' ? 'Kopyalandı' : 'Kopyala'}</button>
            </span>
          </div>
          <Snippet lines={lines} />
        </div>
      </aside>

      <nav className="states" aria-label="Animasyon durumu">
        {atomHumanStates.map((s) => (
          <button key={s} className="state" aria-pressed={s === state} onClick={() => setState(s)}>
            <span className="state-head">
              <AtomHuman form={form} state={s} size={88} paused={paused} speed={speed} halo={halo} interactive={false} aria-hidden seed={0.42} {...colors} />
            </span>
            <span className="state-name">{stateLabels[s]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

