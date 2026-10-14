// Copies the current classify.js and examples into demo/index.html.
// Run after changing the logic: node demo/build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');

const examples = Object.fromEntries(readdirSync(new URL('examples/', root))
  .filter(f => f.endsWith('.json')).sort()
  .map(f => [f.replace('.json', ''), JSON.parse(read(`examples/${f}`))]));

const fill = (html, tag, value) =>
  html.replace(new RegExp(`/\\*${tag}_START\\*/[\\s\\S]*?/\\*${tag}_END\\*/`), () => `/*${tag}_START*/${value}/*${tag}_END*/`);

let html = read('demo/index.html');
html = fill(html, 'CLASSIFY', JSON.stringify(read('classify.js')));
html = fill(html, 'EXAMPLES', JSON.stringify(examples, null, 2));
writeFileSync(new URL('demo/index.html', root), html);
console.log('demo/index.html updated');
