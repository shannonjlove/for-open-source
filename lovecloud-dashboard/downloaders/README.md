# LoveCloud downloaders (JD + Downie + TorBox)

Unified workflow for remote/cloud saves. **Primary path:** writable `rclone nfsmount` of LoveCloud E2 downloaders. TorBox for remote torrents/debrid. ExpanDrive is no longer used for this landing. Full-bucket NFS mounts stay browse/read-only. Offcloud optional/secondary.

## Architecture

```text
TorBox (remote magnets/torrents) ──► TorBox cloud / WebDAV
        │                              └─► Jellyfin via TorBox Media Center (.strm)
        └─► export/pull ──► E2-Downloaders/torbox/

Downie ──► ~/LoveCloud/E2-Downloaders/downie/
JDownloader (+ MyJDownloader) ──► …/jdownloader/
        └─► rclone nfsmount (LaunchAgent) ──► lovecloud-e2:inbox-idrive-e2/01001-uploads/downloaders/
```

## Mac cloud landing (writable)

`~/LoveCloud/E2-Downloaders/`  
LaunchAgent: `com.shannonjlove.rclone-lovecloud-downloaders`  
Remote: `lovecloud-e2:inbox-idrive-e2/01001-uploads/downloaders`

| Folder | App |
|---|---|
| `downie/` | Downie |
| `jdownloader/` | JDownloader |
| `torbox/` | TorBox exports |
| `incoming-magnets/` | Drop `.torrent` / magnet text for `torbox-watch-incoming.sh` |
| `shared/` | Manual / cross-app |

Browse-only: `~/IDrive-E2-LoveCloud` and `~/IDrive-E2-Nexus` — do **not** point downloaders there.

## Helpers (`~/LoveCloud/downloaders/`)

```bash
# Downie → cloud folder
./downie-cloud.sh 'https://…'

# TorBox remote add / list
./torbox-add.sh 'magnet:?xt=…'
./torbox-add.sh ./file.torrent
./torbox-list.sh
./torbox-watch-incoming.sh

# Health-check mount (no sync; mount is authoritative)
./sync-downloaders-to-e2.sh

# Optional Offcloud remote (secondary)
./offcloud-remote.sh                 # list remote accounts
./offcloud-remote.sh '<url>' <id>    # remote download to linked cloud
```

## One-time UI steps

1. **Downie** → Settings → Downloads → folder = `~/LoveCloud/E2-Downloaders/downie` (Ask for destination OFF).
2. **JDownloader** → Settings → General → download folder = `~/LoveCloud/E2-Downloaders/jdownloader` (cfg already updated; restart JD if it was open).
3. **JDownloader** → Settings → MyJDownloader → enable with 1Password item `Jdownloader2026`. Control from [my.jdownloader.org](https://my.jdownloader.org).
4. **TorBox** → Infuse/IINA can use WebDAV `https://webdav.torbox.app` (creds in 1Password `TorBox API`).
5. Mount auto-starts via LaunchAgent; watchdog reconnects it with the other rclone mounts.

## Credentials (1Password PRIMARY only)

- `TorBox API`
- `Jdownloader2026` / `Jdownloader`
- `Offcloud API Credentials` (optional)

Never store resolved secrets in Git or BookStack.

## Server Mac-bypass (Oracle)

`oracle-install-yt-dlp-jd.sh` — run after Tailscale SSH to `oracle-sos` works.
