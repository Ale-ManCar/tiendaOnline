const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const candidates = [join(__dirname, '..', 'dist', 'main.js'), join(__dirname, '..', 'dist', 'src', 'main.js')];
const entry = candidates.find((file) => existsSync(file));

if (!entry) {
  console.error('Could not find the compiled API entrypoint. Run npm run build first.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [entry], { stdio: 'inherit' });
process.exit(result.status ?? 1);
