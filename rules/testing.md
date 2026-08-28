---
alwaysApply: false
---

# Testing & Verification Rules

These rules govern the implementation and execution of automated tests and release gates.

## 1. Intended-Location Validation Model (Delivery Gate)
We enforce validation where the system is intended to run:
* **Tier 1 (Micro-Task Validation)**: Each task card must declare a validation location and a validation command/check. The check must pass in that location before the task is marked complete.
* **Tier 2 (Hosted/Runtime Validation)**: For hosted applications, push source changes to GitHub and use the approved hosting platform's deployment and runtime evidence as a `receipt` gate. Do not use GitHub Actions runners.
* **Local Build Prohibition**: Do not run local dependency installs, local production builds, local dev servers, or full local typechecks by default. Local preview requires explicit operator opt-in.

## 2. Test Execution & Feedback
* Run or observe the specific, targeted validation check after changes, not a full local app build, during development. This provides faster feedback and respects operator machine limits.
* Flaky test? Fix it or delete it. Never retry in a loop to make it pass.

## 3. Test Design Conventions
* Verify behavior, not implementation details. Assert output states and values rather than verifying internal function call counts.
* Prefer real implementations. Mock only at system boundaries (network services, filesystem, system clock, randomness).
* Follow the Arrange-Act-Assert (AAA) pattern.
* Keep each test focused on one behavior. Test names must describe the expected behavior.
* Avoid control flow that obscures the scenario; compact table-driven cases are acceptable when they improve clarity.
* Never use dummy assertions like `expect(true)`. Always verify exact arguments and returns.
