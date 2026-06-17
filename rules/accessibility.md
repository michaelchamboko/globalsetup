---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.vue"
  - "**/*.svelte"
  - "**/*.html"
  - "**/components/**"
  - "**/pages/**"
---

# Accessibility Rules (WCAG 2.2)

Accessibility is a legal requirement in most jurisdictions (ADA, EN 301 549, EAA) and serves approximately 15% of the global population who live with a disability. It is also good engineering — accessible interfaces are faster, more keyboard-friendly, and better structured for SEO. WCAG 2.2 AA compliance is the **mandatory baseline**. AAA is the target for critical user flows.

---

## 1. Semantic HTML First

Use native HTML elements before reaching for ARIA. Native elements have built-in keyboard behavior, focus management, and semantics that ARIA cannot replicate.

| Don't | Do |
|---|---|
| `<div onclick="...">Submit</div>` | `<button type="submit">Submit</button>` |
| `<div role="navigation">` | `<nav>` |
| `<span class="heading">` | `<h2>` |
| `<div class="list">` + `<div class="item">` | `<ul>` + `<li>` |

- Use landmark elements on every page: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- One `<main>` element per page. One `<h1>` per page.
- Use `<button>` for actions, `<a>` for navigation. Never reverse these.
- Use `<table>` for tabular data with `<thead>`, `<th scope="col/row">`, `<caption>`.

---

## 2. ARIA — Use Correctly or Not At All

ARIA enhances native semantics — it does not replace them. Incorrect ARIA is worse than no ARIA.

### Rules

- **First Rule of ARIA**: If a native HTML element with the semantics you need exists, use it.
- **Second Rule of ARIA**: Do not change native semantics without strong justification.
- Always pair `role` with required `aria-*` properties. A `role="combobox"` without `aria-expanded` is broken.
- Dynamic content changes must announce themselves: use `aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for critical errors only.
- Modal dialogs: set `aria-modal="true"`, `aria-labelledby`, trap focus inside the dialog, return focus to the trigger on close.
- Icon-only buttons: always add `aria-label` or `aria-labelledby`. Empty buttons are inaccessible.

---

## 3. Keyboard Navigation

All functionality must be operable via keyboard alone — no mouse required.

- **Tab order** must follow visual reading order. Never use `tabindex > 0`.
- Interactive elements must be focusable (native elements are; custom elements need `tabindex="0"`).
- **Skip navigation link**: every page must have a "Skip to main content" link as the first focusable element.
- **Focus trap**: modal dialogs, drawers, and menus must trap focus within themselves while open.
- **Escape key**: always closes overlays (modals, dropdowns, tooltips).
- **Arrow key navigation**: use arrow keys for widget internals (menu items, tabs, radio groups). Tab moves between widgets.
- **Custom components**: implement full keyboard pattern per ARIA Authoring Practices Guide (APG) — tabs, combobox, tree, grid, etc.

---

## 4. Focus Indicators

Visible focus indicators are **non-negotiable**. Never use `outline: none` without a custom replacement.

- Focus indicator must meet WCAG 2.2 SC 2.4.11: minimum 2px border, 3:1 contrast against adjacent colors.
- Use `:focus-visible` (not `:focus`) to show indicators only for keyboard navigation — not mouse clicks.
- Test focus indicators with high-contrast mode (Windows) and dark mode.

```css
/* ✅ Correct pattern */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ❌ Never do this without a replacement */
:focus { outline: none; }
```

---

## 5. Color & Contrast

- **Normal text**: minimum contrast ratio 4.5:1 (AA). Target 7:1 (AAA) for body text.
- **Large text** (≥ 18pt regular or ≥ 14pt bold): minimum 3:1 (AA).
- **UI components** (buttons, inputs, focus indicators): minimum 3:1 against adjacent colors.
- **Never use color as the sole means of conveying information** — add icons, patterns, or text labels.
- Test with colorblindness simulators (Coblis, Chrome DevTools vision deficiency emulator).
- Test with Windows High Contrast mode (WHCM) and forced-colors media query.

---

## 6. Forms

- Every input must have an associated `<label>` — either `<label for="id">` or `aria-label` / `aria-labelledby`.
- Use `autocomplete` attributes on name, address, email, phone, payment fields (WCAG 1.3.5).
- Error identification: identify the field in error by name, describe the error, and suggest a correction.
- Error messages must be programmatically associated with the input: `aria-describedby="error-id"`.
- Do not use `placeholder` as a label replacement — it disappears on input and fails contrast.
- Group related inputs with `<fieldset>` and `<legend>`.

---

## 7. Motion & Animation

- Respect `prefers-reduced-motion` media query — all decorative animations must be disabled or reduced:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- No content may flash more than 3 times per second (WCAG 2.3.1 — prevents seizures).
- Parallax, auto-playing video, and scroll-triggered animations must have a pause/stop control.

---

## 8. Images & Media

- All meaningful images: descriptive `alt` text that conveys the purpose, not just the appearance.
- Decorative images: `alt=""` (empty string — do not omit the attribute).
- Complex images (charts, graphs, diagrams): provide a long description via `aria-describedby` or adjacent text.
- Video content: provide captions (closed captions, not just subtitles). Provide audio description track for visual-only information.
- Audio content: provide a text transcript.

---

## 9. Automated & Manual Testing

### Automated (run in CI on every PR)

- **axe-core** (via `@axe-core/playwright` or `jest-axe`): catches ~30–40% of WCAG issues automatically.
- **Lighthouse Accessibility audit**: score must be ≥ 90 and not regress between PRs.
- **Accessibility snapshot tests**: use Playwright's `page.accessibility.snapshot()` for component-level regression.

### Manual Testing Matrix (required before major releases)

| Tool | OS | Browser |
|---|---|---|
| NVDA (free) | Windows | Chrome |
| JAWS | Windows | Edge |
| VoiceOver | macOS | Safari |
| VoiceOver | iOS | Safari Mobile |
| TalkBack | Android | Chrome Mobile |

- Test all critical user flows: login, signup, core feature task, checkout/completion.
- Test with keyboard only (no mouse) across all flows.
- Test color contrast with Colour Contrast Analyser.
