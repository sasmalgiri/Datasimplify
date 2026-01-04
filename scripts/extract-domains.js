const fs = require('fs');
const path = require('path');

const roots = ['src', 'scripts'];
const exts = new Set(['.ts', '.tsx', '.js', '.mjs']);

/** @type {string[]} */
const urls = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p);
      continue;
    }
    if (!exts.has(path.extname(ent.name))) continue;

    const s = fs.readFileSync(p, 'utf8');
    const re = /https?:\/\/[^\s"'\)\]]+/g;
    let m;
    while ((m = re.exec(s))) urls.push(m[0]);
  }
}

for (const r of roots) {
  if (fs.existsSync(r)) walk(r);
}

const domains = new Map();
for (const u of urls) {
  try {
    const host = new URL(u).hostname.toLowerCase();
    domains.set(host, (domains.get(host) || 0) + 1);
  } catch {
    // ignore
  }
}

const sorted = [...domains.entries()].sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({ uniqueDomains: sorted.length, domains: sorted }, null, 2));
