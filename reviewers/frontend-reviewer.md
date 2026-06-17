# Frontend Designer & Accessibility Reviewer Profile

Review changes for visual alignment, responsive design, user experience, and WCAG 2.2 AA accessibility compliance. Reference `rules/accessibility.md` and `rules/frontend.md` for full guidance.

## Checklist

### Responsive Design & Layout
- [ ] **Responsive Display**: Layout renders correctly on mobile (≥ 320px), tablet (768px), and desktop (1280px+) viewports.
- [ ] **Design Tokens**: Colors, margins, padding, shadows, and fonts use existing design tokens — no hardcoded hex values or raw pixel sizes.
- [ ] **Touch Targets**: All interactive elements (buttons, links, inputs) have a minimum touch target of 44×44px.
- [ ] **CSS Grid/Flexbox**: 2D layouts use CSS Grid, 1D layouts use Flexbox. No margin-hack-based layouts.

### Semantic Structure
- [ ] **Semantic HTML**: Native HTML elements used first (`<button>`, `<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`) before ARIA roles.
- [ ] **Heading Hierarchy**: One `<h1>` per page. Headings follow a logical hierarchy (no skipping levels).
- [ ] **Landmark Regions**: Page has `<header>`, `<nav>`, `<main>`, and `<footer>` landmark elements.

### ARIA & Screen Reader Compatibility
- [ ] **ARIA Used Correctly**: ARIA roles, properties, and states are used only when native semantics are insufficient. Required ARIA attributes are paired with their roles.
- [ ] **Icon-Only Buttons**: Buttons with only an icon have `aria-label` or `aria-labelledby`.
- [ ] **Dynamic Content**: Content updates that users need to know about use `aria-live="polite"`. Critical errors use `aria-live="assertive"`.
- [ ] **Modal Dialogs**: Modals have `aria-modal="true"`, `aria-labelledby`, focus trapping, and return focus to trigger on close.

### Keyboard Navigation
- [ ] **Keyboard Accessible**: All interactive elements are reachable and operable via Tab / Shift+Tab / Enter / Space / Arrow keys.
- [ ] **Visible Focus Indicator**: All focusable elements have a clearly visible focus indicator that passes 3:1 contrast (uses `:focus-visible`, not `:focus`).
- [ ] **No Positive tabindex**: No `tabindex` values > 0.
- [ ] **Skip Navigation**: If this is a new page, a "Skip to main content" skip link is the first focusable element.
- [ ] **Escape Key**: Overlays, modals, and dropdowns close on Escape key.

### Form Accessibility
- [ ] **Labels Associated**: Every input has an associated `<label for="id">`, `aria-label`, or `aria-labelledby`.
- [ ] **Error Association**: Error messages are programmatically linked to their input via `aria-describedby`.
- [ ] **Autocomplete Attributes**: Name, email, phone, address, and payment fields have appropriate `autocomplete` attributes.
- [ ] **No Placeholder as Label**: `placeholder` is not the only label for an input field.

### Color & Contrast
- [ ] **Text Contrast (AA)**: Normal text ≥ 4.5:1 contrast ratio. Large text (≥ 18pt / 14pt bold) ≥ 3:1.
- [ ] **UI Component Contrast**: Input borders, button outlines, and focus indicators ≥ 3:1 against adjacent colors.
- [ ] **Color Not Sole Indicator**: Information conveyed by color is also conveyed by text, icon, or pattern.

### Motion & Animation
- [ ] **prefers-reduced-motion**: All decorative animations are disabled or minimized when `prefers-reduced-motion: reduce` is set.
- [ ] **No Flashing**: No content flashes more than 3 times per second (seizure prevention).

### Images & Media
- [ ] **Alt Text**: Meaningful images have descriptive `alt` text. Decorative images have `alt=""`.
- [ ] **Video Captions**: Video content has synchronized closed captions.

### Performance (Frontend)
- [ ] **Core Web Vitals**: This change does not regress LCP, INP, or CLS (see `reviewers/performance-reviewer.md`).
- [ ] **Lazy Loading**: Images and heavy components below the fold use `loading="lazy"` or dynamic imports.
