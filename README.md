# Workspace Scenes

Workspace switches as a camera move through an anime-styled scene: a curved corridor, a lift shaft, a warp tunnel and more.

## Requirements

GNOME Shell 51.

## Privacy and network

It sends nothing anywhere and reads nothing of yours.

## Install

From source:

```bash
git clone https://github.com/Jackicus/GNOME-Workspace-Scenes.git
cd GNOME-Workspace-Scenes
make install
```

Then log out and back in (on Wayland the shell only finds a new extension at login), and
turn it on in Extensions.

To update, pull and `make install` again; to remove it, `make uninstall`.

## Preferences

- **Show the Indicator**: the icon in the top bar.

## Troubleshooting

The extension's messages, and its preferences', are in the journal:

```bash
journalctl -o cat --since '10 min ago' /usr/bin/gnome-shell + SYSLOG_IDENTIFIER=org.gnome.Shell.Extensions | grep -F '[Workspace Scenes]'
```

Include them in a bug report.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

GPL-2.0-or-later. See [LICENSE](LICENSE).
