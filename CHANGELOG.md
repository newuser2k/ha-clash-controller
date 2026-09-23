# Changelog

## 0.2.3

- Show the installed Clash Controller integration version next to the dashboard title.
- Expose the integration version as an attribute on proxy group selectors.
- Label the Home Assistant API footer without presenting a stale Mihomo core version as the integration version.

## 0.2.2

- Preserve exact proxy group and node names when changing a selector. This fixes HTTP 400 errors when configured node names contain leading or trailing whitespace.
