# FIND Neuro Website

Marketing website for [FIND Neuro](https://findneuro.com) - precision neurosurgery decision support platform. Features an interactive 3D brain visualization built with Three.js on the Colin27 atlas.

## Tech Stack

- **Vite** - build tool with HMR dev server
- **TypeScript** - strict mode, ES2020 target
- **Three.js r134** - loaded via CDN with SRI hash (not bundled)
- **GitHub Pages** - deployment via `peaceiris/actions-gh-pages`

## Project Structure

```
src/
  index.html              # HTML template (no inline CSS/JS)
  styles/main.css         # All styles (~1,100 lines)
  ts/
    main.ts               # Entry point - wires all modules together
    types.ts              # Interfaces, enums (AliceMode, CNMode)
    constants.ts          # Named constants (network, camera, particles, etc.)
    scene.ts              # Three.js scene, camera, renderer, lighting
    brain.ts              # Colin27 mesh, subcortical structures, electrodes
    network.ts            # Epileptogenic network graph, BFS spike propagation
    interaction.ts        # Drag-to-rotate, click/touch handlers, mouse glow
    alice.ts              # Alice's seizure story 3-phase visualization
    cn.ts                 # Critical Nodes interactive (electrodes, connectivity, criticality)
    animation.ts          # Render loop, visibility observer, auto-spike triggers
    ui.ts                 # Nav, contact form, CTA switcher, scroll reveals
    background.ts         # 2D canvas neural particle background
public/                   # Static assets copied to dist/
brain_data.js             # Colin27 brain mesh data (~2.8 MB)
preprocess_brain.py       # Generates brain_data.js from FreeSurfer files
```

## Development

```bash
npm install
npm run dev       # Start dev server with HMR
npm run build     # Type-check + production build to dist/
npm run preview   # Preview production build locally
npm run lint      # TypeScript type-check only (tsc --noEmit)
```

## Architecture

- **Three.js stays on CDN** with SRI hash for security. TypeScript types from `@types/three@0.134` (dev-only).
- **`brain_data.js`** is loaded via `<script defer>` in `<head>` and accessed as `window.BRAIN`.
- **State is passed as parameters** between modules (no global singletons). Each module exports setup functions that receive dependencies and return state objects.
- **No framework** - this is a static marketing page, not an app.

## CI/CD Workflows

Seven GitHub Actions workflows automate build, deploy, and quality checks.

### Build & Deploy (`build-deploy.yml`)
Runs on every push to `main` (ignoring docs/markdown changes). Installs dependencies, type-checks with `tsc --noEmit`, builds with Vite, and deploys `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages@v4`.

### TypeScript Lint (`lint.yml`)
Runs on push to `main` and pull requests. Two steps:
- **Type-check** - `tsc --noEmit` for strict TypeScript validation
- **Accessibility audit** - `axe-core` against the live site (continue-on-error, using `browser-driver-manager` for Chrome compatibility)

### Security Scan (`security.yml`)
Runs on push to `main` and weekly (Monday 6am UTC). Four checks:
- **npm audit** - checks dev dependencies for known vulnerabilities
- **TruffleHog** - scans for accidentally committed secrets
- **OSV API** - checks Three.js r134 against the Open Source Vulnerability database
- **SRI verification** - downloads Three.js from CDN and verifies the integrity hash matches `src/index.html`

### Lighthouse CI (`lighthouse.yml`)
Runs on push to `main` and pull requests. Audits the live site against performance budgets defined in `.github/lighthouse-budget.json`:
- FCP <= 3000ms, LCP <= 4000ms, TTI <= 5000ms
- Script resources <= 3600 KB (Three.js + brain_data.js + app bundle)
- Total resources <= 6000 KB

### Link Checker (`links.yml`)
Runs on push to `main` and weekly (Monday 9am UTC). Uses `lychee` to scan all HTML files for broken links.

### Uptime Check (`uptime.yml`)
Runs every 30 minutes. Curls `https://findneuro.com` and fails if the response is not HTTP 200.

### Optimize Images (`optimize-images.yml`)
Runs on push to `main` when `assets/**` files change. Compresses JPEGs with `jpegoptim` (max 85% quality) and PNGs with `optipng`, then auto-commits the optimized files.

## GitHub Pages Configuration

- **Source**: `gh-pages` branch (deployed by `build-deploy.yml`)
- **Custom domain**: `findneuro.com` (CNAME file included in deploy)
- **HTTPS**: enforced by GitHub Pages (HSTS included)

## Security

- **Content Security Policy** - restrictive CSP via `<meta>` tag. `script-src` limited to `self`, CDN, and analytics domains. `unsafe-inline` required for GA/LinkedIn tracking snippets.
- **Subresource Integrity** - Three.js CDN script includes `integrity` hash verified on every load and in CI.
- **Referrer Policy** - `strict-origin-when-cross-origin` via `<meta>` tag.
- **Clickjacking protection** - JavaScript frame-busting in `main.ts` (since `frame-ancestors` CSP directive is not supported in `<meta>` tags).
- **Dependency auditing** - `npm audit` runs in CI on every push and weekly.
- **Secret scanning** - TruffleHog checks for leaked credentials on every push and weekly.
- **HTTPS only** - `upgrade-insecure-requests` in CSP. GitHub Pages enforces HSTS.

## Performance

The site loads a ~2.8 MB brain mesh data file for the 3D visualization. Optimizations:

- **Deferred script loading** - Three.js and `brain_data.js` use `<script defer>` in `<head>`, starting download immediately while not blocking first paint.
- **CDN preconnect** - `<link rel="preconnect">` for fonts and Three.js CDN to reduce connection latency.
- **Gzip compression** - GitHub Pages serves all assets with gzip. `brain_data.js` compresses from ~2.8 MB to ~816 KB.
- **Mesh decimation** - `preprocess_brain.py` reduces the Colin27 atlas from ~300K vertices to ~36K using spatial hashing (cell size 2.8mm cortex, 1.8mm subcortical).
- **Reduced float precision** - vertex coordinates rounded to 2 decimal places (sufficient for normalized [-1.5, 1.5] range at screen resolution).
- **Visibility observer** - Three.js rendering pauses when the brain canvas scrolls out of view.
- **Image optimization** - automated compression via CI workflow on asset changes.
