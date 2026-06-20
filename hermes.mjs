#!/usr/bin/env node
// CLI do Hermes para a equipe: `hermes login` guarda o token de sessão do usuário (Supabase Auth)
// em ~/.hermes/session.json. As skills leem esse token e chamam o corretor (/api/*) por ele.
// Valores públicos embutidos (seguros): URL do Supabase + chave publishable. NENHUM segredo aqui.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const SUPABASE_URL = 'https://cyxsmgaggftoxfmfocvu.supabase.co';
const SUPABASE_PUBLISHABLE = 'sb_publishable_L0IcJbr8FaWkv6GQ3fxv8A_wjl67cdM';
const HERMES_API = process.env.HERMES_API || 'https://socialmedia.janvalellam.com.br';
const DIR = path.join(os.homedir(), '.hermes');
const SESSION = path.join(DIR, 'session.json');
// onde as skills vivem na máquina (Claude Code). Override: HERMES_SKILLS_DIR
const SKILLS_DIR = process.env.HERMES_SKILLS_DIR || path.join(os.homedir(), '.claude', 'skills');

function ask(q, hidden = false) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    if (hidden) { rl.input.on('data', () => { rl.output.write('\x1b[2K\r' + q); }); }
    rl.question(q, a => { rl.close(); resolve(a.trim()); });
  });
}

async function login() {
  const email = process.env.HERMES_EMAIL || await ask('Email: ');
  const password = process.env.HERMES_PASSWORD || await ask('Senha: ', true);
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) { console.error('\nFalha no login:', j.error_description || j.msg || r.status); process.exit(1); }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(SESSION, JSON.stringify({ access_token: j.access_token, refresh_token: j.refresh_token, saved_at: new Date().toISOString() }, null, 2), { mode: 0o600 });
  console.log('\n✅ Login salvo em', SESSION);
  await whoami();
}

export function readToken() {
  try { return JSON.parse(fs.readFileSync(SESSION, 'utf8')).access_token; } catch { return null; }
}

async function whoami() {
  const token = readToken();
  if (!token) { console.error('Sem sessão. Rode: node hermes.mjs login'); process.exit(1); }
  const r = await fetch(`${HERMES_API}/api/me`, { headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json();
  if (!r.ok) { console.error('Erro:', j.error || r.status); process.exit(1); }
  console.log(`Você é ${j.member.name} (${j.member.access_level}). Pode: ${j.caps.join(', ')}`);
}

// baixa a versão mais nova das skills do servidor e grava localmente
async function update() {
  const token = readToken();
  if (!token) { console.error('Sem sessão. Rode: node hermes.mjs login'); process.exit(1); }
  const r = await fetch(`${HERMES_API}/api/skills`, { headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json();
  if (!r.ok) { console.error('Erro:', j.error || r.status); process.exit(1); }
  let n = 0;
  for (const s of (j.skills || [])) {
    const dir = path.join(SKILLS_DIR, s.name);
    const f = path.join(dir, 'SKILL.md');
    const old = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    if (old !== s.content) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, s.content); console.log('atualizada:', s.name, 'v' + s.version); n++; }
  }
  console.log(n ? `\n✅ ${n} skill(s) atualizada(s) em ${SKILLS_DIR}` : 'Tudo já está na versão mais nova.');
}

// admin: sobe as skills locais (fonte) pro servidor, virando a versão oficial
async function publish() {
  const token = readToken();
  if (!token) { console.error('Sem sessão. Rode: node hermes.mjs login'); process.exit(1); }
  const SRC = process.env.HERMES_SKILLS_SRC || SKILLS_DIR;
  if (!fs.existsSync(SRC)) { console.error('Pasta de skills não encontrada:', SRC); process.exit(1); }
  const names = fs.readdirSync(SRC).filter(d => fs.existsSync(path.join(SRC, d, 'SKILL.md')));
  for (const name of names) {
    const content = fs.readFileSync(path.join(SRC, name, 'SKILL.md'), 'utf8');
    const r = await fetch(`${HERMES_API}/api/skills`, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, content }) });
    const j = await r.json();
    console.log(r.ok ? `publicada ${name} v${j.version}` : `erro ${name}: ${j.error || r.status}`);
  }
}

// cliente genérico do corretor: lê o token salvo e faz a chamada, imprimindo o JSON cru.
// uso: node hermes.mjs api <GET|POST|...> <rota> [jsonBody]   (rota sem barra inicial: "tarefas", "config/log?key=x")
// a rota vai SEM a barra inicial de propósito: no Git Bash do Windows um "/rota" vira caminho (MSYS path mangling).
async function api(method, p, bodyJson) {
  const token = readToken();
  if (!token) { console.error('Sem sessão. Rode: node hermes.mjs login'); process.exit(1); }
  if (!method || !p) { console.error('Uso: node hermes.mjs api <METODO> <rota sem barra> [json]'); process.exit(1); }
  const route = p.startsWith('/') ? p : '/' + p;
  const opts = { method: method.toUpperCase(), headers: { Authorization: 'Bearer ' + token } };
  if (bodyJson) { opts.headers['Content-Type'] = 'application/json'; opts.body = bodyJson; }
  const r = await fetch(`${HERMES_API}/api${route}`, opts);
  const text = await r.text();
  process.stdout.write(text);
  if (!r.ok) process.exit(1);
}

const cmd = process.argv[2];
if (cmd === 'login') await login();
else if (cmd === 'whoami') await whoami();
else if (cmd === 'update') await update();
else if (cmd === 'publish') await publish();
else if (cmd === 'api') await api(process.argv[3], process.argv[4], process.argv[5]);
else console.log('Uso: node hermes.mjs <login|whoami|update|publish|api>');
