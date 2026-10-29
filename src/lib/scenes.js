// The scenes, the GLSL they share and the camera's path through one switch.
// Pure: imported by the shell, the preferences and scripts/shaders.mjs alike.

import * as corridor from './corridor.js';
import * as shaft from './shaft.js';
import * as warp from './warp.js';
import * as sky from './sky.js';

export const SCENES = [
    {id: 'corridor', name: 'Corridor', ...corridor},
    {id: 'shaft', name: 'Lift Shaft', ...shaft},
    {id: 'warp', name: 'Warp', ...warp},
    {id: 'sky', name: 'Cloud Sea', ...sky},
];

// A workspace's half-height in scene units: it fills the screen this far from the camera.
export const HALF = 0.6;
export const RUN = 45;

const PULL_SHARE = 0.28;
const PULL_BACK = 1.1;
const ANTICIPATION = 0.05;

const easeOutQuad = t => 1 - (1 - t) * (1 - t);
const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
const easeInOutCubic = t => t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2;

// The camera's depth at progress p, from the outgoing workspace (at HALF) to the
// incoming one (at run + HALF): a small lean in, a pull back, then the run.
export function cameraAt(p, run) {
    if (p < PULL_SHARE) {
        const t = p / PULL_SHARE;
        if (t < 0.25)
            return ANTICIPATION * easeOutQuad(t / 0.25);
        return ANTICIPATION - (PULL_BACK + ANTICIPATION) * easeInOutQuad((t - 0.25) / 0.75);
    }
    const t = (p - PULL_SHARE) / (1 - PULL_SHARE);
    return -PULL_BACK + (run + PULL_BACK) * easeInOutCubic(t);
}

// The camera's speed at p, as a share of its top speed.
export function speedAt(p, run) {
    const a = cameraAt(Math.max(p - 0.01, 0), run);
    const b = cameraAt(Math.min(p + 0.01, 1), run);
    const top = 1.5 * (run + PULL_BACK) / (1 - PULL_SHARE);
    return (b - a) / 0.02 / top;
}

const PRELUDE = `
uniform vec2 u_res;
uniform float u_cam;
uniform float u_dir;
uniform float u_roll;
uniform float u_frame;
uniform float u_focus;
uniform float u_impact;
uniform vec2 u_vanish;
uniform vec3 u_accent;
uniform vec4 u_card_a;
uniform vec4 u_card_b;
uniform vec2 u_card_alpha;

float hash(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

float vnoise2(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash2(i);
    float b = hash2(i + vec2(1.0, 0.0));
    float c = hash2(i + vec2(0.0, 1.0));
    float d = hash2(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float x) {
    return 0.6 * vnoise(x) + 0.3 * vnoise(x * 2.3 + 7.0) + 0.1 * vnoise(x * 5.1 + 3.0);
}

float fbm2(vec2 x) {
    return 0.55 * vnoise2(x) + 0.3 * vnoise2(x * 2.1 + vec2(17.3, 9.1)) +
        0.15 * vnoise2(x * 4.3 + vec2(-31.7, 23.9));
}

// Coverage of a line of half-width w at distance d, antialiased over aa.
float ink(float d, float w, float aa) {
    return 1.0 - smoothstep(w - aa, w + aa, abs(d));
}

// A neutral moved toward the accent by k, keeping its lightness.
vec3 tint(vec3 c, float k) {
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    vec3 toward = u_accent * (dot(c, luma) / max(dot(u_accent, luma), 0.05));
    return clamp(mix(c, toward, k), 0.0, 1.0);
}

float boxDistance(vec2 p, vec2 size) {
    vec2 d = abs(p) - size;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// A workspace's drop shadow and ink outline, drawn under its clone.
vec3 card(vec3 col, vec2 uv, float dp, vec4 rect, float alpha, vec3 inkTone) {
    if (alpha <= 0.0)
        return col;
    float shadow = boxDistance(uv - rect.xy + vec2(0.0, 0.04 * rect.w), rect.zw);
    col = mix(col, col * 0.3, alpha * 0.6 * (1.0 - smoothstep(0.0, 0.15 * rect.w, shadow)));
    float edge = boxDistance(uv - rect.xy, rect.zw);
    return mix(col, inkTone, alpha * ink(edge - 1.5 * dp, 1.5 * dp, dp));
}

// Manga focus lines around the vanishing point, scattered afresh each drawn frame.
vec3 focusLines(vec3 col, vec2 p, float dp, vec3 lineTone) {
    if (u_focus <= 0.0)
        return col;
    float r = length(p);
    float k = atan(p.y, p.x) / 6.2831853 * 110.0;
    float aa = 2.0 * dp * 110.0 / (6.2831853 * max(r, 0.05));
    float id = floor(k);
    float on = step(0.55, hash(id * 7.13 + u_frame * 1.731));
    float w = 0.08 + 0.25 * hash(id * 3.1 + u_frame);
    float across = abs(fract(k) - 0.5) * 2.0;
    float r0 = 0.55 + 0.7 * hash(id * 5.7 + u_frame * 2.3);
    float line = on * (1.0 - smoothstep(w - aa, w + aa, across)) * smoothstep(r0, r0 + 0.35, r);
    return mix(col, lineTone, line * u_focus * 0.55);
}
`;

const MAIN = `
    vec2 st = cogl_tex_coord_in[0].st;
    vec2 screen = vec2(st.x * 2.0 - 1.0, 1.0 - st.y * 2.0) * vec2(u_res.x / u_res.y, 1.0);
    float dp = 2.0 / u_res.y;
    float cr = cos(u_roll);
    float sr = sin(u_roll);
    vec2 uv = vec2(cr * screen.x - sr * screen.y, sr * screen.x + cr * screen.y);
    vec3 inkTone = sceneInk();
    vec3 col = scene(uv, dp);
    col = card(col, uv, dp, u_card_b, u_card_alpha.y, inkTone);
    col = card(col, uv, dp, u_card_a, u_card_alpha.x, inkTone);
    if (u_impact > 0.5)
        col = vec3(1.0) - col;
    col = focusLines(col, screen - u_vanish, dp, u_impact > 0.5 ? inkTone : sceneLine());
    vec2 vg = screen * vec2(0.55, 0.8);
    col *= 1.0 - 0.28 * dot(vg, vg);
    cogl_color_out = vec4(clamp(col, 0.0, 1.0), 1.0) * cogl_color_in.a;
`;

// A scene's glsl defines scene(uv, dp), sceneInk() and sceneLine(); uv is in units of
// half the screen's height, rolled, and dp is one pixel in those units.
export function shaderSource(scene) {
    return {declarations: `${PRELUDE}\n${scene.glsl}`, code: MAIN};
}
