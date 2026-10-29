---
name: drive-extension
description: See Workspace Scenes in a throwaway nested GNOME Shell - a workspace switch through each scene, caught phase by phase, and its preferences - and take screenshots of it. Use whenever a change to a scene, the camera or the switch must be seen or needs a fresh shell start (extension.js, metadata.json, the schema).
---

# Driving Workspace Scenes in a nested shell

**Read `gnome-ext:nested-shell` first**: the loop (`start`, `do`, `reload`, `stop`), the
steps and its settings are there. This is what is particular to Workspace Scenes.

There is nothing to see until a workspace switch. The nested session starts with one
workspace, so give it four static ones first (its own settings, never the user's):

```bash
N="./scripts/nested.sh run timeout 5 gsettings"
./scripts/nested.sh start
$N set org.gnome.mutter dynamic-workspaces false
$N set org.gnome.desktop.wm.preferences num-workspaces 4
$N --schemadir src/schemas set org.gnome.shell.extensions.workspace-scenes duration 2000
$N --schemadir src/schemas set org.gnome.shell.extensions.workspace-scenes scene corridor
./scripts/nested.sh do "key Super+Page_Down" "wait 0.15" "shot $S/1.png" "wait 0.25" "shot $S/2.png" \
    "wait 0.25" "shot $S/3.png" "wait 0.25" "shot $S/4.png" "wait 0.25" "shot $S/5.png"
```

- **Take a `shot` before the first switch after `start`**: until one, the nested shell
  still reports the overview as visible, so the shell skips the switch animation
  (`_shouldAnimate()`) and nothing of this extension runs.
- **Phases at 2000 ms**: the pull back is the first quarter, the incoming workspace
  appears in the last third. A shot takes about a tenth of a second, so the waits are
  approximate; tile the PNGs into one sheet to judge the run.
- **Direction**: `Super+Page_Down` goes forward, `Super+Page_Up` back (the corridor bends
  and the shaft and warp turn the other way). `Super+Home` returns to the first workspace;
  `Page_Down` on the last does nothing, so a test of quick switches starts from the first.
- **Cancellation**: three `Super+Page_Down` 0.2 s apart each cancel the last; the end is
  the right workspace (the dots at the top left) with nothing left over.
- **Card alignment**: on the shaft, warp and cloud sea, the shader's outline and shadow
  must turn with the workspace; a crossed pair of rectangles is a roll sign wrong.
- **The preferences**: `./scripts/nested.sh run gnome-extensions prefs workspace-scenes@jackicus`,
  then `do "window $S/prefs.png"`.
- `duration` back with `$N --schemadir src/schemas reset org.gnome.shell.extensions.workspace-scenes duration`.
- **Screenshots** that are kept go through `gnome-ext:screenshots`, under `start --stand-in`.
