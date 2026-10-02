import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

try {
  console.log('\n🚀 Starting build process...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  const remoteUrl = execSync('git config --get remote.origin.url', { cwd: rootDir })
    .toString()
    .trim();

  if (!remoteUrl) {
    throw new Error('No git remote origin URL found.');
  }

  console.log(`\n📦 Pushing dist contents to branch "deploy" on ${remoteUrl}...`);

  execSync('git init', { cwd: distDir, stdio: 'inherit' });
  execSync('git checkout -B deploy', { cwd: distDir, stdio: 'inherit' });
  execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy production build [skip ci]"', { cwd: distDir, stdio: 'inherit' });
  execSync(`git push -f "${remoteUrl}" deploy`, { cwd: distDir, stdio: 'inherit' });

  const distGit = path.join(distDir, '.git');
  if (fs.existsSync(distGit)) {
    fs.rmSync(distGit, { recursive: true, force: true });
  }

  console.log('\n🎉 Successfully deployed built files to branch "deploy"!\n');
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}
