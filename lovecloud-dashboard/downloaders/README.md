# LoveCloud downloaders

## Mac / Downie (cloud mount)

Writable destination created on ExpanDrive → IDrive E2:

`~/Library/CloudStorage/ExpanDrive/IDrive e2/downloaders/downie`

Helper (always passes `destination=`):

```bash
~/LoveCloud/downloaders/downie-cloud.sh 'https://example.com/video'
```

One-time: Downie → Settings → Downloads → set folder to that path; Ask for destination = OFF.

## Server (Mac-bypass) — Oracle `oracle-sos`

Blocked until Tailscale SSH works. Then run:

```bash
ssh oracle-sos 'bash -s' < lovecloud-dashboard/downloaders/oracle-install-yt-dlp-jd.sh
```

Needs MyJDownloader credentials from 1Password items `Jdownloader2026` / `Jdownloader`.
