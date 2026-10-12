const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

// Load the actual TypeScript geometry and rig without a browser or another dependency.
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports: {}};
  new Function('module', 'exports', source)(module, module.exports);
  return module.exports;
}
const {generateHuman} = load('src/particles/geometry.ts');
const {HumanSim} = load('src/particles/sim.ts');
const forms = ['human', 'slender', 'athletic', 'youth'];
const states = ['idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping'];

for (const form of forms) test(`${form}: finite anatomy and facial atoms at both sampling sizes`, () => {
  for (const count of [950, 6500]) {
    const atoms = generateHuman(form, count, 0.42);
    assert(atoms.length > count * 0.9 && atoms.length < count * 1.2);
    for (const atom of atoms) {
      for (const field of ['x','y','z','phase','size','tone']) assert(Number.isFinite(atom[field]), `${form}: ${field}`);
      assert(Math.abs(atom.x) < 1.6 && atom.y > -2.1 && atom.y < 2.1 && Math.abs(atom.z) < 1.6);
    }
    for (const group of ['body', 'head', 'eye', 'mouth', 'brow', 'ring']) assert(atoms.some(a => a.group === group), group);
    assert(atoms.some(a => a.group === 'head' && a.z > 0.25), 'The nose projects in front of the facial plane');
    assert(atoms.some(a => a.group === 'eye' && a.side === -1));
    assert(atoms.some(a => a.group === 'eye' && a.side === 1));
  }
});
test('a stable seed preserves atom layout; a new seed creates a different layout', () => {
  assert.deepEqual(generateHuman('human', 950, 0.42), generateHuman('human', 950, 0.42));
  assert.notDeepEqual(generateHuman('human', 950, 0.42), generateHuman('human', 950, 0.43));
});
test('human forms have different body proportions', () => {
  const widths = forms.map(form => Math.max(...generateHuman(form, 6500, 0.42).filter(a => a.group === 'body').map(a => Math.abs(a.x))));
  assert(widths[2] > widths[0] && widths[0] > widths[1]);
});
test('all nine states and click reactions keep the spring rig stable at 2× speed', () => {
  const sim = new HumanSim(0.42, 'idle');
  for (const state of states) {
    sim.setState(state); sim.pointer = {x: 200, y: -100};
    for (let i = 0; i < 600; i++) {
      if (i === 60) sim.poke();
      sim.update(2 / 60);
      for (const value of Object.values(sim.pose)) assert(Number.isFinite(value));
      assert(Math.abs(sim.pose.yaw) < 8 && Math.abs(sim.pose.pitch) < 1 && sim.pose.sy > 0.5 && sim.pose.sy < 1.5);
    }
    assert.equal(sim.shown, state);
  }
});
test('a click produces a visible jump and a full turn', () => {
  const sim = new HumanSim(0.42, 'idle');
  sim.poke(); let lift = 0, turn = 0;
  for (let i = 0; i < 120; i++) {
    sim.update(1 / 120); lift = Math.max(lift, sim.pose.lift); turn = Math.max(turn, Math.abs(sim.pose.yaw));
  }
  assert(lift > 0.15); assert(turn > Math.PI);
});
