# Workspace Scenes

Shared rules for every extension come from gnome-ai-kit: `../CLAUDE.md` and `../.claude/rules/` (loaded with this file), and the `gnome-ext:*` skills. `.claude/kit.sh` pulls the kit at session start, or, with no kit beside this repository, fetches it and prints its rules into the session.

A GNOME Shell extension (UUID `workspace-scenes@jackicus`, `version-name` 0.1, shell 51): Workspace switches as a camera move through an anime-styled scene: a curved corridor, a lift shaft, a warp tunnel and more.

## Layout

```
src/extension.js        entry point: imports lib/app.js
src/prefs.js            preferences (own process: Gtk and Adw only)
src/schemas/            org.gnome.shell.extensions.workspace-scenes
src/lib/app.js          WorkspaceScenesApp: everything enable() puts into the shell
scripts/ext.conf        what the kit's scripts need to know about this extension
```

## Settings

`show-indicator` (true): the icon in the top bar.

## Verifying

`make check` (ESLint, the schema, and `size`; CI runs it). Anything visible is seen in the
nested shell (`gnome-ext:nested-shell`, then this repository's `drive-extension`
skill).

## Compatibility

Shell 51 only. Read 2026-10-28 at gnome-shell 50.5 → 51.1 (`ui/panelMenu.js`,
`ui/panel.js`, `extensions/`): `PanelMenu.Button._init(alignment, name)` and
`addToStatusArea` are unchanged, and nothing it uses moved. Booted on GNOME Shell 51.1
(nested, main desktop). No private API.

## Gotchas

None of its own yet. A trap true of every extension goes in the kit, not here.
