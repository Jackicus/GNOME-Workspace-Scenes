# Workspace Scenes

Workspace switches as a camera move through an anime-styled scene: a curved corridor, a lift shaft, a warp tunnel and more.

Switch workspace with the keyboard and, instead of the slide, the workspace you are on pulls
back into a scene, the camera races through it, and the next workspace zooms in until it
fills the screen. The scenes are cel-shaded and drawn the way anime is: the scene holds each
drawing for a few frames while your workspaces move smoothly, with focus lines at speed.

## Scenes

- **Corridor**: a curved concrete service tunnel with panel seams, cracks and lamps
  overhead; the next workspace comes round the bend.
- **Lift Shaft**: a fall past storey slabs, hazard lips and landing doors, turning as it goes.
- **Warp**: streaks of light racing past toward a bright core, spinning with the switch.
- **Cloud Sea**: a banking flight low over a sea of clouds.
- **A Different One Each Time**.

The scenes take their colour from your accent colour. Touchpad swipes keep GNOME's own slide.

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

- **Scene**: one of the scenes above, or a different one each time.
- **Duration**: how long a switch to the next workspace takes (default 900 ms). Jumping
  several workspaces takes a little longer.
- **Scene Drawings per Second**: how often the scene is redrawn (default 12, as anime is
  often drawn); 0 redraws it every frame.
- **Focus Lines**: speed lines while the camera races.
- **Impact Frame**: one inverted drawing of the scene as the new workspace arrives.

With animations turned off in Accessibility, switches are instant, as they are without it.

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
