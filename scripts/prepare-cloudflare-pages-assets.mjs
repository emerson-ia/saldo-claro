import { cpSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const source = process.argv[2] ?? 'dist-cloudflare';
const target = process.argv[3] ?? 'dist-pages';

if (!existsSync(source)) {
  throw new Error(`Build não encontrado: ${source}`);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

const oldAssetsPath = join(target, 'assets', 'node_modules');
const newAssetsPath = join(target, 'assets', 'modules');

if (existsSync(oldAssetsPath)) {
  renameSync(oldAssetsPath, newAssetsPath);
}

let rewrittenFiles = 0;

function rewriteReferences(directory) {
  for (const entry of readdirSync(directory)) {
    const file = join(directory, entry);
    const stats = statSync(file);

    if (stats.isDirectory()) {
      rewriteReferences(file);
      continue;
    }

    if (!/\.(?:html|js|css|json)$/i.test(entry)) continue;

    const content = readFileSync(file, 'utf8');
    const updated = content.replaceAll('assets/node_modules/', 'assets/modules/');
    if (updated !== content) {
      writeFileSync(file, updated);
      rewrittenFiles += 1;
    }
  }
}

rewriteReferences(target);
console.log(`Pacote Pages pronto: ${target} (${rewrittenFiles} arquivo(s) com referências ajustadas).`);
