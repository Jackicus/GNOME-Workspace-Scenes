// A lift shaft seen from the cage, falling past storey slabs with hazard lips,
// landing doors, guide rails, cables and a lamp on every floor. The view turns
// as it falls, the way a switch goes.

export const fog = 0.07;
export const focus = 1;
export const reveal = 40;

export const offset = () => [0, 0];
export const roll = (p, dir) => dir * 0.5 * Math.sin(Math.PI * p);
export const vanish = () => [0, 0];

export const glsl = `
const float SIDE = 1.35;
const float STOREY = 7.0;
const float FOG = ${fog};

vec3 sceneInk() {
    return tint(vec3(0.07, 0.08, 0.11), 0.15);
}

vec3 sceneLine() {
    return mix(u_accent, vec3(1.0), 0.6);
}

vec3 scene(vec2 uv, float dp) {
    vec3 far = mix(tint(vec3(0.03, 0.035, 0.05), 0.2), u_accent, 0.18);
    float zx = SIDE / max(abs(uv.x), 1e-4);
    float zy = SIDE / max(abs(uv.y), 1e-4);
    float z = min(zx, zy);
    if (z > 300.0)
        return far;

    bool upright = zx < zy;
    float t = upright ? uv.y * z : uv.x * z;
    float wall = upright ? (uv.x > 0.0 ? 0.0 : 1.0) : (uv.y > 0.0 ? 2.0 : 3.0);
    float s = z + u_cam;
    float pix = dp * z;
    float fs = pix * (1.0 + z / SIDE);
    float ls = s - floor(s / STOREY) * STOREY;
    float edge = ls < 0.5 * STOREY ? ls : ls - STOREY;

    vec3 base = tint(vec3(0.5, 0.52, 0.56), 0.1);
    float tone = wall == 0.0 ? 1.0 : (wall == 2.0 ? 0.72 : (wall == 1.0 ? 0.55 : 0.42));
    vec3 col = base * tone;
    vec3 inkTone = sceneInk();
    float lines = 0.0;
    float fogK = 1.0;

    float stain = fbm2(vec2(t * 1.3 + wall * 17.0, s * 0.45));
    col = mix(col, col * 0.78, smoothstep(0.6 - 3.0 * pix, 0.6 + 3.0 * pix, stain));

    float slab = smoothstep(-fs, fs, ls) * (1.0 - smoothstep(0.7 - fs, 0.7 + fs, ls));
    col = mix(col, base * (tone * 0.8 + 0.25), slab);
    float lip = smoothstep(0.7 - fs, 0.7 + fs, ls) * (1.0 - smoothstep(0.95 - fs, 0.95 + fs, ls));
    float hazard = step(0.5, fract((t + ls) * 2.2));
    col = mix(col, mix(inkTone, mix(u_accent, vec3(1.0), 0.15), hazard), lip);
    lines = max(lines, ink(edge, 0.02, fs));
    lines = max(lines, ink(ls - 0.7, 0.015, fs));
    lines = max(lines, ink(ls - 0.95, 0.015, fs));

    if (wall == 1.0) {
        float within = step(1.3, ls) * step(ls, 5.4);
        float door = step(abs(t), 0.62) * within;
        col = mix(col, base * 0.85, door * 0.6);
        lines = max(lines, ink(abs(t) - 0.62, 0.02, pix) * within);
        lines = max(lines, ink(ls - 5.4, 0.02, fs) * step(abs(t), 0.62));
        lines = max(lines, ink(t, 0.008, pix) * within);
    }
    if (wall == 0.0 || wall == 2.0) {
        float rail = abs(t - (wall == 0.0 ? -0.3 : 0.4));
        col = mix(col, tint(vec3(0.33, 0.35, 0.4), 0.1), 1.0 - smoothstep(0.1 - pix, 0.1 + pix, rail));
        lines = max(lines, ink(rail - 0.1, 0.012, pix));
        lines = max(lines, ink((fract(s / 1.4) - 0.5) * 1.4, 0.04, fs) * step(rail, 0.2));
    }
    if (wall == 2.0) {
        lines = max(lines, ink(t + 0.5, 0.015, pix));
        lines = max(lines, ink(t + 0.62, 0.015, pix));
    }
    if (wall == 0.0) {
        float d = length(vec2((t - 0.75) / 0.18, (ls - 3.0) / 0.35));
        float bulb = 1.0 - smoothstep(0.9, 1.1, d);
        col = mix(col, col * 1.35 + u_accent * 0.12, (1.0 - smoothstep(2.6, 2.7, d)) * 0.6);
        col = mix(col, mix(u_accent, vec3(1.0), 0.7), bulb);
        fogK = 1.0 - 0.6 * bulb;
        lines = max(lines, ink(d - 1.0, 0.12, 0.1) * (1.0 - bulb));
    }
    lines = max(lines, ink(abs(t) - SIDE, 0.02, pix));

    col = mix(col, inkTone, lines);
    return mix(col, far, (1.0 - exp(-z * FOG)) * fogK);
}
`;
