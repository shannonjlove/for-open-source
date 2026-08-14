# LoveCloud Live Dashboard (Scriptable + Lovable Nexus)

Graphical, live-updating LoveCloud ops surface spanning:

- **Lovable LoveCloud Nexus** — full GUI (topology + kind panels)
- **Scriptable** — iOS table + home-screen widgets

## Status

| Layer | Status |
|---|---|
| Inventory seed JSON | Ready (`inventory/lovecloud-inventory.json`, 237 resources) |
| API contract | Ready (`api/INVENTORY-API.md`) |
| Scriptable dashboard + widget | Ready (`scriptable/*.js`) |
| Lovable Nexus GUI wiring | **Blocked** — Lovable `list_projects` MCP schema bug; need project URL/ID |
| Live collectors on Oracle/Hostinger | Not deployed yet (seed `live: false`) |

## Install Scriptable (iPhone / iPad)

1. Copy into Scriptable iCloud Documents:
   - `scriptable/LoveCloud-Dashboard.js`
   - `scriptable/LoveCloud-Widget.js`
   - `inventory/lovecloud-inventory.json`
2. Optional live URL:
   ```
   Keychain.set("lovecloud.inventory.url", "https://…/v1/inventory")
   Keychain.set("lovecloud.inventory.token", "…")
   ```
3. Run **LoveCloud Dashboard** for the filterable table.
4. Add **LoveCloud Widget** to the Home Screen (medium).

## Secrets policy

SSH keys / API tokens appear as **metadata only** (1Password item names). Values are never included.

## Next unblock

Paste the LoveCloud Nexus Lovable URL (`https://lovable.dev/projects/...`) or project ID so the Lovable agent can build the graphical GUI against this inventory contract.
