# Workspace Scenes

Shared rules for every extension come from gnome-ai-kit: `../CLAUDE.md` and `../.claude/rules/` (loaded with this file), and the `gnome-ext:*` skills. `.claude/kit.sh` pulls the kit at session start, or, with no kit beside this repository, fetches it and prints its rules into the session.

A GNOME Shell extension (UUID `workspace-scenes@jackicus`, `version-name` 0.1, shell 51)
that turns a workspace switch into a camera move through a cel-shaded scene: the current
workspace pulls back into the scene, the camera races through it, and the new workspace
zooms in until it fills the screen. Log prefix `[Workspace Scenes]`.

## Layout

```
src/extension.js        entry point: imports lib/app.js
src/prefs.js            preferences (own process: Gtk and Adw only; imports lib/scenes.js)
src/schemas/            org.gnome.shell.extensions.workspace-scenes
src/lib/app.js          WorkspaceScenesApp: replaces the controller's animateSwitch, runs a switch
src/lib/view.js         WorkspaceScenesView: one monitor's switch (shader backdrop, two cards)
src/lib/shader.js       a Clutter.ShaderEffect class per scene, kept across disable and enable
src/lib/scenes.js       the catalogue, the shared GLSL (prelude and main) and the camera path
src/lib/corridor.js     one module per scene: its GLSL and its numbers for the camera and cards
src/lib/shaft.js, warp.js, sky.js
scripts/shaders.mjs     compiles every scene in GLSL 1.10, 3.30 and ES 1.00 (make check)
docs/private-api.md     every reach into the shell, and what breaks when it moves
```

## How a switch runs

1. Mutter emits `switch-workspace`; the shell calls `Main.wm._workspaceAnimation.animateSwitch`,
   which `app.js` has replaced on the instance (put back on disable only while still ours).
2. `play()` lets the controller's own `_prepareWorkspaceSwitch([from, to])` build its
   `MonitorGroup`s (window clones and wallpaper per workspace, the grab, unredirect), then
   moves the two `WorkspaceGroup`s of each monitor into a `WorkspaceScenesView` at the
   bottom of that monitor group. Sticky windows stay in the shell's sticky group above.
3. Each view eases its own `progress` 0 → 1 (`LINEAR`; the easing is in `cameraAt()`),
   so the animations switch and slow-down factor apply. The primary monitor's completion
   calls `_finishWorkspaceSwitch` and mutter's `onComplete`, as the shell does.
4. Mutter's `kill-switch-workspace` (a new switch, the overview) goes through the shell's
   `cancelSwitchAnimation`, which destroys the monitor groups and our views with them.
5. Anything that throws in `play()` finishes the half-made switch and falls back to the
   shell's slide.

Touchpad swipes are the shell's (`_switchWorkspaceBegin/Update/End`), untouched.

## The scene contract

A scene module exports `glsl`, defining `vec3 scene(vec2 uv, float dp)`, `vec3 sceneInk()`
and `vec3 sceneLine()`, plus `fog`, `focus` (focus-line strength), `reveal` (the depth at
which the incoming workspace starts to show), `offset(depth, dir)` (where the centre line
is at that depth, in screen units), `roll(p, dir)` and `vanish(dir)`. `uv` is in units of
half the screen's height, already rolled; `dp` is one pixel in those units.

- **Everything in scene units.** A workspace is `HALF` tall and fills the screen at
  distance `HALF`. The camera path is `cameraAt(p, run)`; `run` grows with the number
  of workspaces jumped.
- **The scene steps, the cards do not.** `u_cam` and `u_frame` come from progress held at
  `step-rate` drawings a second; the cards, their shadows and the roll move every frame.
- **Colour** is neutrals moved toward the accent with `tint()`, and the accent itself
  (`St.ThemeContext.get_accent_color()`, read per switch). No hard-coded hue.
- **No `fwidth`**: GLSL ES 1.00 has no derivatives without an extension. Antialiasing
  widths are worked out from depth (`dp * z`, times the grazing factor on a wall).
- **Names GLSL already has**: `noise`, `noise2`… are built-ins and `half` is reserved;
  `scripts/shaders.mjs` catches these, where the shell would only draw black.
- **Roll sign**: the card actors take `rotation_angle_z = roll` in degrees and the shader
  takes `u_roll = roll` in radians; the card outlines drawn in the shader line up only so.

## Motion

Switch durations are 400–2000 ms (default 900), outside the kit's 100–250 ms range: the
scene has to be seen to work, and a pull back, a run and an arrival do not fit in a quarter
of a second. A jump across several workspaces takes up to half as long again.

## Settings

`scene` (`corridor`, `shaft`, `warp`, `sky`, `random`), `duration` (ms), `step-rate`
(scene drawings a second, 0 = every frame), `focus-lines`, `impact-frame`.

## Verifying

`make check`: ESLint, the schema, `./scripts/dev.sh shaders` (needs `glslangValidator`;
CI installs `glslang` through `.github/ci-packages`) and `size`. Motion is judged in the
nested shell (`gnome-ext:nested-shell`, then `.claude/skills/drive-extension/SKILL.md`):
a switch needs four static workspaces there, and `duration` 2000 to catch its phases.

## Compatibility

Shell 51 only. Read 2026-10-28 at gnome-shell 51.1: `ui/workspaceAnimation.js` is the
same as at 50.5, and every reach in `docs/private-api.md` is there. `Shell.GLSLEffect` is
gone in 51, so each scene is a `Clutter.ShaderEffect` returning its snippet from
`vfunc_get_static_snippet()`; every uniform is at most a vec4, which is all its
`set_uniform_float()` holds. Booted on GNOME Shell 51.1 (nested, main desktop).

## Gotchas

- **A uniform wider than a vec4** (an array) cannot go through `set_uniform_float()`:
  it is written to the effect's pipeline in `vfunc_paint_target`, as Wallpaper FX does.
- **Wallpaper FX also wraps this controller** (`_prepareWorkspaceSwitch`); what it adds
  rides inside the workspace groups this extension moves.
- **The shell's workspace switcher pop-up** shows over the scene; it is the shell's own.
