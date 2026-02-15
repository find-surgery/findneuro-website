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
public/                   # Static assets copied to dist/ (symlinks)
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
- **`brain_data.js`** is loaded via script tag and accessed as `window.BRAIN`.
- **State is passed as parameters** between modules (no global singletons). Each module exports setup functions that receive dependencies and return state objects.
- **No framework** - this is a static marketing page, not an app.

## Deployment

Pushing to `main` triggers the `build-deploy.yml` workflow which runs `npm ci && npm run build`, then deploys `dist/` to GitHub Pages with the `findneuro.com` CNAME.
