---\nname: debug-fix\ndescription: Find and fix a bug. Supports careful default and --fast hotfix modes.\nargument-hint: [issue description] [optional: --fast]\n---\n\nFind and fix a bug:

1. **Understand**: Read the stack trace, error, or issue description.
2. **Default (Careful)**:
   - Reproduce the bug reliably.
   - Investigate the call chain and find where bad data originates.
   - Write a regression test.
   - Implement the minimal fix.
   - Verify that the test fails without the fix and passes with it.
3. **--fast (Emergency Hotfix)**:
   - Create a hotfix/* branch from production.
   - Implement a minimal surgical change.
   - Run critical tests only and verify the fix.
   - Create a hotfix PR.
