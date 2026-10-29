import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {SCENES} from './lib/scenes.js';

export default class WorkspaceScenesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();

        const ids = [...SCENES.map(s => s.id), 'random'];
        const sceneRow = new Adw.ComboRow({
            title: 'Scene',
            subtitle: 'What a workspace switch passes through',
            model: Gtk.StringList.new([...SCENES.map(s => s.name), 'A Different One Each Time']),
            selected: Math.max(ids.indexOf(settings.get_string('scene')), 0),
        });
        sceneRow.connect('notify::selected', () =>
            settings.set_string('scene', ids[sceneRow.selected]));
        const sceneGroup = new Adw.PreferencesGroup();
        sceneGroup.add(sceneRow);
        page.add(sceneGroup);

        const motion = new Adw.PreferencesGroup({title: 'Motion'});
        const duration = Adw.SpinRow.new_with_range(400, 2000, 50);
        duration.set({title: 'Duration', subtitle: 'Milliseconds for a switch to the next workspace'});
        settings.bind('duration', duration, 'value', Gio.SettingsBindFlags.DEFAULT);
        motion.add(duration);
        const rate = Adw.SpinRow.new_with_range(0, 30, 1);
        rate.set({
            title: 'Scene Drawings per Second',
            subtitle: 'Anime holds each drawing; 0 draws every frame',
        });
        settings.bind('step-rate', rate, 'value', Gio.SettingsBindFlags.DEFAULT);
        motion.add(rate);
        page.add(motion);

        const style = new Adw.PreferencesGroup({title: 'Style'});
        for (const [key, title, subtitle] of [
            ['focus-lines', 'Focus Lines', 'Speed lines while the camera races'],
            ['impact-frame', 'Impact Frame', 'One inverted drawing as the new workspace arrives'],
        ]) {
            const row = new Adw.SwitchRow({title, subtitle});
            settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
            style.add(row);
        }
        page.add(style);

        window.add(page);
    }
}
