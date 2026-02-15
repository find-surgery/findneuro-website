# CLAUDE.md

## Build & Dev Commands

- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - TypeScript check + Vite production build to `dist/`
- `npm run lint` - TypeScript type-check only (`tsc --noEmit`)
- `npm run preview` - Preview production build locally

## Project Structure

This is a Vite + TypeScript project. Source lives in `src/`, builds to `dist/`.

- `src/index.html` - HTML template (no inline CSS or JS)
- `src/styles/main.css` - All CSS styles
- `src/ts/main.ts` - Entry point orchestrator that wires all modules
- `src/ts/types.ts` - All interfaces and enums (`AliceMode`, `CNMode`)
- `src/ts/constants.ts` - All magic numbers as named constants
- `src/ts/scene.ts` - Three.js scene/camera/renderer/lighting setup
- `src/ts/brain.ts` - Colin27 brain mesh, subcortical structures, electrodes
- `src/ts/network.ts` - Epileptogenic network graph and BFS spike propagation
- `src/ts/interaction.ts` - Drag-to-rotate, click/touch handlers, mouse glow
- `src/ts/alice.ts` - Alice's seizure story visualization (3 phases)
- `src/ts/cn.ts` - Critical Nodes interactive (electrodes, connectivity, criticality)
- `src/ts/animation.ts` - Render loop, visibility observer, auto-spike triggers
- `src/ts/ui.ts` - Nav, contact form, CTA switcher, scroll reveals
- `src/ts/background.ts` - 2D canvas neural particle background
- `brain_data.js` - Colin27 brain mesh data (~2.8 MB), loaded via script tag
- `public/` - Symlinks to static assets copied to dist/ at build time

## Architecture Rules

- **Three.js is loaded via CDN** with SRI hash - do NOT bundle it or switch to npm import. Types come from `@types/three@0.134` (dev-only). The `allowUmdGlobalAccess` tsconfig option lets modules use the `THREE` global.
- **`brain_data.js` stays as a script tag** - it's ~2.8 MB and accessed as `window.BRAIN`.
- **State is passed as parameters** between modules. Each module exports setup functions that take dependencies and return state. No global singletons.
- **No framework** (React, Svelte, etc.) - this is a static marketing page.
- **Use enums** (`AliceMode`, `CNMode` in `types.ts`) instead of magic numbers for mode comparisons.
- **Add new constants** to `constants.ts` instead of inline magic numbers.
- **Add new types** to `types.ts` instead of inline interfaces.

## Code Style

- Never use em dashes or en dashes - use regular hyphens only.
- 2-space indentation in TypeScript files.
- No unnecessary comments, docstrings, or type annotations on code you didn't change.
- Prefer editing existing modules over creating new files.

## Deployment

Push to `main` triggers `.github/workflows/build-deploy.yml` which builds and deploys `dist/` to GitHub Pages at `findneuro.com`.
