import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';

import {shaderSource} from './scenes.js';

// Kept across disable and enable: a GType cannot be unregistered, and a class compiles
// its pipeline once.
const classes = new Map();

export function effectClass(scene) {
    if (!classes.has(scene.id)) {
        const {declarations, code} = shaderSource(scene);
        const Effect = class extends Shell.GLSLEffect {
            vfunc_build_pipeline() {
                this.add_glsl_snippet(Cogl.SnippetHook.FRAGMENT, declarations, code, true);
            }

            setUniform(name, values) {
                this.set_uniform_float(this.get_uniform_location(name), values.length, values);
            }
        };
        // GJS names the GType after the module and the class, so each scene's class needs a name of its own.
        Object.defineProperty(Effect, 'name', {value: `WorkspaceScenes_${scene.id}`});
        classes.set(scene.id, GObject.registerClass(Effect));
    }
    return classes.get(scene.id);
}
