
#include <gtk/gtk.h>

GtkStatusIcon *createIcon(GdkWindow *window, char *aTitle, unsigned int show);
void setIconTitle(GtkStatusIcon *tray_icon, char *aTitle);
void iconVisible(GtkStatusIcon *tray_icon, unsigned int show);

void destroyIcon(GtkStatusIcon *tray_icon);

typedef struct IconPress {
    int    button;
    int    clicks;
    double x;
    double y;
} IconPress;

typedef void (*IconPressCallback)(IconPress event);

void addEventHandlers(GtkStatusIcon *tray_icon, IconPressCallback callback);
