// Compiles every scene's shader with glslangValidator in each GLSL dialect Cogl may
// hand it to, wrapped the way Cogl wraps a snippet. A mistake is silent in the shell
// (the scene draws nothing); here it names the line.
//
//   node scripts/shaders.mjs [SCENES]    comma-separated ids; default all

import fs from 'fs';
import os from 'os';
import path from 'path';
import {execFileSync} from 'child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const {SCENES, shaderSource} = await import(path.join(here, '..', 'src', 'lib', 'scenes.js'));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-scenes-shaders-'));

const DIALECTS = {
    'GLSL 1.10': ['#version 110', 'varying vec4 cogl_color_in;\nvarying vec4 cogl_tex_coord_in[1];', '#define cogl_color_out gl_FragColor'],
    'GLSL 3.30': ['#version 330', 'in vec4 cogl_color_in;\nin vec4 cogl_tex_coord_in[1];', 'out vec4 cogl_color_out;'],
    'GLSL ES 1.00': ['#version 100\nprecision highp float;', 'varying vec4 cogl_color_in;\nvarying vec4 cogl_tex_coord_in[1];', '#define cogl_color_out gl_FragColor'],
};

const wanted = process.argv[2]?.split(',');
let failures = 0;
for (const scene of SCENES.filter(s => !wanted || wanted.includes(s.id))) {
    const {declarations, code} = shaderSource(scene);
    const errors = [];
    for (const [name, [version, inputs, output]] of Object.entries(DIALECTS)) {
        const file = path.join(work, `${scene.id}.frag`);
        fs.writeFileSync(file, `${version}\n${inputs}\n${output}\n${declarations}\nvoid main() {\n${code}\n}\n`);
        try {
            execFileSync('glslangValidator', [file], {stdio: 'pipe'});
        } catch (e) {
            errors.push(`${name}:\n${e.stdout || e.message}`);
        }
    }
    console.log(`${scene.id.padEnd(10)} ${errors.length ? `FAILED\n${errors.join('\n')}` : 'ok'}`);
    failures += errors.length;
}
fs.rmSync(work, {recursive: true});
process.exit(failures ? 1 : 0);
