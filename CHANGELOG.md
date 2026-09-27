# Changelog

## 0.3.5

- Require Home Assistant administrator access for proxy API mutations, core restarts and connection closures. Keep read-only API and connection queries available to read-only users.
- Preserve explicit HTTPS URLs during setup.
- Reject supplied connection filters that contain no keywords.
- Give colliding group/provider names distinct, stable Home Assistant entity IDs while retaining existing IDs when a registered entity identifies its name.
- Reuse recent group-delay probes and locate groups from the coordinator's current data.
- Report Netflix status as unknown when redirected to login or when catalog access cannot be verified.
- Run tests on pushes to `main` and validate version tags before publishing a release.
