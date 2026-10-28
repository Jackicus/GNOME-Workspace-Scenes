import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import {HALF, cameraAt, speedAt} from './scenes.js';
import {effectClass} from './shader.js';

// Where the impact frame falls, as progress through the switch.
const IMPACT_AT = 0.86;

const clamp = (x, low, high) => Math.min(high, Math.max(low, x));
const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
};

// One monitor's switch: the scene's shader behind the two workspaces, which are the
// shell's own groups of window clones, moved in for the switch.
export const WorkspaceScenesView = GObject.registerClass({
    Properties: {
        'progress': GObject.ParamSpec.double('progress', null, null,
            GObject.ParamFlags.READWRITE, 0, 1, 0),
    },
}, class WorkspaceScenesView extends Clutter.Actor {
    constructor(scene, from, to, options) {
        const {width, height} = options;
        super({width, height});
        this._scene = scene;
        this._options = options;
        this._progress = 0;

        const backdrop = new Clutter.Actor({width, height});
        this._effect = new (effectClass(scene))();
        backdrop.add_effect(this._effect);
        this.add_child(backdrop);

        this._cards = [from, to].map(group => {
            group.get_parent().remove_child(group);
            group.set_position(0, 0);
            const card = new Clutter.Actor({width, height});
            card.set_pivot_point(0.5, 0.5);
            const shade = new St.Widget({width, height, opacity: 0, style: 'background-color: black;'});
            card.add_child(group);
            card.add_child(shade);
            return {card, shade};
        });
        this.add_child(this._cards[1].card);
        this.add_child(this._cards[0].card);

        const seconds = options.duration / 1000;
        this._impactStep = options.rate > 0 ? Math.ceil(IMPACT_AT * seconds * options.rate) : -1;
        this._update();
    }

    get progress() {
        return this._progress;
    }

    set progress(p) {
        this._progress = p;
        this._update();
        this.notify('progress');
    }

    // Each card at its depth: shrunk by perspective, moved where the scene puts that
    // depth, dimmed by its fog, faded out as the camera passes it and in as it comes
    // into view.
    _place(index, depth, roll) {
        const {card, shade} = this._cards[index];
        const {width, height, dir} = this._options;
        if (depth <= 0.02) {
            card.opacity = 0;
            return [[0, 0, 0, 0], 0];
        }
        const scene = this._scene;
        const scale = HALF / depth;
        const [x, y] = scene.offset(Math.max(depth - HALF, 0), dir);
        const alpha = index === 0
            ? smoothstep(0.02, 0.4 * HALF, depth)
            : clamp((scene.reveal - depth) / (0.25 * scene.reveal), 0, 1);
        card.set_scale(scale, scale);
        card.translation_x = x * height / 2;
        card.translation_y = -y * height / 2;
        card.rotation_angle_z = roll * 180 / Math.PI;
        card.opacity = Math.round(255 * alpha);
        shade.opacity = Math.round(255 * (1 - Math.exp(-Math.max(depth - HALF, 0) * scene.fog * 0.9)));
        return [[x, y, scale * width / height, scale], alpha];
    }

    // The scene steps at the chosen rate, the way anime holds a drawing; the
    // workspaces move on every frame.
    _update() {
        const {width, height, dir, run, duration, rate, focus, impact, accent} = this._options;
        const p = this._progress;
        const seconds = duration / 1000;
        const step = Math.floor(p * seconds * (rate > 0 ? rate : 60));
        const held = rate > 0 && p < 1 ? Math.min(step / rate / seconds, 1) : p;
        const camera = cameraAt(p, run);
        const roll = this._scene.roll(p, dir);
        const [rectA, alphaA] = this._place(0, HALF - camera, roll);
        const [rectB, alphaB] = this._place(1, run + HALF - camera, roll);
        const flash = impact && (rate > 0 ? step === this._impactStep : p >= IMPACT_AT && p < IMPACT_AT + 0.05);

        const fx = this._effect;
        fx.setUniform('u_res', [width, height]);
        fx.setUniform('u_cam', [cameraAt(held, run)]);
        fx.setUniform('u_dir', [dir]);
        fx.setUniform('u_roll', [roll]);
        fx.setUniform('u_frame', [step % 997]);
        fx.setUniform('u_focus', [focus ? this._scene.focus * smoothstep(0.3, 0.85, speedAt(held, run)) : 0]);
        fx.setUniform('u_impact', [flash ? 1 : 0]);
        fx.setUniform('u_vanish', this._scene.vanish(dir));
        fx.setUniform('u_accent', accent);
        fx.setUniform('u_card_a', rectA);
        fx.setUniform('u_card_b', rectB);
        fx.setUniform('u_card_alpha', [alphaA, alphaB]);
    }
});
