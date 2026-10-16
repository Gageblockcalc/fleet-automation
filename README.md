# fleet-automation
Free, reusable CI for Nick's sites. Nothing here posts publicly, sends messages, or spends money.
- `.github/workflows/smoke.yml` — reusable Playwright smoke: loads, console clean, exactly one Buy Me a Coffee link, footer, version label (desktop + phone).
- `.github/workflows/link-audit.yml` — reusable lychee broken-link audit.
- `.github/workflows/npm-audit.yml` — reusable `npm audit` (high+).
- `fleet-nightly.yml` / `fleet-weekly-links.yml` — run the above across the fleet (this repo is public → free minutes). Override the URL list with repo variable `FLEET_SITES` (JSON array).
- `actions/version-bump` — `<major.minor>.<run#>+<sha7>.<date>` for repos that deploy from CI.
- `actions/indexnow` — IndexNow ping (Bing/Yandex). Google's sitemap ping is retired; use Search Console. Key file: `scripts/indexnow-key.sh <public_dir>`.
- `templates/` — dependabot + per-repo smoke caller + deploy example.
