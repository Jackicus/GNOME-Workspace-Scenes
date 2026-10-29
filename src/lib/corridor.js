// A curved concrete service tunnel, cel-shaded: panel seams and bolts, cracks, a
// pipe along the ceiling, lamps overhead and a white curb line on the floor.

const BEND = 0.035;
const HALF_WIDTH = 1.6;

export const fog = 0.11;
export const focus = 1;
// Past this depth the bend hides a workspace standing on the centre line.
export const reveal = 2 * Math.sqrt(HALF_WIDTH / BEND);

export const offset = (depth, dir) => [-BEND * depth * dir, 0];
export const roll = () => 0;
export const vanish = dir => [-BEND * 5 * dir, 0.05];

export const glsl = `
const float BEND = ${BEND};
const float CW = ${HALF_WIDTH};
const float CF = 1.0;
const float CC = 1.2;
const float PANEL = 2.6;
const float FOG = ${fog};

vec3 sceneInk() {
    return tint(vec3(0.106, 0.133, 0.196), 0.15);
}

vec3 sceneLine() {
    return tint(vec3(0.85, 0.87, 0.9), 0.1);
}

// The nearest z where a ray of slope u meets the wall x = c - BEND z^2.
float wallHit(float u, float c) {
    float a = -BEND;
    float d = u * u - 4.0 * a * c;
    if (d < 0.0)
        return 1e4;
    float q = sqrt(d);
    float z1 = (u + q) / (2.0 * a);
    float z2 = (u - q) / (2.0 * a);
    float z = 1e4;
    if (z1 > 0.0)
        z = min(z, z1);
    if (z2 > 0.0)
        z = min(z, z2);
    return z;
}

vec3 scene(vec2 uv, float dp) {
    vec3 far = tint(vec3(0.047, 0.078, 0.141), 0.25);
    vec3 wall = tint(vec3(0.561, 0.608, 0.69), 0.12);
    vec3 shade = tint(vec3(0.361, 0.404, 0.475), 0.15);
    vec3 floorTone = tint(vec3(0.122, 0.157, 0.22), 0.2);
    vec3 inkTone = sceneInk();
    vec3 pale = sceneLine();

    float u = uv.x * u_dir;
    float v = uv.y;
    float zR = wallHit(u, CW);
    float zL = wallHit(u, -CW);
    float zF = v < 0.0 ? -CF / v : 1e4;
    float zC = v > 0.0 ? CC / v : 1e4;
    float z = min(min(zR, zL), min(zF, zC));
    if (z > 300.0)
        return far;

    float s = z + u_cam;
    float h = v * z;
    float x = u * z + BEND * z * z;
    float pix = dp * z;
    float pid = floor(s / PANEL);
    float ls = s - pid * PANEL;
    float dj = ls < 0.5 * PANEL ? ls : ls - PANEL;
    float lc = s - (floor(s / (3.0 * PANEL)) + 0.5) * 3.0 * PANEL;
    float tall = CF + CC;
    vec3 col;
    float lines = 0.0;
    float fogK = 1.0;

    if (z == zR || z == zL) {
        float side = z == zR ? 1.0 : -1.0;
        float fs = pix * (1.0 + z / CW);
        float wob = 1.0 + (vnoise(s * 2.7 + side * 5.0) - 0.5) * 0.8;
        float shift = 0.01 * (vnoise(s * 1.3 + side) - 0.5);
        vec3 lit = side > 0.0 ? wall : mix(wall, shade, 0.45);
        vec3 dark = side > 0.0 ? shade : mix(shade, far, 0.35);
        float top = -CF + tall * (0.12 + 0.5 * fbm(s * 0.22 + side * 31.0));
        col = mix(lit, dark, 1.0 - smoothstep(top - pix, top + pix, h));
        col = mix(col, dark * 0.8, 1.0 - smoothstep(-CF + 0.05 - pix, -CF + 0.05 + pix, h));
        float spill = (1.0 - smoothstep(0.9 - fs, 0.9 + fs, abs(lc))) * step(0.2, h);
        col = mix(col, col * 1.18 + 0.03, spill * 0.6);
        if (side > 0.0) {
            vec2 d = vec2((s - u_cam - 3.2) / 1.8, (h - 0.15) / 1.1);
            col = mix(col, col * 1.22 + 0.035, exp(-dot(d, d) * 1.5) * 0.55);
        }

        float s1 = -CF + tall * 0.36 + shift;
        float s2 = -CF + tall * 0.68 + shift;
        lines = max(lines, ink(h - s1, 0.018 * wob, pix));
        lines = max(lines, ink(h - s2, 0.018 * wob, pix));
        lines = max(lines, ink(dj, 0.014 * wob, fs));
        lines = max(lines, ink(h + CF, 0.025, pix));
        lines = max(lines, ink(h - CC, 0.025, pix));

        float rb = max(fs / 0.028, pix / 0.042);
        vec2 b1 = vec2((abs(dj) - 0.075) / 0.028, (abs(h - s1) - 0.14) / 0.042);
        vec2 b2 = vec2((abs(dj) - 0.075) / 0.028, (abs(h - s2) - 0.14) / 0.042);
        lines = max(lines, 1.0 - smoothstep(1.0 - rb, 1.0 + rb, length(b1)));
        lines = max(lines, 1.0 - smoothstep(1.0 - rb, 1.0 + rb, length(b2)));

        if (hash(pid * 1.37 + side * 11.0) > 0.35) {
            float cx = (0.2 + 0.6 * hash(pid * 2.11 + side * 3.0)) * PANEL;
            float h0 = mix(-CF, CC, 0.1 + 0.5 * hash(pid * 3.7 + side));
            float h1 = h0 + tall * (0.2 + 0.4 * hash(pid * 5.3 + side));
            float dx = ls - cx - 0.12 * sin(h * 2.3 + pid) - 0.08 * (vnoise(h * 6.0 + pid * 9.0) - 0.5);
            float span = smoothstep(h0, h0 + 0.1, h) * (1.0 - smoothstep(h1 - 0.1, h1, h));
            lines = max(lines, ink(dx, 0.008, fs) * span * 0.85);
        }
    } else if (z == zF) {
        col = floorTone;
        float stripe = 1.0 - smoothstep(0.06 - pix, 0.06 + pix, abs(x + CW - 0.32));
        col = mix(col, col * 1.3 + 0.02, step(abs(lc), 0.6) * 0.5);
        col = mix(col, pale, stripe);
        fogK = 1.0 - 0.6 * stripe;
        lines = max(ink(x - CW, 0.03, pix), ink(x + CW, 0.03, pix));
    } else {
        float fs = pix * (1.0 + z / CC);
        col = mix(far, shade, 0.25);
        float pc = CW - 0.35;
        float px = (x - pc) / 0.22;
        if (abs(px) < 1.0) {
            col = mix(shade, wall, 0.3 + 0.25 * (1.0 - abs(px)));
            float hl = step(0.55, vnoise(s * 0.8)) * (1.0 - smoothstep(0.12, 0.2, abs(px + 0.3)));
            col = mix(col, pale, hl * 0.5);
        }
        float across = 1.0 - smoothstep(0.32 - pix, 0.32 + pix, abs(x + 0.2));
        float lamp = (1.0 - smoothstep(0.5 - fs, 0.5 + fs, abs(lc))) * across;
        float halo = (1.0 - smoothstep(1.0 - fs, 1.0 + fs, abs(lc))) * step(abs(x + 0.2), 0.7);
        col = mix(col, col * 1.3 + 0.05, halo * 0.5);
        col = mix(col, mix(pale, vec3(1.0), 0.5), lamp);
        fogK = 1.0 - 0.65 * lamp;
        lines = max(lines, ink(x - pc - 0.22, 0.02, pix));
        lines = max(lines, ink(x - pc + 0.22, 0.02, pix));
        lines = max(lines, ink(dj, 0.025, fs) * step(abs(x - pc), 0.3));
        lines = max(lines, ink(x - CW, 0.025, pix));
        lines = max(lines, ink(x + CW, 0.025, pix));
        lines = max(lines, ink(abs(lc) - 0.5, 0.012, fs) * across);
    }

    col = mix(col, inkTone, lines);
    return mix(col, far, (1.0 - exp(-z * FOG)) * fogK);
}
`;
