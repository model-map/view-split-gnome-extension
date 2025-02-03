import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const prettyNames = {
    'toggle-left': 'Split view Left',
    'toggle-right': 'Split view Right',
    'toggle-top': 'Split view Top',
    'toggle-bottom': 'Split view Bottom',
};

export default class ViewSplitPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.viewsplit');

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcuts'),
        });

        const model = new Gtk.ListStore();
        model.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_INT,
            GObject.TYPE_INT,
        ]);

        for (const key in prettyNames) {
            this.appendHotkey(model, settings, key, prettyNames[key]);
        }

        const treeview = new Gtk.TreeView({
            model,
            hexpand: true,
            vexpand: true,
        });

        const renderShortcutTitle = new Gtk.CellRendererText();
        const colShortcutTitle = new Gtk.TreeViewColumn({
            title: _('Keybinding'),
            expand: true,
        });
        colShortcutTitle.pack_start(renderShortcutTitle, true);
        colShortcutTitle.add_attribute(renderShortcutTitle, 'text', 1);
        treeview.append_column(colShortcutTitle);

        const renderKeybinding = new Gtk.CellRendererAccel({
            'editable': true,
            'accel-mode': Gtk.CellRendererAccelMode.GTK,
        });

        renderKeybinding.connect('accel-cleared', (rend, strIter) => {
            const [success, iter] = model.get_iter_from_string(strIter);
            if (!success) return;

            const name = model.get_value(iter, 0);
            model.set(iter, [3], [0]);
            settings.set_strv(name, ['']);
        });

        renderKeybinding.connect('accel-edited', (rend, strIter, key, mods) => {
            const value = Gtk.accelerator_name(key, mods);
            const [success, iter] = model.get_iter_from_string(strIter);
            if (!success) return;

            const name = model.get_value(iter, 0);
            model.set(iter, [2, 3], [mods, key]);
            settings.set_strv(name, [value]);
        });

        const colKeybinding = new Gtk.TreeViewColumn({
            title: _('Accel'),
        });
        colKeybinding.pack_end(renderKeybinding, false);
        colKeybinding.add_attribute(renderKeybinding, 'accel-mods', 2);
        colKeybinding.add_attribute(renderKeybinding, 'accel-key', 3);
        treeview.append_column(colKeybinding);

        group.add(treeview);
        page.add(group);
        window.add(page);
    }

    appendHotkey(model, settings, name, prettyName) {
        let key, mods, _;

        if (Gtk.get_major_version() >= 4) {
            [_, key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0] || '');
        } else {
            [key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0] || '');
        }

        const row = model.insert(-1);
        model.set(row, [0, 1, 2, 3], [name, prettyName, mods, key]);
    }
}