# Pre-Release Checklist

| Item | Status |
|------|--------|
| All unit tests green (contracts/backend/analytics) | ☐ |
| E2E tests green (`scripts/test-all.sh`) | ☐ |
| Contract storage layout unchanged or approved | ☐ |
| Gas impact reviewed (no unexpected regressions) | ☐ |
| ABI regenerated & committed | ☐ |
| Deploy scripts updated (if params changed) | ☐ |
| `deployments/sepolia.json` contains latest impl | ☐ |
| Security review of new env vars | ☐ |
| Rate limiting / throttling sane for release | ☐ |
| Changelog drafted (compare last tag) | ☐ |
| Version bump strategy decided (semver) | ☐ |
| Rollback plan validated (previous impl hash) | ☐ |
