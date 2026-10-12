# Mihomo Control card v17

A standalone Lovelace card for the Clash Controller integration. The card calls
Home Assistant entities and services; it does not need a router API token.
All instance-specific settings belong in the Lovelace configuration.

## Install or update

1. Download `dashboard/clash-dashboard.js` from this repository and copy it to
   `/config/www/clash-dashboard.js` on Home Assistant. Keep a backup of the
   previous file before replacing it.
2. Add a Lovelace **JavaScript module** resource with URL
   `/local/clash-dashboard.js?v=17`. If updating, replace the existing resource
   URL instead of registering the same card twice.
3. Reload Lovelace resources and refresh the open browser page. Replacing this
   JavaScript resource does not require a Home Assistant restart.
4. Add a manual card using [example.yaml](example.yaml). Set `device_id` to the
   actual Clash Controller device ID, not its config-entry ID. One way to obtain
   it is to select the device in Developer Tools → Actions →
   `clash_controller.get_latency_service`, then inspect the action YAML.

This card is versioned independently of the Python integration. Installing or
updating the HACS integration alone does **not** copy this card into `/config/www`.
The version badge in the card displays the integration version; it is not the
JavaScript card version. Python integration 0.3.5 and 0.3.6 are compatible with v17.

## Configuration

The example uses the integration's default `clash_instance` entity IDs. Confirm
these against your instance. Group rows have the form
`[entity_suffix, label, icon, exact_Mihomo_group_name]`, where `entity_suffix`
forms `select.clash_instance_<entity_suffix>`. Only configured rows are displayed.

- `primary`: the HA selector for the primary route (default
  `select.clash_instance_select`).
- `primary_group`: the exact corresponding Mihomo API group name (default
  `Select`). Preserve significant whitespace.
- `device_id`: the Clash Controller HA device used for latency actions; required
  to run diagnostics.
- `router_url`: optional URL for the full router dashboard. The button is hidden
  when this is empty. No address is embedded in the distributed card.
- `ping_url` / `ping_timeout`: probe target and timeout in milliseconds; defaults
  are `http://www.gstatic.com/generate_204` and `5000`.
- `service_urls`: per-group website probe URLs. An override replaces the map.

**Ping All** checks the primary route and every configured service group, with
at most two requests in flight. If the primary is already a visible row, it is
checked once using that row's API name. Failures and skipped routes appear in
the summary. Missing entities, pending selections and changed routes are skipped.
This is a route check, not a scan of every provider server. It does not change
selected proxies or the running mode. Probe history is maintained by Mihomo.

Website and server probes are shown separately. The group headline follows the
most recently completed result, so an earlier successful website check cannot
hide a newer failed server probe. A successful HTTP response does not prove
login, video playback, messaging or every service API works.

Results are discarded after a route/mode/connection change, including switching
away and back while a request is pending. Updating fallback telemetry without
changing the selected fallback node preserves results and open menus.

## Tests

Use Node.js 24 or later:

```sh
cd dashboard
npm ci
npm run check
npm test
```

The DOM tests cover stale responses, status ordering, fallback telemetry,
primary-route batch checks, concurrent requests, controls and menu behaviour.
They do not replace a visual test in an actual Home Assistant browser.

## Rollback

Restore the previous `/config/www/clash-dashboard.js`, restore its previous
resource query version, reload Lovelace resources and refresh the page. Existing
entity IDs, device settings and router routing choices do not need to change.
