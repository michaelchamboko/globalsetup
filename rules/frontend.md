---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.vue"
  - "**/*.svelte"
  - "**/*.css"
  - "**/*.scss"
  - "**/*.html"
  - "**/components/**"
  - "**/pages/**"
  - "**/views/**"
  - "**/layouts/**"
  - "**/styles/**"
---

# Frontend

## Design Tokens

Before writing frontend code, find the project's existing tokens file (`tokens.css`, `variables.css`, `theme.ts`, `tailwind.config.*`, `_variables.scss`). If none exists, create one. Never hardcode raw values in components.

Required token categories: colors (semantic names with dark mode variants), spacing scale, border radius, shadows (elevation system), typography (display + body + mono fonts, type scale, weights), breakpoints, transitions (durations + easing), z-index scale.

## Design Principles

Pick one primary principle. Don't mix randomly.

| Principle | When to use |
|---|---|
| **Glassmorphism** | Overlays, modern dashboards |
| **Neumorphism** | Settings panels, minimal controls |
| **Brutalism** | Developer tools, editorial sites |
| **Minimalism** | Portfolios, documentation, content-first |
| **Maximalism** | Creative agencies, e-commerce |
| **Claymorphism** | Playful apps, onboarding |
| **Bento Grid** | Dashboards, feature showcases |
| **Aurora / Mesh Gradients** | Landing pages, hero sections |
| **Flat Design** | Mobile apps, system UI |
| **Material Elevation** | Data-heavy apps, enterprise |
| **Editorial** | Blogs, long-form content |

## Component Framework

Use whatever the project already has. Don't mix competing libraries.

| Category | Options (pick one) |
|---|---|
| CSS | Tailwind, vanilla CSS, CSS Modules, styled-components, Emotion, UnoCSS, Panda CSS |
| Primitives | shadcn/ui, Radix, Headless UI, Ark UI, DaisyUI, Mantine, Chakra, Vuetify |
| Animation | CSS transitions, Framer Motion, GSAP, View Transitions API, AutoAnimate |
| Charts | Recharts, D3, Chart.js, Visx, ECharts, Nivo |
| Icons | Lucide, Phosphor, Heroicons, Tabler Icons, Iconify |

## Layout

- CSS Grid for 2D, Flexbox for 1D. Use `gap`, not margin hacks.
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Mobile-first. Touch targets: minimum 44x44px.

## Accessibility (non-negotiable)

- All interactive elements keyboard-accessible.
- Images: meaningful `alt` text. Decorative: `alt=""`.
- Form inputs: associated `<label>` or `aria-label`.
- Contrast: 4.5:1 normal text, 3:1 large text.
- Visible focus indicators. Never `outline: none` without replacement.
- Color never the sole indicator.
- `aria-live` for dynamic content. Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Performance

- Images: `loading="lazy"` below fold, explicit `width`/`height`.
- Fonts: `font-display: swap`.
- Animations: `transform` and `opacity` only.
- Large lists: virtualize at 100+ items.
- Bundle size: never import a whole library for one function.

## Event-Driven Network & State Bounds

Any component intercepting high-frequency user-driven events that trigger network calls or global state updates must strictly adhere to the following rules:

### Event Handling Audit Checklist

| Event Type | Action Type | Required Resiliency Pattern | Default Constraint |
| :--- | :--- | :--- | :--- |
| **High-Frequency Input** (`onChange`, text filters, search boxes) | Network requests / Global state updates | Debouncing helper mechanism | **Minimum 300ms** threshold window |
| **High-Frequency Actions** (`onScroll`, `onMouseMove`, `resize`) | Layout changes, DOM manipulation, state writes | Throttling helper / Frame-bound scheduling | Bounded by frame layouts (e.g., `requestAnimationFrame`) |
| **Infinite Scroll Listeners** | Pagination / Fetching next batch of items | Throttle strategy + event handler detachment | Bounded by frame layouts, detach on container unmount |

### Rules for Event-Driven Resiliency

- **No Raw Input Loops**: Directly calling an API or dispatching directly to a global state store from a raw `onChange` handler without debouncing is strictly outlawed. Automated lint/validation checks must flag all raw client input loops communicating un-debounced with downstream routers.
- **Throttling Precision**: Use `requestAnimationFrame` or high-performance layout-aware throttlers for visual viewport/scroll operations.

---

## Asynchronous Hooks & Race Protection

Any client component executing asynchronous operations or hook-based requests must prevent memory leaks and out-of-order execution states.

### Asynchronous Resiliency Checklist

- [ ] **Mandatory Cleanup Destructors**: Every asynchronous operation or event listener initialized during a component's mount phase (e.g., React `useEffect`, Socket.io listeners) **MUST** return/define a teardown destructor callback.
  - *Example:* Unsubscribe from events, close WebSockets, clear timers (`clearInterval`, `clearTimeout`).
- [ ] **Race Condition Safeguards**: Concurrent fetch managers and async state setters must protect against out-of-order network threads overwriting newer state with stale responses.
- [ ] **Native Abort Controllers**: Use standard `AbortController` to cancel active requests when parameters change or components unmount.
- [ ] **State Transaction Tokens / Request Keys**: When `AbortController` cannot be used, implement sequential request key matching or ignore state transitions if the request token is outdated.

### Recommended Abort Pattern Example (React)

```tsx
useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      const response = await fetch('/api/data', { signal: controller.signal });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Handle actual network or API errors
        handleError(error);
      }
    }
  }

  fetchData();
  return () => controller.abort(); // Cleanup/teardown destructor
}, [query]);
```

