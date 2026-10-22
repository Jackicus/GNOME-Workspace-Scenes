// Workspace Scenes: a workspace switch as a camera move through a scene.
//
// The shell's WorkspaceAnimationController still prepares and finishes every switch
// (the clones of each workspace, the grab, unredirection, cancellation by mutter and
// the overview); only the animation between is replaced. Touchpad swipes keep the
// shell's slide. Each private reach is in docs/private-api.md.

import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {RUN, SCENES} from './scenes.js';
import {WorkspaceScenesView} from './view.js';

const BACKWARD = [
    Meta.MotionDirection.UP,
    Meta.MotionDirection.LEFT,
    Meta.MotionDirection.UP_LEFT,
    Meta.MotionDirection.UP_RIGHT,
];

export class WorkspaceScenesApp {
    constructor(extension) {
        this._extension = extension;
    }

    enable() {
        this._settings = this._extension.getSettings();
        const controller = Main.wm._workspaceAnimation;
        const original = controller.animateSwitch;
        const settings = this._settings;
        this._controller = controller;
        this._own = Object.hasOwn(controller, 'animateSwitch') ? original : null;
        this._animateSwitch = function (from, to, direction, onComplete) {
            try {
                play(this, settings, from, to, direction, onComplete);
            } catch (e) {
                console.error('[Workspace Scenes] Falling back to the slide:', e);
                if (this._switchData)
                    this._finishWorkspaceSwitch(this._switchData);
                original.call(this, from, to, direction, onComplete);
            }
        };
        controller.animateSwitch = this._animateSwitch;
    }

    // A switch already under way finishes on its own; it holds what it needs.
    disable() {
        const controller = this._controller;
        if (controller.animateSwitch === this._animateSwitch) {
            if (this._own)
                controller.animateSwitch = this._own;
            else
                delete controller.animateSwitch;
        }
        this._controller = null;
        this._animateSwitch = null;
        this._own = null;
        this._settings = null;
    }
}

function play(controller, settings, from, to, direction, onComplete) {
    let id = settings.get_string('scene');
    if (id === 'random')
        id = SCENES[Math.floor(Math.random() * SCENES.length)].id;
    const scene = SCENES.find(s => s.id === id);
    const jumps = Math.max(Math.abs(to - from), 1);
    const [accent] = St.ThemeContext.get_for_stage(global.stage).get_accent_color();
    const options = {
        dir: BACKWARD.includes(direction) ? -1 : 1,
        run: RUN * Math.min(1 + 0.25 * (jumps - 1), 2),
        duration: settings.get_int('duration') * Math.min(1 + 0.15 * (jumps - 1), 1.5),
        rate: settings.get_int('step-rate'),
        focus: settings.get_boolean('focus-lines'),
        impact: settings.get_boolean('impact-frame'),
        accent: [accent.red / 255, accent.green / 255, accent.blue / 255],
    };

    controller._swipeTracker.enabled = false;
    controller._prepareWorkspaceSwitch([from, to]);
    const switchData = controller._switchData;
    switchData.inProgress = true;

    for (const monitorGroup of switchData.monitors) {
        const {width, height} = Main.layoutManager.monitors[monitorGroup.index];
        const groups = [from, to].map(i =>
            monitorGroup._workspaceGroups.find(g => g.workspace.index() === i));
        const view = new WorkspaceScenesView(scene, ...groups, {...options, width, height});
        monitorGroup.insert_child_below(view, null);

        const params = {duration: options.duration, mode: Clutter.AnimationMode.LINEAR};
        if (monitorGroup.index === Main.layoutManager.primaryIndex) {
            params.onComplete = () => {
                controller._finishWorkspaceSwitch(switchData);
                onComplete();
                controller._swipeTracker.enabled = true;
            };
        }
        view.ease_property('progress', 1, params);
    }
}
