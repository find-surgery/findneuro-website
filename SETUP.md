# Setup on a New Machine

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | comes with Node |
| Git | any recent |

## Setup

```bash
# 1. Clone
git clone git@github.com:find-surgery/findneuro-website.git
cd findneuro-website

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build

```bash
# Type-check + build for production
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
src/
  index.html          # Main website
  cn-suite-paper/     # Clinical validation paper (standalone page)
    index.html
  ts/                 # TypeScript modules
    main.ts           # Entry point
    brain.ts          # 3D brain mesh (Three.js)
    cn.ts             # "How CN Works" interactive (3 phases)
    seeg.ts           # sEEG signal overlay for CN Phase 1
    alice.ts          # Patient story visualization
    scene.ts          # Three.js scene setup
    animation.ts      # Main render loop
    network.ts        # Epileptogenic network
    interaction.ts    # Drag/click handlers
    background.ts     # 2D neural background
    ui.ts             # UI interactions (nav, forms, modals)
    constants.ts      # Shared config values
    types.ts          # TypeScript interfaces
  styles/
    main.css          # All styles
public/
  assets/             # Images, icons, brain data
  brain_data.js       # Brain mesh vertex/face data
```

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/`.
Live at: https://findneuro.com

## Key Tech

- **Vite** for bundling
- **TypeScript** (strict)
- **Three.js** (loaded from CDN, declared as external in vite.config.ts)
- **D3.js** (used in cn-suite-paper for charts)
- No framework - vanilla TS with direct DOM manipulation
