import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {WorkspaceScenesApp} from './lib/app.js';

export default class WorkspaceScenesExtension extends Extension {
    enable() {
        this._app = new WorkspaceScenesApp(this);
        this._app.enable();
    }

    disable() {
        this._app.disable();
        this._app = null;
    }
}
