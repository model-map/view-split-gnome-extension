// Import necessary modules
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import { wm } from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class MyExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.WIDTH_DELTA = 10;
        this.HEIGHT_DELTA = 11;
        this._settings = null;
        this._yStart = 0;
    }

    enable() {
        const mode = Shell.ActionMode.NORMAL;
        const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;
        this._settings = this.getSettings('org.gnome.shell.extensions.viewsplit');

        wm.addKeybinding('toggle-top', this._settings, flag, mode, () => {
            const window = this.getActiveWindow();
            if (!window) {
                return;
            }
            const rects = this.getRectangles(window);
            const newHeight = this.getResizeVal(rects.workspace.h, rects.window.h, this.HEIGHT_DELTA);
            this._yStart = 0;

            window.unmaximize(Meta.MaximizeFlags.VERTICAL);
            window.move_frame(false, rects.window.x, 0);
            window.move_resize_frame(false, rects.window.x, this._yStart, rects.window.w, newHeight);
        });

        wm.addKeybinding('toggle-bottom', this._settings, flag, mode, () => {
            const window = this.getActiveWindow();
            if (!window) {
                return;
            }
            const rects = this.getRectangles(window);
            const newHeight = this.getResizeVal(rects.workspace.h, rects.window.h, this.HEIGHT_DELTA);
            this._yStart = rects.workspace.h - newHeight + 100;

            window.unmaximize(Meta.MaximizeFlags.VERTICAL);
            window.move_frame(false, rects.window.x, this._yStart);
            window.move_resize_frame(false, rects.window.x, this._yStart, rects.window.w, newHeight);
        });

        wm.addKeybinding('toggle-left', this._settings, flag, mode, () => {
            const window = this.getActiveWindow();
            if (!window) {
                return;
            }
            const rects = this.getRectangles(window);
            const newWidth = this.getResizeVal(rects.workspace.w, rects.window.w, this.WIDTH_DELTA);

            window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
            window.move_frame(false, rects.workspace.x, 0);
            window.move_resize_frame(false, rects.workspace.x, this._yStart, newWidth, rects.window.h);
        });

        wm.addKeybinding('toggle-right', this._settings, flag, mode, () => {
            const window = this.getActiveWindow();
            if (!window) {
                return;
            }
            const rects = this.getRectangles(window);
            const newWidth = this.getResizeVal(rects.workspace.w, rects.window.w, this.WIDTH_DELTA);
            const xStart = rects.workspace.x + rects.workspace.w - newWidth;

            window.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
            window.move_frame(false, xStart, 0);
            window.move_resize_frame(false, xStart, this._yStart, newWidth, rects.window.h);
        });
    }

    disable() {
        wm.removeKeybinding('toggle-left');
        wm.removeKeybinding('toggle-right');
        wm.removeKeybinding('toggle-top');
        wm.removeKeybinding('toggle-bottom');
        this._settings = null;
    }

    getActiveWindow() {
        return global.display.get_focus_window();
    }

    getRectangles(window) {
        const rect = window.get_frame_rect();
        const monitor = window.get_monitor();
        const workspace = window.get_workspace();
        const monitorWorkArea = workspace.get_work_area_for_monitor(monitor);

        return {
            window: {
                h: rect.height,
                w: rect.width,
                x: rect.x,
                y: rect.y,
            },
            workspace: {
                h: monitorWorkArea.height,
                w: monitorWorkArea.width,
                x: monitorWorkArea.x,
                y: monitorWorkArea.y,
            },
        };
    }

    getResizeVal(workspaceAxis, windowAxis, c) {
        const size1 = workspaceAxis;
        const size2 = workspaceAxis / 2;

        if (windowAxis < size1 - c) {
            return size1;
        }

        return size2;
    }
}