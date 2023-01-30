// Mostly taken from https://raw.githubusercontent.com/gTile/gTile and https://github.com/shiznatix/bifocals-gnome-extension/
// Slightly modified but all real credit goes to gTitle and BiFocals!

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const prettyNames = {
	'toggle-left': 'Split view Left',
	'toggle-right': 'Split view Right',
	'toggle-top': 'Split view Top',
	'toggle-bottom': 'Split view Bottom'
};

// eslint-disable-next-line no-unused-vars
function init() {
}

function appendHotkey(model, settings, name, prettyName) {
	let key, mods, _;

	if (Gtk.get_major_version() >= 4) {
		// ignore ok as failure treated as disabled
		[_, key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);
	} else {
		[key, mods] = Gtk.accelerator_parse(settings.get_strv(name)[0]);
	}

	const row = model.insert(-1);

	model.set(row, [0, 1, 2, 3], [name, prettyName, mods, key]);
}

function setChild(widget, child) {
	if (Gtk.get_major_version() >= 4) {
		widget.set_child(child);
	} else {
		widget.add(child);
	}
}

// eslint-disable-next-line no-unused-vars
function buildPrefsWidget() {
	const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.viewsplit');
	const grid = new Gtk.Grid({
		column_spacing: 10,
		orientation: Gtk.Orientation.VERTICAL,
		row_spacing: 10,
		visible: true,
	});

	grid.set_margin_start(24);
	grid.set_margin_top(24);

	const model = new Gtk.ListStore();

	model.set_column_types([
		GObject.TYPE_STRING,
		GObject.TYPE_STRING,
		GObject.TYPE_INT,
		GObject.TYPE_INT,
	]);

	for (const key in prettyNames) {
		appendHotkey(model, settings, key, prettyNames[key]);
	}

	const treeview = new Gtk.TreeView({
		model,
		hexpand: true,
		visible: true,
	});

	const renderShotcutTitle = new Gtk.CellRendererText();
	const colShortcutTitle = new Gtk.TreeViewColumn({
		title: 'Keybinding',
		expand: true,
	});

	colShortcutTitle.pack_start(renderShotcutTitle, true);
	colShortcutTitle.add_attribute(renderShotcutTitle, 'text', 1);

	treeview.append_column(colShortcutTitle);

	const renderKeybinding = new Gtk.CellRendererAccel({
		'editable': true,
		'accel-mode': Gtk.CellRendererAccelMode.GTK,
	});
	renderKeybinding.connect('accel-cleared', (rend, strIter) => {
		const [success, iter] = model.get_iter_from_string(strIter);

		if (!success) {
			throw new Error('Something went wrong trying to clear the accel');
		}

		const name = model.get_value(iter, 0);
		model.set(iter, [3], [0]);
		settings.set_strv(name, ['']);
	});
	renderKeybinding.connect('accel-edited', (rend, strIter, key, mods) => {
		const value = Gtk.accelerator_name(key, mods);

		const [success, iter] = model.get_iter_from_string(strIter);

		if (!success) {
			throw new Error('Something went wrong trying to set the accel');
		}

		const name = model.get_value(iter, 0);

		model.set(iter, [ 2, 3 ], [ mods, key ]);

		settings.set_strv(name, [value]);
	});

	const colKeybinding = new Gtk.TreeViewColumn({
		title: 'Accel',
	});

	colKeybinding.pack_end(renderKeybinding, false);
	colKeybinding.add_attribute(renderKeybinding, 'accel-mods', 2);
	colKeybinding.add_attribute(renderKeybinding, 'accel-key', 3);

	treeview.append_column(colKeybinding);

	const shortcutsLabel = new Gtk.Label({
		label: 'Keyboard shortcuts',
		halign: Gtk.Align.START,
		justify: Gtk.Justification.LEFT,
		use_markup: false,
		wrap: true,
		visible: true,
	});

	grid.attach_next_to(shortcutsLabel, null, Gtk.PositionType.BOTTOM, 1, 1);
	grid.attach_next_to(treeview, null, Gtk.PositionType.BOTTOM, 1, 1);

	const scrollWindow = new Gtk.ScrolledWindow({
		vexpand: true,
		visible: true,
	});

	setChild(scrollWindow, grid);

	return scrollWindow;
}
