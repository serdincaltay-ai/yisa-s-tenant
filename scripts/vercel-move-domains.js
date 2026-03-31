/**
 * Vercel domain taşıma — v0-report-current-status → yisa-s-app
 * Kullanım: node scripts/vercel-move-domains.js
 * Token: VERCEL_TOKEN env veya %APPDATA%\com.vercel.cli\Data\auth.json
 */
const fs = require('fs');
const path = require('path');

// v0-report-current-status projesi listede yok; yisa-s-website tanıtım sitesi olabilir
const SOURCE_PROJECT = process.env.VERCEL_SOURCE_PROJECT || 'yisa-s-website';
const TARGET_PROJECT_ID = 'prj_sWeroWACyilNnYqLYCamnA5XNm1M'; // yisa-s-app
const DOMAINS = ['yisa-s.com', 'www.yisa-s.com'];

function getToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const authPath = path.join(
    process.env.APPDATA || process.env.HOME,
    'com.vercel.cli',
    'Data',
    'auth.json'
  );
  try {
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    return auth.token;
  } catch (e) {
    console.error('Token bulunamadı. VERCEL_TOKEN env veya vercel login gerekli.');
    process.exit(1);
  }
}

async function moveDomain(token, domain) {
  const url = `https://api.vercel.com/v1/projects/${encodeURIComponent(SOURCE_PROJECT)}/domains/${encodeURIComponent(domain)}/move?teamId=team_cTEz2msbG47YPdfR9fK0cJ2v`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId: TARGET_PROJECT_ID }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${err}`);
  }
  return res.json();
}

async function main() {
  const token = getToken();
  for (const domain of DOMAINS) {
    try {
      await moveDomain(token, domain);
      console.log(`✓ ${domain} → yisa-s-app taşındı`);
    } catch (e) {
      console.error(`✗ ${domain}: ${e.message}`);
    }
  }
}

main();
