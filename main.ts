// Sunset Cover Studio for gta6-cover-art-01 (Node 22, standard library only).
//
// The entry is a plain static web app: app/index.html plus its ES modules, a vendored
// display font and two sample photos, all of which a desktop browser loads with no
// network request. This program hands the app in: it copies app/ and screenshots/ from
// beside this file into /output and writes /output/dossier.json, the summary the judge
// reads, using the vendored make.fun library.
//
// Try it locally with `node serve.ts` (http://localhost:8080), then hand it in with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The entry is not an entry without its app: refuse loudly instead of handing in an
// empty /output if app/ is missing.
if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error(`app/index.html not found beside ${import.meta.url}`);
}

// Copy the app first, then the screenshots beside it, so /output holds exactly the
// entry the screenshots were taken of.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps, from the kit's gate: the dossier text is capped at 160 KiB,
// screenshots at 4 files of 256 KiB each, app/ at 993 files and 48 MiB in all.
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`handed in ${outputDir} (dossier ${dossierPath})`);
