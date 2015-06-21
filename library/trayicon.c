
#include "trayicon.h"

#include <stdio.h> 
#include <ctype.h>
#include <glib.h>

#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/Xutil.h>
#include <gdk/gdkx.h>

GHashTable *iconEvents = NULL;

gboolean iconEvent(GtkWidget *widget, GdkEvent *event, gpointer user_data) {
    GtkStatusIcon *tray_icon = (GtkStatusIcon *)widget;
    IconPressCallback callback = (IconPressCallback)g_hash_table_lookup(iconEvents, tray_icon);
    int clicks = 1;
    GdkEventButton *buttonEvent = (GdkEventButton *)event;
    if(buttonEvent->type == GDK_2BUTTON_PRESS) {
        clicks = 2;
    } else if(buttonEvent->type == GDK_3BUTTON_PRESS ) {
        clicks = 3;
    }
    IconPress icon_press = {
        buttonEvent->button,
        clicks,
        buttonEvent->x,
        buttonEvent->y
    };
    callback(icon_press);
	return TRUE;
}

void addEventHandlers(GtkStatusIcon *tray_icon, IconPressCallback callback) {
    if(iconEvents == NULL) {
        iconEvents = g_hash_table_new(g_direct_hash, g_direct_equal);
    }
    g_hash_table_insert(iconEvents, tray_icon, callback);
}

void setIconTitle(GtkStatusIcon *tray_icon, char *aTitle) {
    gtk_status_icon_set_tooltip_text(tray_icon, aTitle);
}

GtkStatusIcon *createIcon(GdkWindow *window, char *aTitle, unsigned int show) {
	GtkStatusIcon *systrayIcon;
	GdkPixbuf *windowIcon;

	GdkWindow *gdk_win = gdk_window_get_toplevel((GdkWindow*) window);
	GtkWidget* widget;
	gdk_window_get_user_data(gdk_win, (gpointer*) &widget);
	GtkWidget *toplevel = gtk_widget_get_toplevel(widget);

	systrayIcon = gtk_status_icon_new();
	if(toplevel) {
		windowIcon = gtk_window_get_icon(GTK_WINDOW(toplevel));
		if(windowIcon) {
			gtk_status_icon_set_from_pixbuf(systrayIcon, windowIcon);
		} else {
			const gchar* iconName = gtk_window_get_icon_name(
				GTK_WINDOW(toplevel));
			gtk_status_icon_set_from_icon_name(
				systrayIcon, g_ascii_strdown(iconName, -1));
		}
		if(aTitle) {
			gtk_status_icon_set_tooltip_text(systrayIcon, aTitle);
		} else {
			char *title = (char*)gtk_window_get_title((GtkWindow*)toplevel);
			gtk_status_icon_set_tooltip_text(systrayIcon, title);
		}
	}
	g_signal_connect(G_OBJECT(systrayIcon), "button-press-event", 
		G_CALLBACK(iconEvent), NULL);
	gtk_status_icon_set_visible(systrayIcon, show);
	return systrayIcon;
}

void destroyIcon(GtkStatusIcon *tray_icon) {
	gtk_status_icon_set_visible(tray_icon, FALSE);
	g_object_unref(tray_icon);
}

void iconVisible(GtkStatusIcon *tray_icon, unsigned int show) {
	gtk_status_icon_set_visible(tray_icon, show);
}