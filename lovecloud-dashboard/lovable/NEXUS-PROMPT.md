# Lovable prompt — LoveCloud Nexus Live Ops GUI

Paste into LoveCloud Nexus (or send via `send_message`) once project ID is known.

---

Build a **LoveCloud Live Ops Dashboard** as the primary screen of this app.

## Purpose
Show Shannon’s entire LoveCloud estate graphically and refresh live from a shared inventory JSON API (same contract used by Scriptable).

## Data
- Fetch `GET {INVENTORY_URL}/v1/inventory` every 60s (or use `refresh_hint_seconds` from payload).
- Until live URL is configured, ship with an embedded seed matching schema_version `1.0.0` (resources have: id, kind, name, host?, endpoint?, status, coverage?, link?, remote?, objects?, bytes?).
- Secrets kinds (`ssh_key`, `api_token`, `secret_item`, `repository_secret`) show **name + kind only** — never secret values. Badge them “1Password authority”.

## UI (one coherent ops map, not a generic SaaS dashboard)
1. **Hero strip**: brand “LoveCloud”, LIVE/SEED badge, total resource count, last updated, failed/pending counts.
2. **Topology canvas** (main): nodes for `server` + `node`, with edges implied by `host` of containers/services/quadlets/subdomains. Click a node to filter the right rail.
3. **Kind rails / panels** (filterable chips): containers, quadlets, services, subdomains, filesystems, cloud_storage, repositories, ssh_keys, api_tokens.
4. Each resource card/row: name, host, status pill (verified_active=green, configured_pending=amber, legacy_failed=red), optional link out.
5. Search box across name/host/endpoint.
6. Dark ops aesthetic; no purple gradient kitsch; status color is the accent language.

## Behavior
- Auto-refresh without full page reload.
- Deep-link query `?kind=container&host=oracle`.
- Empty/error states if inventory fetch fails.
- Mobile responsive: canvas collapses to stacked kind sections.

## Non-goals
- Do not store secrets.
- Do not invent DOCIDs.
- Do not mutate remote infrastructure from the UI in v1 (read-only).

## Acceptance
Opening the app shows all kinds from the seed immediately; flipping INVENTORY_URL to a live endpoint updates counts within one refresh cycle without a redeploy.
