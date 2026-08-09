import { access, cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Copies Monaco's built assets into `public/monaco` so the editor is served
 * from our own origin.
 *
 * `@monaco-editor/react` otherwise pulls Monaco from a public CDN at runtime.
 * The editor is the core of a match, so a blocked or unavailable CDN would take
 * the whole product down — worth the copied files to avoid.
 *
 * Output is gitignored and regenerated on every build.
 */
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Walks up looking for `node_modules/monaco-editor`. `require.resolve` doesn't
 * work here: Monaco's exports map deliberately hides package.json, and npm
 * hoists the package to the workspace root rather than the web app.
 */
async function findMonacoRoot() {
  let dir = here;
  for (let depth = 0; depth < 6; depth++) {
    const candidate = join(dir, 'node_modules', 'monaco-editor');
    try {
      await access(join(candidate, 'min', 'vs'));
      return candidate;
    } catch {
      // Not here — keep walking up.
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not locate monaco-editor. Run `npm install` first.');
}

const source = join(await findMonacoRoot(), 'min', 'vs');
const destination = join(here, '..', 'public', 'monaco', 'vs');

await rm(destination, { recursive: true, force: true });
await mkdir(dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });

console.log(`Copied Monaco assets -> ${destination}`);
