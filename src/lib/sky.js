// A flight low over a cel-shaded cloud sea under an open sky, banking with the
// switch, with high wisps overhead and the sun to the side it turns toward.

export const fog = 0.035;
export const focus = 0.4;
export const reveal = 30;

export const offset = () => [0, 0];
export const roll = (p, dir) => dir * 0.14 * Math.sin(Math.PI * p);
export const vanish = () => [0, 0];

export const glsl = `
const float ALT = 1.0;
const float FOG = ${fog};

vec3 sceneInk() {
    return tint(vec3(0.16, 0.22, 0.36), 0.3);
}

vec3 sceneLine() {
    return vec3(1.0);
}

vec3 scene(vec2 uv, float dp) {
    vec3 zenith = tint(vec3(0.16, 0.36, 0.72), 0.35);
    vec3 horizon = tint(vec3(0.74, 0.85, 0.95), 0.12);
    vec3 col = mix(horizon, zenith, smoothstep(-0.05, 0.95, uv.y));
    float sun = length(uv - vec2(0.95 * u_dir, 0.55));
    col = mix(col, mix(col, vec3(1.0), 0.35), 1.0 - smoothstep(0.24 - dp, 0.24 + dp, sun));
    col = mix(col, vec3(1.0, 0.98, 0.93), 1.0 - smoothstep(0.12 - dp, 0.12 + dp, sun));

    if (uv.y > 0.0) {
        float z = 3.0 / uv.y;
        float wisp = smoothstep(0.62, 0.64, fbm2(vec2(uv.x * z * 0.12, (z + u_cam) * 0.04)));
        return mix(col, vec3(1.0), wisp * exp(-z * 0.02) * (1.0 - smoothstep(0.15, 0.5, uv.y)) * 0.75);
    }

    float z = ALT / max(-uv.y, 1e-4);
    vec2 p = vec2(uv.x * z, z + u_cam) * 0.22;
    float aa = min(dp * z * 0.33 * (1.0 + z / ALT), 0.15);
    float n = fbm2(p);
    float toward = fbm2(p + vec2(0.18 * u_dir, -0.18));
    vec3 sea = tint(vec3(0.12, 0.27, 0.52), 0.45);
    vec3 shade = tint(vec3(0.63, 0.71, 0.86), 0.3);
    vec3 cloud = mix(shade, vec3(0.98, 0.98, 1.0), smoothstep(-aa, aa, n - toward - 0.015));
    vec3 ground = mix(sea, cloud, smoothstep(0.44 - aa, 0.44 + aa, n));
    ground = mix(ground, sceneInk(), ink(n - 0.44, aa * 0.7, aa) * 0.55);
    return mix(ground, horizon, 1.0 - exp(-z * FOG));
}
`;
