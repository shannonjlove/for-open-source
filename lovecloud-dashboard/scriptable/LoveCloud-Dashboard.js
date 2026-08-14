// LoveCloud Dashboard — Scriptable
// Live inventory GUI (table + filters). Shares contract with Lovable Nexus.
//
// Setup:
// 1. Keychain.set("lovecloud.inventory.url", "https://…/v1/inventory")
// 2. Keychain.set("lovecloud.inventory.token", "<bearer>")  // optional
// 3. Or drop lovecloud-inventory.json beside this script as a fallback.

const KIND_ORDER = [
  "server",
  "node",
  "subdomain",
  "container",
  "quadlet",
  "service",
  "filesystem",
  "cloud_storage",
  "repository",
  "ssh_key",
  "api_token",
  "secret_item",
  "application",
  "authority",
];

const STATUS_COLOR = {
  verified_active: Color.green(),
  configured_pending: Color.orange(),
  legacy_failed: Color.red(),
  external_service: Color.gray(),
  authority_control_plane: Color.blue(),
  assumption: Color.purple(),
};

async function loadInventory() {
  const url = Keychain.contains("lovecloud.inventory.url")
    ? Keychain.get("lovecloud.inventory.url")
    : null;

  if (url) {
    const req = new Request(url);
    if (Keychain.contains("lovecloud.inventory.token")) {
      req.headers = {
        Authorization: `Bearer ${Keychain.get("lovecloud.inventory.token")}`,
      };
    }
    req.timeoutInterval = 20;
    const data = await req.loadJSON();
    return data;
  }

  // Fallback: local seed copied into Scriptable iCloud folder
  const fm = FileManager.iCloud();
  const path = fm.joinPath(fm.documentsDirectory(), "lovecloud-inventory.json");
  if (fm.fileExists(path)) {
    fm.downloadFileFromiCloud(path);
    return JSON.parse(fm.readString(path));
  }

  throw new Error(
    "No inventory source. Set Keychain lovecloud.inventory.url or add lovecloud-inventory.json"
  );
}

function statusTint(status) {
  return STATUS_COLOR[status] || Color.gray();
}

function summarize(inv) {
  const s = inv.summary || {};
  const byKind = s.by_kind || {};
  const lines = KIND_ORDER.filter((k) => byKind[k])
    .map((k) => `${k}: ${byKind[k]}`)
    .join(" · ");
  return {
    total: s.total ?? (inv.resources || []).length,
    live: !!inv.live,
    generated: inv.generated_at || "unknown",
    lines,
  };
}

async function pickKind(inv) {
  const kinds = Object.keys((inv.summary && inv.summary.by_kind) || {})
    .sort((a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b));
  const options = ["All kinds", ...kinds];
  const idx = await args.shortcutParameter
    ? 0
    : await generateAlert("LoveCloud — filter kind", options);
  return idx <= 0 ? null : options[idx];
}

async function generateAlert(title, options) {
  const a = new Alert();
  a.title = title;
  a.message = "Choose a resource kind";
  for (const o of options) a.addAction(o);
  a.addCancelAction("Cancel");
  const i = await a.presentSheet();
  if (i < 0) Script.complete();
  return i;
}

async function showTable(inv, kindFilter) {
  const table = new UITable();
  table.showSeparators = true;

  const sum = summarize(inv);
  const header = new UITableRow();
  header.isHeader = true;
  header.addText(
    `LoveCloud ${sum.live ? "LIVE" : "SEED"} · ${sum.total} resources`
  );
  table.addRow(header);

  const meta = new UITableRow();
  meta.addText(`Updated ${sum.generated}`);
  table.addRow(meta);

  const resources = (inv.resources || [])
    .filter((r) => !kindFilter || r.kind === kindFilter)
    .sort((a, b) => {
      const ka = KIND_ORDER.indexOf(a.kind);
      const kb = KIND_ORDER.indexOf(b.kind);
      if (ka !== kb) return ka - kb;
      return String(a.name).localeCompare(String(b.name));
    });

  let lastKind = null;
  for (const r of resources) {
    if (r.kind !== lastKind) {
      lastKind = r.kind;
      const sec = new UITableRow();
      sec.isHeader = true;
      sec.addText(r.kind.toUpperCase());
      table.addRow(sec);
    }
    const row = new UITableRow();
    row.dismissOnSelect = false;
    const title = row.addText(r.name, [r.host, r.endpoint, r.coverage]
      .filter(Boolean)
      .join(" · "));
    title.titleFont = Font.semiboldSystemFont(14);
    title.subtitleFont = Font.systemFont(11);
    const st = row.addText(r.status || "?");
    st.titleColor = statusTint(r.status);
    st.rightAligned();
    if (r.link) {
      row.onSelect = () => Safari.openInApp(r.link);
    }
    table.addRow(row);
  }

  await table.present();
}

async function createWidget(inv) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#0b1220");
  const sum = summarize(inv);

  const title = w.addText("LoveCloud");
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();

  const badge = w.addText(sum.live ? "LIVE" : "SEED");
  badge.font = Font.mediumSystemFont(10);
  badge.textColor = sum.live ? Color.green() : Color.orange();

  w.addSpacer(6);
  const total = w.addText(`${sum.total} resources`);
  total.font = Font.semiboldSystemFont(22);
  total.textColor = Color.white();

  w.addSpacer(4);
  const kinds = inv.summary?.by_kind || {};
  const spotlight = ["container", "quadlet", "subdomain", "node", "server"]
    .filter((k) => kinds[k])
    .map((k) => `${kinds[k]} ${k}`)
    .join("\n");
  const body = w.addText(spotlight || sum.lines);
  body.font = Font.systemFont(11);
  body.textColor = new Color("#9fb3c8");
  body.lineLimit = 6;

  w.addSpacer();
  const foot = w.addText(String(sum.generated).replace("T", " ").slice(0, 19));
  foot.font = Font.systemFont(9);
  foot.textColor = new Color("#6b7c8f");

  if (config.runsInWidget) {
    Script.setWidget(w);
  } else {
    await w.presentMedium();
  }
}

async function main() {
  const inv = await loadInventory();
  if (config.runsInWidget) {
    await createWidget(inv);
  } else {
    const kind = await pickKind(inv);
    await showTable(inv, kind);
  }
}

await main();
Script.complete();
