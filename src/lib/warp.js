// A warp tunnel: streaks of the accent and white racing past a banded nebula,
// spinning with the switch, toward a cel-shaded core of light.

export const fog = 0;
export const focus = 0.6;
export const reveal = 30;

export const offset = () => [0, 0];
export const roll = (p, dir) => dir * 1.2 * Math.sin(Math.PI * p);
export const vanish = () => [0, 0];

export const glsl = `
vec3 sceneInk() {
    return tint(vec3(0.02, 0.025, 0.06), 0.3);
}

vec3 sceneLine() {
    return mix(u_accent, vec3(1.0), 0.75);
}

// One ring of streaks: n of them around, each a dash moving down the tunnel.
float streaks(float angle, float r, float s, float n, float seed, float dp) {
    float k = angle / 6.2831853 * n;
    float id = floor(k);
    float across = abs(fract(k) - 0.5) * 2.0;
    float aa = 2.0 * dp * n / (6.2831853 * max(r, 0.02));
    float w = 0.1 + 0.25 * hash(id * 5.1 + seed);
    float len = 0.12 + 0.45 * hash(id * 1.7 + seed);
    float ph = fract(s * (0.025 + 0.04 * hash(id * 9.1 + seed)) + hash(id * 3.3 + seed));
    float along = smoothstep(0.0, 0.02, ph) * (1.0 - smoothstep(len - 0.02, len, ph));
    return along * (1.0 - smoothstep(w - aa, w + aa, across)) * step(0.35, hash(id * 2.3 + seed));
}

vec3 scene(vec2 uv, float dp) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x) + 3.14159265;
    float s = 1.0 / max(r, 1e-3) + u_cam;
    vec3 col = tint(vec3(0.03, 0.04, 0.09), 0.35);
    float cloud = fbm2(vec2(cos(angle), sin(angle)) * 1.6 + vec2(s * 0.035, s * 0.021));
    col = mix(col, tint(vec3(0.1, 0.09, 0.22), 0.7), smoothstep(0.5, 0.52, cloud));
    col = mix(col, tint(vec3(0.2, 0.16, 0.38), 0.7), smoothstep(0.64, 0.66, cloud) * 0.8);

    float fade = smoothstep(0.06, 0.4, r);
    col = mix(col, mix(u_accent, vec3(1.0), 0.35), streaks(angle, r, s, 64.0, 0.0, dp) * fade);
    col = mix(col, vec3(0.92, 0.95, 1.0), streaks(angle, r, s * 1.6, 140.0, 7.0, dp) * fade * 0.8);

    float core = exp(-r * 5.0);
    col = mix(col, mix(u_accent, vec3(1.0), 0.4), smoothstep(0.42, 0.44, core));
    return mix(col, vec3(1.0), smoothstep(0.7, 0.72, core));
}
`;
