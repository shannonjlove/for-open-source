#!/usr/bin/env bash
# Install yt-dlp + headless JDownloader on LoveCloud Oracle (run ON oracle-sos as root/shannonjlove).
set -euo pipefail
USER_HOME="${SUDO_USER:+$(getent passwd "$SUDO_USER" | cut -d: -f6)}"
USER_HOME="${USER_HOME:-/home/shannonjlove}"
BASE="$USER_HOME/downloaders"
JD_DIR="$BASE/jdownloader"
YT_DIR="$BASE/yt-dlp"
OUT="$BASE/out"
mkdir -p "$JD_DIR" "$YT_DIR" "$OUT"

echo "== yt-dlp =="
if ! command -v yt-dlp >/dev/null 2>&1; then
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  chmod a+rx /usr/local/bin/yt-dlp
fi
yt-dlp --version

# Prefer writable E2 inbox via rclone remote if present
REMOTE=""
if rclone listremotes 2>/dev/null | grep -qx 'idrive-e2:'; then
  REMOTE="idrive-e2:nexus-01000-inbox/downloaders"
elif rclone listremotes 2>/dev/null | grep -qx 'lovecloud-e2:'; then
  REMOTE="lovecloud-e2:inbox-idrive-e2/01001-uploads/downloaders"
fi
if [[ -n "$REMOTE" ]]; then
  rclone mkdir "$REMOTE/yt-dlp" 2>/dev/null || true
  rclone mkdir "$REMOTE/jdownloader" 2>/dev/null || true
  echo "Cloud remotes ready under $REMOTE"
fi

cat > "$YT_DIR/download.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
URL="${1:?url required}"
LOCAL="${HOME}/downloaders/out/yt-dlp"
mkdir -p "$LOCAL"
yt-dlp -o "${LOCAL}/%(upload_date)s-%(title).200B [%(id)s].%(ext)s" \
  --no-mtime --embed-metadata --embed-thumbnail --write-info-json \
  "$URL"
# Sync to E2 if remote configured
if rclone listremotes 2>/dev/null | grep -qx 'idrive-e2:'; then
  rclone copy "$LOCAL" "idrive-e2:nexus-01000-inbox/downloaders/yt-dlp" --progress
elif rclone listremotes 2>/dev/null | grep -qx 'lovecloud-e2:'; then
  rclone copy "$LOCAL" "lovecloud-e2:inbox-idrive-e2/01001-uploads/downloaders/yt-dlp" --progress
fi
echo DONE
SH
chmod +x "$YT_DIR/download.sh"

echo "== JDownloader headless =="
# Official headless: download JD2 linux arm64/x64 jar installer or use existing java
ARCH=$(uname -m)
if [[ ! -x "$JD_DIR/JDownloader.jar" && ! -f "$JD_DIR/JDownloader.jar" ]]; then
  cd "$JD_DIR"
  # Multi-OS jar bootstrap
  curl -L -o JDownloader.jar 'http://installer.jdownloader.org/JDownloader.jar' || \
    curl -L -o JDownloader.jar 'https://installer.jdownloader.org/JDownloader.jar'
fi
# systemd user unit template
UNIT_DIR="$USER_HOME/.config/systemd/user"
mkdir -p "$UNIT_DIR"
cat > "$UNIT_DIR/jdownloader.service" <<UNIT
[Unit]
Description=JDownloader 2 headless
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$JD_DIR
ExecStart=/usr/bin/java -Djava.awt.headless=true -jar $JD_DIR/JDownloader.jar -norestart
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
UNIT

echo "Next:"
echo "  1) Install Java 17+ if missing"
echo "  2) systemctl --user daemon-reload && systemctl --user enable --now jdownloader"
echo "  3) Connect MyJDownloader (email/password from 1Password Jdownloader2026)"
echo "  4) In JD Settings → set download folder to cloud mount or $OUT/jdownloader"
echo "  5) yt-dlp: $YT_DIR/download.sh <url>"
