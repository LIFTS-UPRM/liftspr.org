import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(resolve(root, '.github/workflows/deploy.yml'), 'utf8');

function job(name) {
  const start = workflow.indexOf(`  ${name}:\n`);
  assert.notEqual(start, -1, `${name} job exists`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-zA-Z0-9_-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

assert.match(workflow, /\npermissions: \{\}\n/, 'workflow denies token permissions by default');

const build = job('build');
assert.match(build, /\n    permissions:\n      contents: read\n/, 'build only needs repository read access');
assert.doesNotMatch(build, /\n      (pages|id-token): write\n/, 'build job cannot deploy or mint OIDC tokens');

const deploy = job('deploy');
assert.match(deploy, /\n    permissions:\n      pages: write\n      id-token: write\n/, 'deploy job owns Pages/OIDC permissions');

for (const line of workflow.matchAll(/^\s*uses: (actions\/[^@\s]+)@([^\s]+)$/gm)) {
  assert.match(line[2], /^[a-f0-9]{40}$/, `${line[1]} is pinned to a full commit SHA`);
}
