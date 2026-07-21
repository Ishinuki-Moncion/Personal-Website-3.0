import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const vnu = fileURLToPath(new URL('../node_modules/vnu-jar/vnu-jar.js', import.meta.url));
const result = spawnSync(process.execPath, [vnu, '--errors-only', 'index.html', '404.html'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
