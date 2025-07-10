import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('src/worker-configuration.d.ts')) {
  console.log('worker-configuration.d.ts not found, running cf-typegen...');
  execSync('pnpm run cf-typegen', { stdio: 'inherit' });
} else {
  console.log('worker-configuration.d.ts exists, skipping cf-typegen.');
}