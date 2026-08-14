# LoveCloud — File Naming & Tagging Service: Analysis, Optimization, and Implementation Standard

**Document type:** Controlled design analysis and implementation standard (non-executable)  
**System:** LoveCloud / SJL Sovereign Cloud  
**Prepared:** 2026-08-11, America/Chicago  
**Owner:** Shannon J. Love  
**Classification:** Internal; sanitized operational documentation  
**Status:** Design recommendation; Wave 0 discovery incomplete; deployment remains approval-gated  
**DOCID:** PENDING — only the live PostgreSQL DOCID Registry may allocate a permanent DOCID  
**Human-readable authority:** BookStack  
**Executable authority:** Private Git System Registry  
**Secrets authority:** 1Password  

**Parent standards:** [LoveCloud v10.3](https://bookstack.shannonjlove.cloud/books/system-canonical-profile-configuration-file/page/lovecloud-v103-always-on-server-authority-postgresql-docid-registry-and-governed-koofr-projection) · [LoveCloud v10.3.1](https://bookstack.shannonjlove.cloud/books/system-canonical-profile-configuration-file/page/lovecloud-v1031-consolidated-architecture-governance-standard)

---

## 1. Purpose

Define how LoveCloud should implement **canonical file naming and controlled tagging** as an always-on server-plane service (rootless Podman Quadlet), without violating DOCID, PARA, quarantine, or authority rules already approved in v10.3 / v10.3.1.

This page **analyzes and optimizes** a 2026-08-11 design thread that proposed language options, runtime shapes, and a large Python/FastAPI draft. It does **not** authorize deployment, invent registry schema, or treat sample code as executable authority.

---

## 2. Verdict (optimized recommendation)

| Decision | Choice | Evidence status |
|---|---|---|
| Language | **Python 3.13** for the first policy engine | Proposed |
| Runtime | **Rootless Podman Quadlet** on the always-on server plane | Inherited from v10.3 |
| Intake primary | Authenticated internal API + durable job state in PostgreSQL | Proposed; must import live registry contracts |
| Intake secondary | Narrow timer/scanner over the Hostinger pilot path only | Inherited pilot path |
| Watcher / Hazel ownership | Optional adapters only; never own DOCID or completion | Verified against v10.3 |
| DOCID | **Registry API only** — never mint client-side | Verified non-negotiable |
| Tags | Split **controlled / extracted / suggested** | Proposed; aligns with v10.3 §8 |

**Do not ship** the chat draft that locally invented `DOC_{YYYYMM}_{uuid}` values. That path is **Rejected**.

---

## 3. Analysis of the thread draft — what to keep vs reject

### 3.1 Keep (aligned with v10.3.1)

- Always-on server plane owns naming/tagging; ShaJe'sMBA is optional.
- Canonical filename pattern:

```text
[PARA]_[DATE]__[DOCID]__[TITLE]__[VERSION]__[SHA8].[EXT]
```

- Fail closed when PostgreSQL is unavailable → `PENDING` or quarantine, never a permanent local DOCID.
- Three tag classes: controlled vocabulary, extracted facts with provenance, suggested candidates requiring approval.
- Quadlet + systemd for restart, limits, journald, least privilege.
- Narrow pilot boundary:

```text
/srv/sjl/010000_INBOX__lovecloud-hostinger/hazel-ready
```

- Rejected path (must not appear in automation): `/srv/sjl/010000/INBOX/lovecloud-hostinger-hazel-ready`.
- Immutable raw + lossless JSON sidecar before `canonical_status=true`.
- Timer-based reconciliation as a fallback even if an API exists.

### 3.2 Reject or rewrite (critical defects in the draft implementation)

| Defect | Why it fails governance | Required correction |
|---|---|---|
| Local DOCID mint: `DOC_{date}_{uuid}` | Violates sole PostgreSQL allocator | Call live `registry-api`; on failure leave `PENDING-*` intake id or quarantine |
| Assumed `documents` table | Live registry tables are `objects`, `versions`, `endpoints`, … (observed claim) | Import live schema/API; do not invent tables |
| `file_path.rename(...)` to “canonical” in place | Skips immutable raw, version compare, receipts, projection | Preserve raw; write canonical only after gates; record receipts |
| Broad `ALLOWED_EXTENSIONS` hardcode | Policy must be versioned vocabulary + validation | Controlled vocabulary in Git; fail closed on unknown types |
| Blocking `time.sleep` in async path | Unreliable stabilization; poor for workers | Stable size+mtime window; prefer timer scan over naive watchers |
| `ReadOnly=true` Quadlet with rw intake/quarantine volumes | Contradictory illustrative unit | Read-only rootfs with explicit writable mounts only where required |
| Publishing illustrative Quadlet/Dockerfile as deployable | Paths, DSN, image digest, secrets unresolved | Wave 0 discovery → reviewed Git manifests only |
| Silent `except: pass` on quarantine errors | Hides fail-closed evidence | Structured quarantine reason + audit event |
| Suggested tags written as if promotable | Free-form / ML must not become canonical | Keep in `suggested_*` until human/policy accept |

### 3.3 Optimize (architecture shape)

Prefer a **thin naming/tagging policy package** called by the existing intake pipeline, not a second parallel “document registry.”

```text
Authenticated intake
        → stabilize + preserve immutable raw
        → validate (type/size/archive/security)
        → SHA-256 + byte_length
        → PostgreSQL DOCID recover/allocate (registry-api only)
        → deterministic metadata extraction
        → propose PARA + controlled tags (+ optional suggested)
        → version compare
        → generate canonical filename + sidecar
        → register relationships / projections / receipts
        → canonical_status=true | quarantine
```

For the pilot, start with:

1. **One Quadlet** exposing an internal authenticated API (`/health`, `/v1/jobs`, `/v1/jobs/{id}`).
2. **One systemd timer** calling `POST /v1/scan` (or CLI oneshot) against the allowlisted intake directory.
3. Job/idempotency state in PostgreSQL (existing registry or an approved adjacent schema — **Pending Discovery** until Wave 0).

Defer NATS/Rabbit/Redis until an approved broker already exists. Prefer PostgreSQL queue/outbox patterns already implied by v10.3.1.

---

## 4. Language and runtime options (condensed)

| Option | Role | When to choose |
|---|---|---|
| **Python** | Recommended policy engine | Hashing, MIME, PDF/image adapters, Pydantic contracts, pytest |
| TypeScript/Node | Alternative if registry-api and gateway are already Node with shared schemas | Prefer shared OpenAPI types over dual stacks |
| Go | Narrow hardened watcher/shim | Not first choice for enrichment growth |
| Rust | Archive-safety / hostile-input validator component | Later, not the orchestrator |
| Shell | Deploy/diagnostics helpers only | Never own filenames or DOCIDs |
| Hazel / macOS | Submission adapter only | Must not own completion while Mac is offline |

**Always-on requirement:** run as a reviewed rootless Quadlet (or documented systemd exception). Enable user lingering if the service is a rootless user unit. Exact host (Hostinger vs Oracle) remains **Pending Discovery** for this component; Oracle is preferred for registry-adjacent compute, Hostinger for the intake edge.

---

## 5. Required functions (implementation surface)

These are the **functions to build** (names are normative for Wave 1 contracts; signatures may adapt to the live registry API).

### 5.1 Identity and hashing

- `stabilize_file(path) -> StabilizedFile` — unchanged size and mtime across N checks; reject partial uploads.
- `compute_content_identity(path) -> {sha256, sha8, byte_length}` — full SHA-256; never truncate for identity.
- `safe_path_under(root, path) -> Path` — reject traversal, symlinks outside root, and non-allowlisted mounts.

### 5.2 Registry (DOCID)

- `lookup_or_request_docid(sha256, byte_length, source_event) -> DocIdResult`  
  - Success: permanent DOCID from PostgreSQL.  
  - Unavailable / conflict: `pending_intake_id` or quarantine reason `REGISTRY_*` — **never invent**.
- `record_event(correlation_id, stage, payload)` — immutable audit; correlation ID ≠ DOCID before allocation.

### 5.3 Naming

- `sanitize_title(raw) -> TITLE` — deterministic rules (charset, length, collapse whitespace/hyphens); no model creativity in the filename slot.
- `propose_para(evidence) -> {para_code, confidence, pending_review}` — six-digit only; ambiguous → pending.
- `build_canonical_filename(para, date, docid, title, version, sha8, ext) -> str` — exact pattern; unit-tested.

### 5.4 Tagging

- `extract_metadata(path, mime) -> ExtractedMetadata` — facts with provenance.
- `apply_controlled_tags(vocab, para, mime, policy) -> ControlledTags` — vocabulary-only.
- `suggest_tags(path, metadata, model_or_rules) -> SuggestedTags` — candidates only; never auto-promote.
- `validate_sidecar(doc) -> ValidationResult` — against versioned JSON Schema (v10.3.1 §7).

### 5.5 Outcomes

- `write_sidecar(path, doc)` — lossless JSON beside canonical object.
- `quarantine(path, reason_code, evidence)` — named reasons from v10.3.1 §9.
- `complete_or_pending(gates) -> {canonical_status: bool}` — all mandatory gates or false.

---

## 6. Tag classes (normative)

### Controlled (canonical only after accept)

Examples:

```text
system=LoveCloud
classification=internal-sanitized
para=040100
artifact=architecture-standard
lifecycle=active
```

### Extracted (facts)

```text
mime_type=application/pdf
page_count=14
created_at=2026-08-11T21:00:00Z
sha256=<64 lowercase hex>
```

### Suggested (approval required)

```text
suggested_topic=storage-governance
confidence=0.82
provenance=rules-v0.1
```

Suggested tags must not silently become controlled tags.

---

## 7. Quadlet / systemd role (illustrative only)

Quadlet converts declarative container files into systemd-managed services (boot, restart, limits, journald). Exact image digest, mounts, UID, EnvironmentFile, and host remain **Pending Discovery**.

Minimum service behaviors:

- `Restart=on-failure` with bounded restart budget.
- Lightweight `/health` (no heavy interpreter spawn every 30s solely for healthchecks — see v10.3.1 §6.1).
- Separate readiness (may accept jobs) vs liveness (needs intervention).
- Resource limits measured in Wave 1; OCR/vision workers get separate limits later.
- Secrets via 1Password-resolved runtime env — never in Git, BookStack, sidecars, or chat.

A **systemd timer** (e.g. every 15 minutes) should reconcile the pilot directory even if inotify/watchdog is used.

---

## 8. Hard stops (do not implement past these)

Stop before writing code that would:

1. Mint or format a permanent DOCID outside PostgreSQL.
2. Assume a `documents` table or invent schema fields.
3. Watch broad trees outside the approved pilot path.
4. Require ShaJe'sMBA, Hazel, Hookmark, or Koofr availability for progress.
5. Promote suggested/ML tags to controlled without approval.
6. Declare `canonical_status=true` without sidecar schema validation and registry read-back.
7. Embed secrets or unresolved image digests in BookStack or chat artifacts.
8. Deploy host-only Quadlets not imported into the private Git System Registry.

---

## 9. Wave alignment

| Wave | Work for naming/tagging | Exit |
|---|---|---|
| **0** | Revalidate registry-api OpenAPI, schema hash, pilot path, Quadlet inventory | No unknown pointer for the pilot |
| **1** | Filename, sidecar, tag vocabulary, quarantine reason schemas + fixtures + tests | Offline contracts pass; no secrets in fixtures |
| **2** | Package reviewed Quadlet + API/worker in Git; hash parity with intended host | Reviewed Git matches intended runtime |
| **3** | Hostinger pilot fixtures (success, duplicate, partial upload, registry outage, bad name) | Evidence retained; ShaJe'sMBA offline success |
| **4** | Expand sources only after capacity and restore drills | Explicit production sign-off |

---

## 10. Current claim status

| Claim | Status |
|---|---|
| Canonical filename pattern and DOCID rules | **Verified** in BookStack pages 50 and 51 |
| Always-on Quadlet direction for Linux workloads | **Inherited** from v10.3 |
| Oracle PostgreSQL as sole DOCID authority | **Inherited**; revalidate before mutation |
| Live registry API request/response for allocate/lookup | **Pending Discovery** |
| Exact host, image, service user, env injection for this service | **Pending Discovery** |
| Chat draft full FastAPI implementation | **Rejected** as executable authority (DOCID invention + invented schema) |

---

## 11. Next approved actions (read-only first)

1. Wave 0: export live `registry-api` contract and schema hash; compare to private Git.
2. Capture OpenAPI for DOCID lookup/allocate and pending_intake behavior.
3. Draft Wave 1 JSON Schema for sidecar + controlled vocabulary in Git (not in this page as fake schema SQL).
4. Present exact mutation targets, backups, rollback, and validation for separate approval before any Quadlet deploy.

---

## 12. Supersession

This page does not supersede v10.3 or v10.3.1. Where the 2026-08-11 chat draft conflicts with those standards (especially local DOCID minting and invented registry tables), **this page and v10.3.1 prevail**; the draft is archival analysis only.
