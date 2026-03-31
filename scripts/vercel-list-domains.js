/**
 * Vercel proje domain'lerini listele
 */
const fs = require('fs');
const path = require('path');

function getToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const authPath = path.join(
    process.env.APPDATA || process.env.HOME,
    'com.vercel.cli',
    'Data',
    'auth.json'
  );
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  return auth.token;
}

async function listDomains(token, project) {
  const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/domains?teamId=team_cTEz2msbG47YPdfR9fK0cJ2v`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function main() {
  const token = getToken();
  const projects = ['yisa-s-app', 'yisa-s-website'];
  for (const p of projects) {
    const data = await listDomains(token, p);
    console.log(`\n${p}:`, data ? JSON.stringify(data, null, 2).slice(0, 500) : '404');
  }
}

main().catch(console.error);
