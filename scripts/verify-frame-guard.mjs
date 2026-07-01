import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(resolve(root, 'src/main.jsx'), 'utf8');
const fallback = readFileSync(resolve(root, 'public/404.html'), 'utf8');

function assertGuard(source, label) {
  assert.match(source, /window\.self === window\.top/, `${label} checks whether it is framed`);
  assert.match(source, /document\.documentElement\.style\.display = 'none'/, `${label} blanks framed content`);
  assert.match(source, /window\.top\.location = window\.location\.href/, `${label} attempts top-level navigation`);
}

function assertBefore(source, first, second, label) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  assert.notEqual(firstIndex, -1, `${label} contains ${first}`);
  assert.notEqual(secondIndex, -1, `${label} contains ${second}`);
  assert.ok(firstIndex < secondIndex, `${label} runs ${first} before ${second}`);
}

assertGuard(main, 'main app');
assertGuard(fallback, '404 fallback');
assertBefore(main, 'preventFramedRender();', 'createRoot(', 'main app');
assertBefore(fallback, 'preventFramedRender()', "window.location.replace('/?p='", '404 fallback');
