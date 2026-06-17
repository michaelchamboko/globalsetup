---
name: accessibility-audit
description: WCAG 2.2 AA accessibility audit — automated scanning, keyboard testing, and screen reader verification for any web interface.
argument-hint: [URL or component to audit]
---

# Accessibility Audit Skill

Accessibility audits must always combine automated scanning (catches ~30-40% of issues) with manual keyboard testing and screen reader verification (catches the remaining ~60-70%).

## Phase 1 — Automated Scan

1. **Run axe-core** against the target page or component:
   - In browser: install the axe DevTools browser extension and run on the target page.
   - In CI: use `@axe-core/playwright` or `jest-axe` for automated regression.
   - Document all violations by: rule ID, severity (critical/serious/moderate/minor), element selector, and recommended fix.

2. **Run Lighthouse Accessibility audit**:
   - Target: score ≥ 90.
   - Identify any score regressions from the previous audit.

3. **Check color contrast**:
   - Use the Colour Contrast Analyser tool or Chrome DevTools CSS Overview panel.
   - Verify: 4.5:1 for normal text, 3:1 for large text (≥ 18pt regular or ≥ 14pt bold), 3:1 for UI components and focus indicators.

4. **Document all automated findings** in a table: issue, severity, WCAG criterion, affected element, recommended fix.

## Phase 2 — Keyboard Navigation Test

5. **Tab through the entire page** using only the keyboard (no mouse):
   - Can you reach every interactive element via Tab?
   - Is the tab order logical (follows visual reading order)?
   - Does each focusable element have a clearly visible focus indicator?

6. **Test all interactive patterns**:
   - Buttons: activated with Enter and Space?
   - Links: activated with Enter?
   - Modals: focus trapped inside? Closed with Escape? Focus returns to trigger on close?
   - Dropdowns/menus: arrow key navigation works? Escape closes?
   - Forms: all fields reachable? Error messages associated with inputs?

7. **Test skip navigation**: Is there a "Skip to main content" link as the first focusable element? Does it work?

## Phase 3 — Screen Reader Testing

8. **Test with at least two combinations from this matrix**:
   - NVDA + Chrome (Windows)
   - JAWS + Edge (Windows)
   - VoiceOver + Safari (macOS / iOS)
   - TalkBack + Chrome (Android)

9. **For each screen reader, verify**:
   - Page title is announced correctly on load.
   - Headings are announced with level (e.g., "Heading level 2: Dashboard").
   - All images have meaningful announcements (or are announced as decorative).
   - Forms: labels are read when inputs receive focus. Errors are announced.
   - Dynamic content updates: `aria-live` regions announce changes without reading the full page.
   - Buttons and links are distinguished ("button" vs. "link" in announcement).

## Phase 4 — Document & Fix

10. **Categorize all findings** by WCAG criterion and severity:
    - **Critical** (must fix before launch): Missing alt text, keyboard traps, unlabeled form fields.
    - **Serious** (fix within 1 sprint): Color contrast failures, missing form error association.
    - **Moderate** (fix within 2 sprints): Missing focus indicators, incorrect heading order.
    - **Minor** (fix in backlog): Redundant alt text, suboptimal ARIA usage.

11. **Create task cards** for each Critical and Serious finding with: specific element, WCAG criterion violated, recommended fix, and acceptance test.

12. **Re-run automated scan after fixes** to confirm resolution. Accessibility regressions block deployment.
