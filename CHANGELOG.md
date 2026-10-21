# Changelog

## 0.3.7

- Fix Fallback groups silently losing automatic switching: selecting a node pins it in
  Mihomo (`fixed`), and there was no way to undo that from Home Assistant. Fallback and
  pinnable URLTest selectors now offer `↺ Auto`, which clears the pin, and expose
  `fixed`/`pinned_node` attributes.
- Create proxy groups marked `hidden: true` in the core config as disabled entities.
  Already registered entities keep their current enabled state.

## 0.3.6

- Publish the companion Mihomo Control card v17 with corrected diagnostic status,
  stable fallback telemetry and a primary-route check in Ping All.
- Keep the Python integration behavior unchanged from 0.3.5. The standalone card
  still needs to be installed as a separate Lovelace resource.

## 0.3.5

- Require Home Assistant administrator access for proxy API mutations, core restarts and connection closures. Keep read-only API and connection queries available to read-only users.
- Preserve explicit HTTPS URLs during setup.
- Reject supplied connection filters that contain no keywords.
- Give colliding group/provider names distinct, stable Home Assistant entity IDs while retaining existing IDs when a registered entity identifies its name.
- Reuse recent group-delay probes and locate groups from the coordinator's current data.
- Report Netflix status as unknown when redirected to login or when catalog access cannot be verified.
- Run tests on pushes to `main` and validate version tags before publishing a release.
