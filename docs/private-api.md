# Private GNOME Shell API

Workspace Scenes replaces the animation between the two halves of a workspace switch and
leaves the rest of the shell's own machinery doing its job. There is no public API for
that. This is everything it reaches into, for reviewers on extensions.gnome.org and for
whoever ports it to the next GNOME.

Checked against the `50.5` and `51.1` tags of `GNOME/gnome-shell` and the `50.6` tag of
`GNOME/mutter` on gitlab.gnome.org. `js/ui/workspaceAnimation.js` is the same in 50.5
and 51.1.

| Expression | File | What for | If it changes |
|---|---|---|---|
| `Main.wm._workspaceAnimation` | app.js | The `WorkspaceAnimationController` instance that animates every switch | `enable()` throws; the shell's slide stays |
| `controller.animateSwitch` (replaced on the instance) | app.js | The one place a keyboard or programmatic switch is animated. Put back on disable only while it is still ours, to whatever was there | Switches show the shell's slide |
| `controller._prepareWorkspaceSwitch(indices)`, `controller._switchData` (`.monitors`, `.inProgress`), `controller._finishWorkspaceSwitch(switchData)` | app.js | The shell builds and tears down the clones, the grab and unredirection exactly as for its own slide, so mutter's cancellation and the overview keep working | `play()` throws, the half-made switch is finished and the slide runs instead |
| `controller._swipeTracker.enabled` | app.js | Off while a scene runs, as the shell's own `animateSwitch` does, so a swipe cannot start a second switch over it | Same |
| `monitorGroup._workspaceGroups` | app.js | The `WorkspaceGroup` (windows and wallpaper) of the outgoing and incoming workspace, moved into the scene | Same |
| `class extends Shell.GLSLEffect` | shader.js | Each scene is one fragment shader over a monitor-sized actor. **Removed in GNOME 51** (`src/shell-glsl-effect.c` is gone in 51.1) | shader.js fails to import and the extension does not enable; the shell's slide stays |

`WorkspaceGroup`, `MonitorGroup.index` and `WorkspaceGroup.workspace` are exported or
public members of `workspaceAnimation.js` and are not listed.
