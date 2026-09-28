#!/usr/bin/env node
// ============================================================================
// 本地开发启动脚本（由 miaoda app sync 维护，请勿手改）
// Stack: nestjs-react-fullstack
// ============================================================================
const fs = require('node:fs');
const path = require('node:path');
const { execSync, spawn, spawnSync } = require('node:child_process');

process.chdir(path.resolve(__dirname, '..'));

function warn(msg) {
  if (process.stderr.isTTY) process.stderr.write(`\x1b[33mWARNING: ${msg}\x1b[0m\n`);
  else process.stderr.write(`WARNING: ${msg}\n`);
}

if (!process.env.MIAODA_APP_TYPE) process.env.MIAODA_APP_TYPE = '3';
process.env.MIAODA_LOCAL_DEV = '1';

console.log('[dev-local] (1/4) env pull...');
const hasLarkCli = spawnSync('command', ['-v', 'lark-cli'], { shell: true, stdio: 'ignore' }).status === 0;
if (hasLarkCli) {
  let appId = '';
  try {
    appId = JSON.parse(fs.readFileSync('.spark/meta.json', 'utf8')).app_id || '';
  } catch {}
  if (appId) {
    const r = spawnSync('lark-cli', ['apps', '+env-pull', '--app-id', appId, '--as', 'user'], {
      stdio: 'inherit',
    });
    if (r.status !== 0) warn('env pull 失败，继续按 .env.local 现状启动');
  } else {
    warn('.spark/meta.json 缺 app_id，请先跑 `miaoda app init --app-id <id>`');
  }
} else {
  warn('lark-cli 未安装，跳过 env pull；请确保 .env.local 已就绪');
}

console.log('[dev-local] (2/4) miaoda skills sync...');
try {
  execSync('npx -y @lark-apaas/miaoda-cli@latest skills sync --local', { stdio: 'inherit' });
} catch {
  console.log('  (skills sync 失败，继续启动)');
}

console.log('[dev-local] (3/4) loading .env / .env.local...');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (process.env.SUDA_WEBUSER) {
  const raw = process.env.SUDA_WEBUSER;
  try {
    JSON.parse(raw);
  } catch {
    try {
      const unescaped = raw.replace(/\\"/g, '"');
      JSON.parse(unescaped);
      process.env.SUDA_WEBUSER = unescaped;
    } catch {
      warn(`SUDA_WEBUSER 解析失败,值头部: ${raw.slice(0, 80)}...`);
    }
  }
}

console.log('[dev-local] (4/4) 并发起 dev:server + dev:client');
const child = spawn(
  'npx',
  ['--no-install', 'concurrently', '--names', 'server,client', '--prefix-colors', 'blue,green', '--kill-others-on-fail', 'npm run dev:server', 'npm run dev:client'],
  { stdio: 'inherit', env: process.env },
);
child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
