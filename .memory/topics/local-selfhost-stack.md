# Local Selfhost Stack

- 2026-08-11 — installed TablePlus (brew cask); Dashy + Uptime Kuma native under ~/selfhost (Podman overlay corrupted); start via ~/selfhost/start.sh — Dashy :8080, Kuma :3001 (Node 20)
- 2026-08-12 — recreated corrupt podman-machine-default (overlay readlink); Podman Desktop is preferred GUI; repair script ~/selfhost/podman-repair.sh
- 2026-08-12 — switched Podman machine provider libkrun→applehv (Ignition emergency on 2nd boot); repair script uses applehv
- 2026-08-12 — installed PhotoPrism under ~/selfhost/photoprism (Podman+MariaDB :2342); originals/import dirs; wired start.sh/Dashy; TensorFlow disabled for first-boot stability
