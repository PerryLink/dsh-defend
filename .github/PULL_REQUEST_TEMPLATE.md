## Checklist

- [ ] All gates pass locally (`pnpm run typecheck && pnpm run typecheck:ci && pnpm test && pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack`)
- [ ] Tests added or updated for the behavior change (detection floors and clean-corpus regressions included)
- [ ] CHANGELOG.md updated under `[Unreleased]`
- [ ] All five README language versions updated (README.md is the source)
- [ ] Related issue linked (Fixes #… / Closes #…, if any)
- [ ] No secrets, tokens, credentials, or attack payload fragments in any committed file beyond the documented `fixtures/` regression set

## Description

<!-- What does this PR change and why? -->

## Verification

<!-- Commands actually run and their results. -->
