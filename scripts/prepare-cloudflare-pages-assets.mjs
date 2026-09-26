import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

// Cloudflare Pages treats dependency-like paths as application routes in some
// deployments. Keep icon fonts at a plain static path so MaterialIcons loads
// as a font file rather than receiving index.html from the SPA fallback.
const materialIconsSource = join(
  newAssetsPath,
  '@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf',
);
const materialIconsTarget = join(target, 'assets', 'fonts', 'MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf');

if (existsSync(materialIconsSource)) {
  mkdirSync(join(target, 'assets', 'fonts'), { recursive: true });
  cpSync(materialIconsSource, materialIconsTarget);
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
    const updated = content
      .replaceAll('assets/node_modules/', 'assets/modules/')
      .replaceAll(
        '/assets/modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf',
        '/assets/fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf',
      );
    if (updated !== content) {
      writeFileSync(file, updated);
      rewrittenFiles += 1;
    }
  }
}

rewriteReferences(target);
console.log(`Pacote Pages pronto: ${target} (${rewrittenFiles} arquivo(s) com referências ajustadas).`);
