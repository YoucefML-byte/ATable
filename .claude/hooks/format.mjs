// PostToolUse hook: formats with Prettier the file Claude Code has just written or edited.
// Reads the JSON event on stdin; never fails (it must not block Claude Code).
import { spawnSync } from 'node:child_process';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(raw);
    const file = event?.tool_input?.file_path;
    if (typeof file === 'string' && /\.(ts|tsx|js|mjs|cjs|json|css|md)$/.test(file)) {
      spawnSync('pnpm', ['exec', 'prettier', '--write', '--ignore-unknown', file], {
        stdio: 'ignore',
        shell: process.platform === 'win32',
      });
    }
  } catch {
    // Deliberately silent: formatting is a comfort, not a condition.
  }
  process.exit(0);
});
