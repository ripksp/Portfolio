import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../aegis');

if (fs.existsSync(outDir)) {
  for (const entry of fs.readdirSync(outDir)) {
    // Always preserve .htaccess so Apache CSP & MIME rules survive builds
    if (entry === '.htaccess') continue;
    fs.rmSync(path.join(outDir, entry), { recursive: true, force: true });
  }
}
