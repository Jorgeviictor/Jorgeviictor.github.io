# TEVOX Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing static TEVOX site with a React + Three.js + GSAP landing page: a floating 3D network background reacting to mouse/scroll, a wordmark logo that detaches and moves laterally via ScrollTrigger, and four content sections (Hero, Ecossistema, Radar Carioca & Pipeline, Governança e Segurança), deployed automatically to tevox.co via GitHub Pages.

**Architecture:** Vite + React (JS) app scaffolded at the repo root of `Jorgeviictor.github.io` (replacing the current static `index.html`/`assets`). Three.js is wired through `@react-three/fiber`/`@react-three/drei` in an isolated `Background3D` component mounted once and fixed behind all content. GSAP `ScrollTrigger` drives a fixed `Logo` component's lateral position/scale, one trigger per section. All non-trivial math (mouse normalization, scroll velocity decay, node generation, logo target position) is extracted into pure, unit-tested functions in `src/lib/`, kept separate from the React/Three.js/GSAP wiring so it can be tested with Vitest without a browser or WebGL context.

**Tech Stack:** Vite, React 18 (JavaScript), Tailwind CSS, three, @react-three/fiber, @react-three/drei, gsap (ScrollTrigger), Vitest + @testing-library/react for tests, GitHub Actions for deploy.

**Spec:** `docs/superpowers/specs/2026-08-14-tevox-landing-page-design.md`

## Global Constraints

- Colors: background `#0a0e17` (deep navy) / `#1a1f2b` (graphite), accents `#00e5ff` (cyan) and `#39ff88` (electric green). Use these exact hex values wherever color tokens are defined.
- Headline slogan text must be exactly: "Tecnologia que Conecta. Soluções que Escalam." (Hero).
- No backend contact form, no CMS, no i18n — pt-BR only, static site (see spec "Fora de escopo").
- Preserve the domain: `CNAME` file (content: `tevox.co`) must end up in the Vite build output (`dist/CNAME`).
- Legacy static files (`index.html`, `assets/css/style.css`, `assets/js/main.js` at repo root) are being replaced — remove them as part of this plan, not left dangling.
- `assets/img/favicon.svg` and `assets/img/tevox-ecossistema.jpeg` are reusable brand assets — move them into the new project's `public/` rather than deleting.
- JavaScript only, no TypeScript.

---

## File Structure

```
Jorgeviictor.github.io/
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  index.html                        # Vite entry (replaces legacy index.html)
  public/
    CNAME                           # "tevox.co" (moved from repo root)
    favicon.svg                     # moved from assets/img/
    tevox-ecossistema.jpeg          # moved from assets/img/
  src/
    main.jsx
    App.jsx
    index.css                       # Tailwind directives + color/font tokens
    lib/
      mouseParallax.js              # normalizeMouse()
      mouseParallax.test.js
      scrollVelocity.js             # createScrollVelocityTracker()
      scrollVelocity.test.js
      networkNodes.js               # generateNetworkNodes()
      networkNodes.test.js
      logoTarget.js                 # computeLogoTarget()
      logoTarget.test.js
    components/
      Background3D/
        Background3D.jsx
        NetworkMesh.jsx
      Logo/
        Logo.jsx
      sections/
        Hero.jsx
        Hero.test.jsx
        Ecossistema.jsx
        Ecossistema.test.jsx
        RadarPipeline.jsx
        RadarPipeline.test.jsx
        Governanca.jsx
        Governanca.test.jsx
    App.test.jsx
  .github/workflows/deploy.yml
```

---

### Task 1: Scaffold Vite + React project and remove legacy static site

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
- Create: `public/CNAME`, `public/favicon.svg`, `public/tevox-ecossistema.jpeg`
- Delete: `assets/css/style.css`, `assets/js/main.js`, `assets/img/favicon.svg`, `assets/img/tevox-ecossistema.jpeg`, legacy `CNAME` at repo root (recreated under `public/`)
- Note: the legacy `index.html` at repo root is overwritten by Vite's own `index.html` in this same task (same path, new content) — no separate delete needed.

**Interfaces:**
- Produces: `src/App.jsx` exporting default `App` component, rendered into `#root` by `src/main.jsx`. Later tasks compose their components inside `App`.

- [ ] **Step 1: Initialize the Vite React project in place**

Run from the repo root (`Jorgeviictor.github.io/`):

```bash
npm create vite@latest . -- --template react
```

When prompted about the current directory not being empty, confirm to continue (it will ask to overwrite `index.html`/etc. — accept).

- [ ] **Step 2: Move reusable brand assets, drop legacy files**

```bash
mkdir -p public
mv assets/img/favicon.svg public/favicon.svg
mv assets/img/tevox-ecossistema.jpeg public/tevox-ecossistema.jpeg
mv CNAME public/CNAME
rm -rf assets
```

- [ ] **Step 3: Replace the Vite-generated `index.html` head**

Edit `index.html` (repo root) so `<head>` matches:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TEVOX — Tecnologia que Conecta. Soluções que Escalam.</title>
    <meta name="description" content="TEVOX projeta, constrói e escala produtos digitais como Venture Builder, sob uma infraestrutura B2B centralizada, segura e pronta para crescer." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace `src/App.jsx` with a minimal placeholder**

```jsx
export default function App() {
  return (
    <main className="min-h-screen bg-[#0a0e17] text-white">
      <h1 className="p-8 text-3xl font-bold">TEVOX</h1>
    </main>
  )
}
```

- [ ] **Step 5: Install dependencies and verify the dev server boots**

```bash
npm install
npm run build
```

Expected: `npm run build` completes without errors and produces `dist/index.html` and `dist/CNAME`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + React project, remove legacy static site"
```

---

### Task 2: Tailwind CSS setup with TEVOX design tokens

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

**Interfaces:**
- Produces: Tailwind utility classes `bg-navy` (`#0a0e17`), `bg-graphite` (`#1a1f2b`), `text-cyan-glow` (`#00e5ff`), `text-green-glow` (`#39ff88`), font families `font-heading` (Montserrat) and `font-body` (Inter) — later tasks (sections, Logo) use these class names.

- [ ] **Step 1: Install Tailwind and generate config**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a0e17',
        graphite: '#1a1f2b',
        'cyan-glow': '#00e5ff',
        'green-glow': '#39ff88',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Add Google Fonts and Tailwind directives to `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-navy text-white font-body;
}
```

- [ ] **Step 4: Verify build still succeeds**

```bash
npm run build
```

Expected: succeeds, no PostCSS/Tailwind errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js postcss.config.js src/index.css package.json package-lock.json
git commit -m "Add Tailwind CSS with TEVOX color/font tokens"
```

---

### Task 3: Pure function — mouse position normalization

**Files:**
- Create: `src/lib/mouseParallax.js`
- Test: `src/lib/mouseParallax.test.js`

**Interfaces:**
- Produces: `normalizeMouse(clientX, clientY, width, height)` → `{ x: number, y: number }`, each in `[-1, 1]`, used by the `useMouseParallax` hook in Task 7.

- [ ] **Step 1: Install Vitest and testing libraries**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Add a test script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Write the failing test**

`src/lib/mouseParallax.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { normalizeMouse } from './mouseParallax'

describe('normalizeMouse', () => {
  it('returns (0, 0) at the center of the viewport', () => {
    expect(normalizeMouse(400, 300, 800, 600)).toEqual({ x: 0, y: 0 })
  })

  it('returns (-1, -1) at the top-left corner', () => {
    expect(normalizeMouse(0, 0, 800, 600)).toEqual({ x: -1, y: -1 })
  })

  it('returns (1, 1) at the bottom-right corner', () => {
    expect(normalizeMouse(800, 600, 800, 600)).toEqual({ x: 1, y: 1 })
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run src/lib/mouseParallax.test.js`
Expected: FAIL — `mouseParallax.js` does not exist / `normalizeMouse` is not exported.

- [ ] **Step 6: Implement `src/lib/mouseParallax.js`**

```js
export function normalizeMouse(clientX, clientY, width, height) {
  const x = (clientX / width) * 2 - 1
  const y = (clientY / height) * 2 - 1
  return { x, y }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/lib/mouseParallax.test.js`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add package.json vitest.config.js src/lib/mouseParallax.js src/lib/mouseParallax.test.js
git commit -m "Add normalizeMouse pure function with tests"
```

---

### Task 4: Pure function — decaying scroll velocity tracker

**Files:**
- Create: `src/lib/scrollVelocity.js`
- Test: `src/lib/scrollVelocity.test.js`

**Interfaces:**
- Produces: `createScrollVelocityTracker(decay = 0.85)` → `{ sample(scrollY, timestampMs): number, getVelocity(): number }`. `sample` returns the current (decayed) velocity after incorporating a new scroll reading. Used by the `useScrollVelocity` hook in Task 7.

- [ ] **Step 1: Write the failing test**

`src/lib/scrollVelocity.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { createScrollVelocityTracker } from './scrollVelocity'

describe('createScrollVelocityTracker', () => {
  it('reports zero velocity before any sample', () => {
    const tracker = createScrollVelocityTracker()
    expect(tracker.getVelocity()).toBe(0)
  })

  it('reports zero velocity on the first sample (no prior reading)', () => {
    const tracker = createScrollVelocityTracker()
    expect(tracker.sample(0, 0)).toBe(0)
  })

  it('reports positive velocity when scrollY increases quickly', () => {
    const tracker = createScrollVelocityTracker(0.85)
    tracker.sample(0, 0)
    const v = tracker.sample(100, 100) // 100px in 100ms
    expect(v).toBeGreaterThan(0)
  })

  it('decays toward zero when scrollY stops changing', () => {
    const tracker = createScrollVelocityTracker(0.85)
    tracker.sample(0, 0)
    tracker.sample(100, 100)
    const vAfterMove = tracker.getVelocity()
    const vAfterStill1 = tracker.sample(100, 200)
    const vAfterStill2 = tracker.sample(100, 300)
    expect(vAfterStill1).toBeLessThan(vAfterMove)
    expect(vAfterStill2).toBeLessThan(vAfterStill1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/scrollVelocity.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/scrollVelocity.js`**

```js
export function createScrollVelocityTracker(decay = 0.85) {
  let lastY = null
  let lastT = null
  let velocity = 0

  return {
    sample(scrollY, timestampMs) {
      if (lastY !== null && lastT !== null) {
        const dt = Math.max(timestampMs - lastT, 1)
        const instantVelocity = (scrollY - lastY) / dt
        velocity = velocity * decay + instantVelocity * (1 - decay)
      }
      lastY = scrollY
      lastT = timestampMs
      return velocity
    },
    getVelocity() {
      return velocity
    },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/scrollVelocity.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrollVelocity.js src/lib/scrollVelocity.test.js
git commit -m "Add createScrollVelocityTracker pure function with tests"
```

---

### Task 5: Pure function — deterministic network node generator

**Files:**
- Create: `src/lib/networkNodes.js`
- Test: `src/lib/networkNodes.test.js`

**Interfaces:**
- Produces: `generateNetworkNodes(count, spread = 10, seed = 1)` → `Array<{ position: [number, number, number] }>` of length `count`, every coordinate within `[-spread, spread]`, deterministic for a given `seed`. Used by `NetworkMesh.jsx` in Task 6.

- [ ] **Step 1: Write the failing test**

`src/lib/networkNodes.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateNetworkNodes } from './networkNodes'

describe('generateNetworkNodes', () => {
  it('generates the requested number of nodes', () => {
    const nodes = generateNetworkNodes(50, 10, 1)
    expect(nodes).toHaveLength(50)
  })

  it('keeps every coordinate within [-spread, spread]', () => {
    const nodes = generateNetworkNodes(100, 10, 1)
    for (const node of nodes) {
      for (const coord of node.position) {
        expect(coord).toBeGreaterThanOrEqual(-10)
        expect(coord).toBeLessThanOrEqual(10)
      }
    }
  })

  it('is deterministic for the same seed', () => {
    const a = generateNetworkNodes(20, 10, 42)
    const b = generateNetworkNodes(20, 10, 42)
    expect(a).toEqual(b)
  })

  it('produces different output for different seeds', () => {
    const a = generateNetworkNodes(20, 10, 1)
    const b = generateNetworkNodes(20, 10, 2)
    expect(a).not.toEqual(b)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/networkNodes.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/networkNodes.js`**

```js
// Deterministic PRNG (mulberry32) so node layout is reproducible/testable.
function mulberry32(seed) {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function generateNetworkNodes(count, spread = 10, seed = 1) {
  const random = mulberry32(seed)
  const nodes = []
  for (let i = 0; i < count; i++) {
    const position = [
      (random() * 2 - 1) * spread,
      (random() * 2 - 1) * spread,
      (random() * 2 - 1) * spread,
    ]
    nodes.push({ position })
  }
  return nodes
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/networkNodes.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/networkNodes.js src/lib/networkNodes.test.js
git commit -m "Add generateNetworkNodes pure function with tests"
```

---

### Task 6: Pure function — logo scroll target per section

**Files:**
- Create: `src/lib/logoTarget.js`
- Test: `src/lib/logoTarget.test.js`

**Interfaces:**
- Produces: `computeLogoTarget(sectionIndex, totalSections, amplitude = 220)` → `{ x: number, scale: number }`. `x` alternates sign by section parity (`0` → left/negative, `1` → right/positive, ...); `scale` decreases linearly from `1` (first section) toward `0.65` (last section). Used by `Logo.jsx` in Task 8.

- [ ] **Step 1: Write the failing test**

`src/lib/logoTarget.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeLogoTarget } from './logoTarget'

describe('computeLogoTarget', () => {
  it('moves left (negative x) on even section indices', () => {
    expect(computeLogoTarget(0, 4, 220).x).toBe(-220)
    expect(computeLogoTarget(2, 4, 220).x).toBe(-220)
  })

  it('moves right (positive x) on odd section indices', () => {
    expect(computeLogoTarget(1, 4, 220).x).toBe(220)
    expect(computeLogoTarget(3, 4, 220).x).toBe(220)
  })

  it('starts at full scale on the first section', () => {
    expect(computeLogoTarget(0, 4).scale).toBe(1)
  })

  it('shrinks to 0.65 scale on the last section', () => {
    expect(computeLogoTarget(3, 4).scale).toBeCloseTo(0.65)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/logoTarget.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `src/lib/logoTarget.js`**

```js
export function computeLogoTarget(sectionIndex, totalSections, amplitude = 220) {
  const side = sectionIndex % 2 === 0 ? -1 : 1
  const progress = totalSections <= 1 ? 0 : sectionIndex / (totalSections - 1)
  const scale = 1 - progress * 0.35
  return { x: side * amplitude, scale }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/logoTarget.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/logoTarget.js src/lib/logoTarget.test.js
git commit -m "Add computeLogoTarget pure function with tests"
```

---

### Task 7: Background3D component (Three.js network mesh, mouse + scroll reactive)

**Files:**
- Create: `src/components/Background3D/NetworkMesh.jsx`
- Create: `src/components/Background3D/Background3D.jsx`
- Create: `src/components/Background3D/useMouseParallax.js`
- Create: `src/components/Background3D/useScrollVelocity.js`

**Interfaces:**
- Consumes: `normalizeMouse` from `src/lib/mouseParallax.js` (Task 3), `createScrollVelocityTracker` from `src/lib/scrollVelocity.js` (Task 4), `generateNetworkNodes` from `src/lib/networkNodes.js` (Task 5).
- Produces: `Background3D` default export, a component with no required props, meant to be mounted once. Later used by `App.jsx` (Task 9) as `<Background3D />`.

- [ ] **Step 1: Install Three.js and React Three Fiber/Drei**

```bash
npm install three @react-three/fiber @react-three/drei
```

- [ ] **Step 2: Create the mouse-parallax hook**

`src/components/Background3D/useMouseParallax.js`:

```jsx
import { useEffect, useRef } from 'react'
import { normalizeMouse } from '../../lib/mouseParallax'

export function useMouseParallax() {
  const target = useRef({ x: 0, y: 0 })

  useEffect(() => {
    function handleMove(event) {
      target.current = normalizeMouse(
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight
      )
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return target
}
```

- [ ] **Step 3: Create the scroll-velocity hook**

`src/components/Background3D/useScrollVelocity.js`:

```jsx
import { useEffect, useRef } from 'react'
import { createScrollVelocityTracker } from '../../lib/scrollVelocity'

export function useScrollVelocity() {
  const trackerRef = useRef(createScrollVelocityTracker(0.85))
  const velocity = useRef(0)

  useEffect(() => {
    function handleScroll() {
      velocity.current = trackerRef.current.sample(window.scrollY, performance.now())
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return velocity
}
```

- [ ] **Step 4: Create the network mesh geometry**

`src/components/Background3D/NetworkMesh.jsx`:

```jsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateNetworkNodes } from '../../lib/networkNodes'

const NODE_COUNT = 100
const SPREAD = 12

export function NetworkMesh({ mouseTarget, scrollVelocity }) {
  const groupRef = useRef()
  const nodes = useMemo(() => generateNetworkNodes(NODE_COUNT, SPREAD, 7), [])

  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(nodes.length * 3)
    nodes.forEach((node, i) => {
      positions[i * 3] = node.position[0]
      positions[i * 3 + 1] = node.position[1]
      positions[i * 3 + 2] = node.position[2]
    })
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [nodes])

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const linePositions = []
    const maxDistance = 4
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].position
        const b = nodes[j].position
        const dx = a[0] - b[0]
        const dy = a[1] - b[1]
        const dz = a[2] - b[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < maxDistance) {
          linePositions.push(...a, ...b)
        }
      }
    }
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    )
    return geometry
  }, [nodes])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const baseDrift = 0.02
    const scrollBoost = Math.min(Math.abs(scrollVelocity.current) * 0.5, 0.3)
    groupRef.current.rotation.y += (baseDrift + scrollBoost) * delta

    const mx = mouseTarget.current.x
    const my = mouseTarget.current.y
    groupRef.current.rotation.x += (my * 0.15 - groupRef.current.rotation.x) * 0.02
    groupRef.current.position.x += (mx * 0.6 - groupRef.current.position.x) * 0.02
  })

  return (
    <group ref={groupRef}>
      <points geometry={pointsGeometry}>
        <pointsMaterial color="#00e5ff" size={0.08} sizeAttenuation transparent opacity={0.9} />
      </points>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#39ff88" transparent opacity={0.15} />
      </lineSegments>
    </group>
  )
}
```

- [ ] **Step 5: Create the Background3D canvas wrapper**

`src/components/Background3D/Background3D.jsx`:

```jsx
import { Canvas } from '@react-three/fiber'
import { NetworkMesh } from './NetworkMesh'
import { useMouseParallax } from './useMouseParallax'
import { useScrollVelocity } from './useScrollVelocity'

export default function Background3D() {
  const mouseTarget = useMouseParallax()
  const scrollVelocity = useScrollVelocity()

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 14], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <NetworkMesh mouseTarget={mouseTarget} scrollVelocity={scrollVelocity} />
      </Canvas>
    </div>
  )
}
```

- [ ] **Step 6: Verify the build succeeds**

```bash
npm run build
```

Expected: succeeds with no errors (this component isn't wired into `App` until Task 9, so no visual check yet — build passing confirms no syntax/import errors).

- [ ] **Step 7: Commit**

```bash
git add src/components/Background3D
git commit -m "Add Background3D: reactive Three.js network mesh"
```

---

### Task 8: Logo component with GSAP ScrollTrigger

**Files:**
- Create: `src/components/Logo/Logo.jsx`

**Interfaces:**
- Consumes: `computeLogoTarget` from `src/lib/logoTarget.js` (Task 6).
- Produces: `Logo` default export, props `{ sectionIds: string[] }` — an ordered list of section element IDs to register one `ScrollTrigger` per section against. Used by `App.jsx` (Task 9) as `<Logo sectionIds={[...]} />`.

- [ ] **Step 1: Install GSAP**

```bash
npm install gsap
```

- [ ] **Step 2: Implement `src/components/Logo/Logo.jsx`**

```jsx
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { computeLogoTarget } from '../../lib/logoTarget'

gsap.registerPlugin(ScrollTrigger)

export default function Logo({ sectionIds }) {
  const logoRef = useRef(null)

  useEffect(() => {
    const triggers = sectionIds.map((id, index) => {
      const el = document.getElementById(id)
      if (!el) return null

      const { x, scale } = computeLogoTarget(index, sectionIds.length)

      return ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
        onEnter: () => gsap.to(logoRef.current, { x, scale, duration: 0.6, ease: 'power2.out' }),
        onEnterBack: () => gsap.to(logoRef.current, { x, scale, duration: 0.6, ease: 'power2.out' }),
      })
    })

    return () => {
      triggers.forEach((trigger) => trigger && trigger.kill())
    }
  }, [sectionIds])

  return (
    <div
      ref={logoRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none"
    >
      <span className="font-heading font-extrabold text-2xl tracking-wide text-white">
        TEVOX<span className="text-cyan-glow">.</span>
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Verify the build succeeds**

```bash
npm run build
```

Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/Logo
git commit -m "Add Logo component with GSAP ScrollTrigger lateral movement"
```

---

### Task 9: Section components (Hero, Ecossistema, RadarPipeline, Governanca)

**Files:**
- Create: `src/components/sections/Hero.jsx`, `src/components/sections/Hero.test.jsx`
- Create: `src/components/sections/Ecossistema.jsx`, `src/components/sections/Ecossistema.test.jsx`
- Create: `src/components/sections/RadarPipeline.jsx`, `src/components/sections/RadarPipeline.test.jsx`
- Create: `src/components/sections/Governanca.jsx`, `src/components/sections/Governanca.test.jsx`

**Interfaces:**
- Produces: four default-export components, each rendering a `<section id="...">` with the id values `hero`, `ecossistema`, `radar-pipeline`, `governanca` respectively. `App.jsx` (Task 10) renders them in this order and passes their ids to `Logo`.

- [ ] **Step 1: Write the failing test for Hero**

`src/components/sections/Hero.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

describe('Hero', () => {
  it('renders the exact slogan', () => {
    render(<Hero />)
    expect(screen.getByText(/Tecnologia que Conecta\./)).toBeInTheDocument()
    expect(screen.getByText(/Soluções que Escalam\./)).toBeInTheDocument()
  })

  it('has id="hero"', () => {
    const { container } = render(<Hero />)
    expect(container.querySelector('#hero')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Hero.test.jsx`
Expected: FAIL — `Hero.jsx` does not exist.

- [ ] **Step 3: Implement `src/components/sections/Hero.jsx`**

```jsx
export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <p className="font-body text-sm tracking-[0.3em] uppercase text-cyan-glow mb-6">
          TEVOX · Venture Builder &amp; Infraestrutura B2B
        </p>
        <h1 className="font-heading font-extrabold text-4xl md:text-6xl leading-tight">
          Tecnologia que Conecta.
          <br />
          <span className="text-green-glow">Soluções que Escalam.</span>
        </h1>
        <p className="mt-6 font-body text-base md:text-lg text-white/70 max-w-xl mx-auto">
          Construímos e operamos a infraestrutura que sustenta produtos digitais de alta
          performance — da primeira linha de código à escala de produção.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Hero.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing test for Ecossistema**

`src/components/sections/Ecossistema.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Ecossistema from './Ecossistema'

describe('Ecossistema', () => {
  it('mentions Venture Builder', () => {
    render(<Ecossistema />)
    expect(screen.getByText(/Venture Builder/)).toBeInTheDocument()
  })

  it('has id="ecossistema"', () => {
    const { container } = render(<Ecossistema />)
    expect(container.querySelector('#ecossistema')).not.toBeNull()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Ecossistema.test.jsx`
Expected: FAIL — `Ecossistema.jsx` does not exist.

- [ ] **Step 7: Implement `src/components/sections/Ecossistema.jsx`**

```jsx
const PILARES = [
  { title: 'Validação ágil', desc: 'Ideias testadas em ciclos curtos antes de virar produto.' },
  { title: 'Infraestrutura compartilhada', desc: 'Uma base B2B única sustentando todo o ecossistema.' },
  { title: 'Escala sem retrabalho', desc: 'O que uma startup resolve, todas as outras herdam.' },
]

export default function Ecossistema() {
  return (
    <section id="ecossistema" className="relative min-h-screen flex items-center px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <p className="font-body text-sm tracking-[0.3em] uppercase text-cyan-glow mb-4">
          O Ecossistema
        </p>
        <h2 className="font-heading font-extrabold text-3xl md:text-5xl mb-6">
          Uma fábrica de startups com fundação sólida.
        </h2>
        <p className="font-body text-base md:text-lg text-white/70 max-w-2xl">
          A TEVOX opera como <strong className="text-white">Venture Builder</strong>: validamos,
          construímos e escalamos produtos digitais sob uma infraestrutura B2B centralizada e
          compartilhada. Cada nova startup do ecossistema nasce sobre uma base já testada em
          produção — segurança, observabilidade e automação resolvidas uma vez, reaproveitadas
          em todas as frentes.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PILARES.map((pilar) => (
            <div key={pilar.title} className="rounded-lg border border-white/10 bg-graphite/60 p-6">
              <h3 className="font-heading font-bold text-lg text-green-glow mb-2">{pilar.title}</h3>
              <p className="font-body text-sm text-white/60">{pilar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Ecossistema.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 9: Write the failing test for RadarPipeline**

`src/components/sections/RadarPipeline.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RadarPipeline from './RadarPipeline'

describe('RadarPipeline', () => {
  it('mentions segurança and automação', () => {
    render(<RadarPipeline />)
    expect(screen.getByText(/segurança/i)).toBeInTheDocument()
    expect(screen.getByText(/automação/i)).toBeInTheDocument()
  })

  it('has id="radar-pipeline"', () => {
    const { container } = render(<RadarPipeline />)
    expect(container.querySelector('#radar-pipeline')).not.toBeNull()
  })
})
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/RadarPipeline.test.jsx`
Expected: FAIL — `RadarPipeline.jsx` does not exist.

- [ ] **Step 11: Implement `src/components/sections/RadarPipeline.jsx`**

```jsx
const ITEMS = [
  'Segurança desde o design',
  'Automação de ponta a ponta',
  'Performance mensurada continuamente',
]

export default function RadarPipeline() {
  return (
    <section id="radar-pipeline" className="relative min-h-screen flex items-center px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <p className="font-body text-sm tracking-[0.3em] uppercase text-cyan-glow mb-4">
          Radar Carioca &amp; Pipeline
        </p>
        <h2 className="font-heading font-extrabold text-3xl md:text-5xl mb-6">
          Aplicativos de alta performance, construídos para durar.
        </h2>
        <p className="font-body text-base md:text-lg text-white/70 max-w-2xl mb-10">
          Do radar de oportunidades ao pipeline de entrega, cada produto do ecossistema TEVOX é
          desenhado com <strong className="text-white">segurança</strong> e{' '}
          <strong className="text-white">automação</strong> no centro — não como camada
          adicionada depois. Deploys contínuos, testes automatizados e observabilidade de ponta a
          ponta em cada startup que construímos.
        </p>
        <ul className="space-y-3">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 font-body text-white/80">
              <span className="h-2 w-2 rounded-full bg-green-glow" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/RadarPipeline.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 13: Write the failing test for Governanca**

`src/components/sections/Governanca.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Governanca from './Governanca'

describe('Governanca', () => {
  it('mentions criptografia and nuvem', () => {
    render(<Governanca />)
    expect(screen.getByText(/criptografia/i)).toBeInTheDocument()
    expect(screen.getByText(/nuvem/i)).toBeInTheDocument()
  })

  it('has id="governanca"', () => {
    const { container } = render(<Governanca />)
    expect(container.querySelector('#governanca')).not.toBeNull()
  })
})
```

- [ ] **Step 14: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Governanca.test.jsx`
Expected: FAIL — `Governanca.jsx` does not exist.

- [ ] **Step 15: Implement `src/components/sections/Governanca.jsx`**

```jsx
const ITEMS = [
  'Criptografia ponta a ponta',
  'Escalabilidade horizontal',
  'Conformidade e auditoria contínua',
]

export default function Governanca() {
  return (
    <section id="governanca" className="relative min-h-screen flex items-center px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <p className="font-body text-sm tracking-[0.3em] uppercase text-cyan-glow mb-4">
          Governança e Segurança
        </p>
        <h2 className="font-heading font-extrabold text-3xl md:text-5xl mb-6">
          Infraestrutura em nuvem, criptografada e pronta para escalar.
        </h2>
        <p className="font-body text-base md:text-lg text-white/70 max-w-2xl mb-10">
          Toda a operação TEVOX roda sobre infraestrutura em{' '}
          <strong className="text-white">nuvem</strong> redundante, com{' '}
          <strong className="text-white">criptografia</strong> de dados em trânsito e em
          repouso, e arquitetura pensada para escalar horizontalmente sem fricção. Governança
          não é checklist — é parte do design técnico desde o primeiro commit.
        </p>
        <ul className="space-y-3">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 font-body text-white/80">
              <span className="h-2 w-2 rounded-full bg-cyan-glow" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 16: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Governanca.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 17: Commit**

```bash
git add src/components/sections
git commit -m "Add Hero, Ecossistema, RadarPipeline, Governanca sections with tests"
```

---

### Task 10: Compose App.jsx (Background3D + Logo + sections)

**Files:**
- Modify: `src/App.jsx`
- Create: `src/App.test.jsx`

**Interfaces:**
- Consumes: `Background3D` (Task 7), `Logo` (Task 8), `Hero`/`Ecossistema`/`RadarPipeline`/`Governanca` (Task 9).

- [ ] **Step 1: Write the failing test**

`src/App.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Background3D uses WebGL (unavailable in jsdom) — mock it for this smoke test.
vi.mock('./components/Background3D/Background3D', () => ({
  default: () => <div data-testid="background-3d-mock" />,
}))

describe('App', () => {
  it('renders all four sections and the background mock', () => {
    render(<App />)
    expect(screen.getByTestId('background-3d-mock')).toBeInTheDocument()
    expect(screen.getByText(/Tecnologia que Conecta\./)).toBeInTheDocument()
    expect(screen.getByText(/Venture Builder/)).toBeInTheDocument()
    expect(screen.getByText(/Radar Carioca/)).toBeInTheDocument()
    expect(screen.getByText(/Governança e Segurança/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/App.test.jsx`
Expected: FAIL — current `App.jsx` is still the Task 1 placeholder.

- [ ] **Step 3: Implement `src/App.jsx`**

```jsx
import Background3D from './components/Background3D/Background3D'
import Logo from './components/Logo/Logo'
import Hero from './components/sections/Hero'
import Ecossistema from './components/sections/Ecossistema'
import RadarPipeline from './components/sections/RadarPipeline'
import Governanca from './components/sections/Governanca'

const SECTION_IDS = ['hero', 'ecossistema', 'radar-pipeline', 'governanca']

export default function App() {
  return (
    <div className="relative bg-navy">
      <Background3D />
      <Logo sectionIds={SECTION_IDS} />
      <main>
        <Hero />
        <Ecossistema />
        <RadarPipeline />
        <Governanca />
      </main>
      <footer className="relative py-10 text-center font-body text-sm text-white/40">
        © {new Date().getFullYear()} TEVOX. Todos os direitos reservados.
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/App.test.jsx`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: all tests across `src/lib/*.test.js`, `src/components/sections/*.test.jsx`, and `src/App.test.jsx` PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/App.test.jsx
git commit -m "Compose App: Background3D, Logo, and all four sections"
```

---

### Task 11: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a workflow triggered on push to `main` that builds the Vite project and publishes `dist/` (including `dist/CNAME`) to GitHub Pages.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy TEVOX landing page

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the workflow YAML is well-formed**

```bash
node -e "require('js-yaml') || true" 2>/dev/null; python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" 2>/dev/null || echo "skip: no yaml parser available locally, GitHub will validate on push"
```

Expected: no parse error reported (or the skip message, if no local YAML parser is available — this is fine, GitHub validates on push).

- [ ] **Step 3: Set the repository's Pages source to GitHub Actions**

```bash
gh api -X PUT repos/Jorgeviictor/Jorgeviictor.github.io/pages -f build_type=workflow
```

If this fails (e.g., Pages not yet enabled), enable it manually once: repo → Settings → Pages → "Build and deployment" → Source → "GitHub Actions".

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow to build and deploy to GitHub Pages"
```

---

### Task 12: Manual browser verification and push

**Files:** none (verification only)

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open in Chrome via claude-in-chrome and verify the golden path**

Navigate to the printed local URL (typically `http://localhost:5173`) and confirm:
- The 3D network mesh is visible behind the content and subtly shifts when the mouse moves.
- Scrolling changes the mesh's rotation speed (faster while actively scrolling, settling down when still).
- The "TEVOX." wordmark starts centered at the top, then shifts laterally and shrinks slightly as each section (`hero` → `ecossistema` → `radar-pipeline` → `governanca`) scrolls into view.
- All four sections render their expected copy (slogan, Venture Builder, Radar Carioca & Pipeline, Governança e Segurança).
- No console errors (check via `read_console_messages`).

- [ ] **Step 3: Resize the browser window to a mobile viewport (e.g., 390×844) and re-check**

Confirm text remains legible, sections stack correctly, and the canvas doesn't cause horizontal overflow (`document.documentElement.scrollWidth` should equal `window.innerWidth`).

- [ ] **Step 4: Run the full test suite and build one more time**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 5: Push to `main`**

```bash
git push origin main
```

Confirm with the user before pushing, since this triggers a public deploy to tevox.co.

- [ ] **Step 6: Update the Obsidian project note**

Mark the "Próximos passos" checklist in `Site TEVOX/Tevox/TEVOX - Landing Page.md` as complete and add a short "Resultado" section noting the deploy URL and date.

---

## Self-Review Notes

- **Spec coverage:** dark navy/graphite + cyan/green-glow colors (Task 2), heavy heading font + regular body font (Task 2), no static hero / 3D background reacting to mouse+scroll (Tasks 5, 7), logo centered-then-detaching-and-lateral via ScrollTrigger (Tasks 6, 8), all four content sections with the exact slogan and topics (Task 9), Tailwind (Task 2), modularized 3D canvas (Task 7 is self-contained under `components/Background3D/`), GSAP ScrollTrigger pinning/lateral movement (Task 8), deploy to tevox.co (Task 11) — all covered.
- **Placeholder scan:** no TBD/TODO; all code blocks are complete, runnable content.
- **Type/interface consistency:** `normalizeMouse`, `createScrollVelocityTracker`, `generateNetworkNodes`, `computeLogoTarget` signatures match between their defining task and every consuming task (7, 8). Section `id` values (`hero`, `ecossistema`, `radar-pipeline`, `governanca`) match between Task 9 (definitions) and Task 10 (`SECTION_IDS` passed to `Logo`).
