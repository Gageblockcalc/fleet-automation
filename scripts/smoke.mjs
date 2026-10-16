// Fleet smoke test: page loads, console clean, exactly one Buy Me a Coffee link, footer present, version label present.
// Usage: node scripts/smoke.mjs <url> [--bmc=1|0|any] [--version=required|optional] [--footer=required|optional]
import { chromium } from 'playwright';
const url = process.argv[2];
const opt = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, '').split('=')));
const bmcWant = opt.bmc ?? '1', verWant = opt.version ?? 'required', footWant = opt.footer ?? 'required';
const IGNORE = [/favicon/i, /Failed to load resource.*(404|net::ERR_BLOCKED_BY_CLIENT)/i, /googletagmanager|google-analytics|doubleclick|adsbygoogle|pagead2/i, /\[Report Only\]/i, /cloudflareinsights|beacon\.min\.js/i];
const browser = await chromium.launch();
const results = []; let failed = false;
for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, userAgent: name === 'phone' ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 FleetSmoke' : undefined });
  const page = await ctx.newPage(); const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.some((r) => r.test(m.text()))) errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 200)));
  let status = 0;
  try { const r = await page.goto(url, { waitUntil: 'load', timeout: 45000 }); status = r ? r.status() : 0; } catch (e) { errors.push('goto: ' + e.message.slice(0, 120)); }
  await page.waitForTimeout(4000); // let the hub embed + footers render
  const info = await page.evaluate(() => {
    const bmc = [...document.querySelectorAll('a[href]')].filter((a) => /buymeacoffee\.com|buymeacoff\.ee/i.test(a.href));
    const uniq = new Set(bmc.filter((a) => a.offsetParent !== null || getComputedStyle(a).display !== 'none').map((a) => a.href.replace(/[?#].*$/, '').replace(/\/$/, '')));
    const footer = !!document.querySelector('footer, [role=contentinfo], #nick-hub-also, .site-footer, #footer');
    const text = document.body ? document.body.innerText : '';
    const ver = /\bv(ersion)?\s?\d+\.\d+(\.\d+)?/i.test(text) || !!document.querySelector('[data-version], meta[name=version], meta[name="app-version"], #app-version, .app-version');
    return { title: document.title, bmcLinks: bmc.length, bmcVisible: uniq.size, footer, ver };
  });
  const checks = {
    loads: status > 0 && status < 400,
    consoleClean: errors.length === 0,
    bmc: bmcWant === 'any' ? true : bmcWant === '0' ? info.bmcVisible === 0 : info.bmcVisible === 1,
    footer: footWant === 'optional' || info.footer,
    versionLabel: verWant === 'optional' || info.ver,
  };
  const ok = Object.values(checks).every(Boolean); if (!ok) failed = true;
  results.push({ viewport: name, status, ok, checks, title: info.title, bmcLinks: info.bmcLinks, bmcVisible: info.bmcVisible, errors });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ url, results }, null, 2));
if (process.env.GITHUB_STEP_SUMMARY) {
  const fs = await import('node:fs');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Smoke: ${url}\n| viewport | ok | loads | console | 1 BMC | footer | version |\n|---|---|---|---|---|---|---|\n` +
    results.map((r) => `| ${r.viewport} | ${r.ok ? '✅' : '❌'} | ${r.checks.loads ? '✅' : `❌ ${r.status}`} | ${r.checks.consoleClean ? '✅' : '❌ ' + r.errors.length} | ${r.checks.bmc ? '✅' : `❌ ${r.bmcVisible}`} | ${r.checks.footer ? '✅' : '❌'} | ${r.checks.versionLabel ? '✅' : '❌'} |`).join('\n') +
    '\n' + results.flatMap((r) => r.errors.map((e) => `- ${r.viewport}: \`${e.replace(/`/g, "'")}\``)).join('\n') + '\n');
}
process.exit(failed ? 1 : 0);
