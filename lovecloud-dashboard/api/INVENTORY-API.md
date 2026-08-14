# LoveCloud Live Inventory API (v1)

Shared contract for **Lovable LoveCloud Nexus** (web GUI) and **Scriptable** (iOS widgets / tables).

## Authority rules

- Projection only — never invent DOCIDs or secret values.
- Secrets: **names + kind + presence** only. Values stay in 1Password.
- Live probes are read-only against Hostinger, Oracle, Tailscale, NPM, Git, rclone.

## Endpoint

```
GET /v1/inventory
Authorization: Bearer <token>   # Tailscale-only or short-lived vault token
```

Optional filters:

| Query | Example | Effect |
|---|---|---|
| `kinds` | `container,quadlet,subdomain` | Restrict kinds |
| `host` | `hostinger` \| `oracle` \| `shajesmba` | Host boundary |
| `status` | `verified_active,legacy_failed` | Status filter |
| `since` | ISO-8601 | Only resources changed after |

## Response shape

Matches `inventory/lovecloud-inventory.json`:

```json
{
  "schema_version": "1.0.0",
  "generated_at": "2026-08-10T15:00:00Z",
  "live": true,
  "refresh_hint_seconds": 60,
  "summary": { "total": 0, "by_kind": {}, "by_status": {} },
  "resources": [
    {
      "id": "abc123",
      "kind": "container",
      "name": "bookstack",
      "host": "hostinger",
      "endpoint": null,
      "status": "verified_active",
      "coverage": "host_only",
      "link": "https://bookstack.shannonjlove.cloud"
    }
  ]
}
```

### `kind` enum

`server` · `node` · `subdomain` · `container` · `quadlet` · `service` · `filesystem` · `cloud_storage` · `ssh_key` · `api_token` · `secret_item` · `repository` · `repository_secret` · `application` · `authority`

### `status` enum

`verified_active` · `configured_pending` · `legacy_failed` · `external_service` · `authority_control_plane` · `assumption`

## Live collectors (server plane)

| Source | Produces |
|---|---|
| `podman ps` / Quadlet units on Hostinger + Oracle | `container`, `quadlet` |
| `systemctl` unit state | `service` |
| NPM / proxy inventory | `subdomain` |
| `tailscale status --json` | `node` |
| `df` / rclone mounts / Koofr | `filesystem`, `cloud_storage` |
| GitHub API (private) | `repository` |
| 1Password Connect (item names only) | `ssh_key`, `api_token`, `secret_item` |

Suggested host: Oracle `ops` / existing `ops-agent` or a new `inventory-api` Quadlet publishing on Tailscale only (e.g. `100.67.229.94:8791`).

## Client refresh

- Scriptable: `Timer.schedule` / widget refresh + `Keychain` for base URL + token.
- Lovable Nexus: poll every `refresh_hint_seconds` (default 60) or SSE `/v1/inventory/stream` later.

## Bootstrap (now)

Until the live endpoint exists, clients may load the seed file:

`lovecloud-dashboard/inventory/lovecloud-inventory.json`

Set Scriptable `INVENTORY_URL` to a HTTPS URL that serves that JSON (Git raw, Lovable edge function, or Tailscale serve).
