# 01 - Build Plan Index

## Purpose

Make the Step 2 build visible at a modular level before task cards are executed.

## Build Modules

| Module | Build Area | Runtime Owner | Validation Location | Primary Tasks |
| --- | --- | --- | --- | --- |
| M01 | [module name] | [GitHub/Vercel/Oracle/etc.] | [validation location] | [task ids] |
| M02 | [module name] | [GitHub/Vercel/Oracle/etc.] | [validation location] | [task ids] |

## Required Plan Cross-References

- `build-pack/build-plans/02-ui-ux-build-plan.md` when user-facing.
- `build-pack/module-plans/M01-[module-name].md`
- `build-pack/module-plans/M02-[module-name].md`

## Execution Rules

- Do not collapse modules into a single large task.
- Split grouped task cards before implementation if they exceed the project sizing rule.
- Every task card must declare a validation location.
- Hosted app validation belongs to the intended hosting platform, not the local workstation.
- Runtime validation belongs to the approved runtime and permission boundary.
