// LoveCloud Widget — Scriptable (home-screen)
// Medium/large widget. Same inventory contract as LoveCloud-Dashboard.js

const KIND_SPOTLIGHT = ["container", "quadlet", "subdomain", "node", "server", "service"];

async function loadInventory() {
  if (Keychain.contains("lovecloud.inventory.url")) {
    const req = new Request(Keychain.get("lovecloud.inventory.url"));
    if (Keychain.contains("lovecloud.inventory.token")) {
      req.headers = {
        Authorization: `Bearer ${Keychain.get("lovecloud.inventory.token")}`,
      };
    }
    return await req.loadJSON();
  }
  const fm = FileManager.iCloud();
  const path = fm.joinPath(fm.documentsDirectory(), "lovecloud-inventory.json");
  if (!fm.fileExists(path)) {
    throw new Error("Missing lovecloud-inventory.json / Keychain URL");
  }
  fm.downloadFileFromiCloud(path);
  return JSON.parse(fm.readString(path));
}

async function createWidget(inv) {
  const w = new ListWidget();
  w.setPadding(12, 14, 12, 14);
  w.backgroundGradient = (() => {
    const g = new LinearGradient();
    g.locations = [0, 1];
    g.colors = [new Color("#071018"), new Color("#122033")];
    return g;
  })();

  const kinds = (inv.summary && inv.summary.by_kind) || {};
  const failed = (inv.summary && inv.summary.by_status && inv.summary.by_status.legacy_failed) || 0;
  const pending = (inv.summary && inv.summary.by_status && inv.summary.by_status.configured_pending) || 0;

  const top = w.addStack();
  top.layoutHorizontally();
  const title = top.addText("LoveCloud");
  title.font = Font.boldSystemFont(15);
  title.textColor = Color.white();
  top.addSpacer();
  const live = top.addText(inv.live ? "LIVE" : "SEED");
  live.font = Font.boldSystemFont(10);
  live.textColor = inv.live ? new Color("#3DDC97") : new Color("#F0A202");

  w.addSpacer(8);
  const total = w.addText(String(inv.summary?.total ?? inv.resources?.length ?? 0));
  total.font = Font.boldSystemFont(28);
  total.textColor = Color.white();
  const sub = w.addText("resources");
  sub.font = Font.systemFont(11);
  sub.textColor = new Color("#8aa0b5");

  w.addSpacer(8);
  for (const k of KIND_SPOTLIGHT) {
    if (!kinds[k]) continue;
    const row = w.addStack();
    row.layoutHorizontally();
    const label = row.addText(k);
    label.font = Font.systemFont(11);
    label.textColor = new Color("#9fb3c8");
    row.addSpacer();
    const n = row.addText(String(kinds[k]));
    n.font = Font.semiboldSystemFont(11);
    n.textColor = Color.white();
    w.addSpacer(2);
  }

  w.addSpacer();
  const alerts = w.addText(
    failed || pending ? `${failed} failed · ${pending} pending` : "all clear"
  );
  alerts.font = Font.mediumSystemFont(10);
  alerts.textColor = failed ? Color.red() : pending ? Color.orange() : new Color("#3DDC97");

  if (config.runsInWidget) Script.setWidget(w);
  else await w.presentMedium();
}

const inv = await loadInventory();
await createWidget(inv);
Script.complete();
