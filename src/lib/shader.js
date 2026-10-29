import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';

import {shaderSource} from './scenes.js';

// Kept across disable and enable: a GType cannot be unregistered, and a class builds
// its snippet once.
const classes = new Map();

export function effectClass(scene) {
    if (!classes.has(scene.id)) {
        const {declarations, code} = shaderSource(scene);
        const Effect = class extends Clutter.ShaderEffect {
            vfunc_get_static_snippet() {
                const snippet = Cogl.Snippet.new(Cogl.SnippetHook.FRAGMENT, declarations, null);
                snippet.set_replace(code);
                return snippet;
            }

            // Every uniform is a float or a vector of up to four, all this setter holds.
            setUniform(name, values) {
                this.set_uniform_float(name, values.length, values);
            }
        };
        // GJS names the GType after the module and the class, so each scene's class needs a name of its own.
        Object.defineProperty(Effect, 'name', {value: `WorkspaceScenes_${scene.id}`});
        classes.set(scene.id, GObject.registerClass(Effect));
    }
    return classes.get(scene.id);
}
