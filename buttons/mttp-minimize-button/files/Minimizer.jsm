const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var EXPORTED_SYMBOLS = ["MinimizerFactory", "Minimizer", "MinimizerCleanup"];

const ext_id = "{de1b245c-de57-11da-ba2d-0050c2490048}";

Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import('resource://gre/modules/ctypes.jsm');

function getLibFileName() {
	var XULRuntime = Cc["@mozilla.org/xre/app-info;1"]
		.getService(Ci.nsIXULRuntime);
	var platform = ((XULRuntime.XPCOMABI.substring(0, 6) == 'x86_64') ? '64' : '32')
	return {
		folder: XULRuntime.OS + '-' + platform,
		fileName: XULRuntime.OS == "WINNT" ? "libtrayicon.dll" : "libtrayicon.so"
	};
}

/* the library */
var trayicon = null;

/* functions in our library */
var createIcon = null;
var destroyIcon = null;
var iconVisible = null;
var setIconTitle = null;
var IconPress = null;
var IconPressCallback = null;
var addEventHandlers = null;

const LEFT_BUTTON = 1;
const MIDDLE_BUTTON = 2;
const RIGHT_BUTTON = 3;

AddonManager.getAddonByID(ext_id, function (addon) {
	var libraryFile = addon.getResourceURI(
		"library").QueryInterface(Ci.nsIFileURL).file;
	var libData = getLibFileName();
	libraryFile.append(libData.folder);
	libraryFile.append(libData.file);
	trayicon = ctypes.open(libraryFile.path);

	createIcon = trayicon.declare('createIcon', ctypes.default_abi,
		ctypes.voidptr_t,
		ctypes.voidptr_t,
		ctypes.char.ptr,
		ctypes.unsigned_int
	);
	destroyIcon = trayicon.declare('destroyIcon', ctypes.default_abi,
		ctypes.void_t,
		ctypes.voidptr_t
	);
	iconVisible = trayicon.declare('iconVisible', ctypes.default_abi,
		ctypes.void_t,
		ctypes.voidptr_t,
		ctypes.unsigned_int
	);
	setIconTitle = trayicon.declare('setIconTitle', ctypes.default_abi,
		ctypes.void_t,
		ctypes.voidptr_t,
		ctypes.char.ptr
	);
	IconPress = new ctypes.StructType("IconPress",
		[{"button": ctypes.int},
			{"clicks": ctypes.int},
			{"x": ctypes.double},
			{"y": ctypes.double}]);
	IconPressCallback = ctypes.FunctionType(ctypes.default_abi, ctypes.void_t, [IconPress]);
	addEventHandlers = trayicon.declare('addEventHandlers', ctypes.default_abi,
		ctypes.void_t,
		ctypes.voidptr_t,
		ctypes.voidptr_t
	);
});

var minimizers = {};

function MinimizerFactory(window) {
	if (window in minimizers) {
		return minimizers[window];
	} else {
		var miner = new Minimizer(window);
		minimizers[window] = miner;
		return miner;
	}
}

function Minimizer(window) {
	this.icon = null;
	this.baseWindow = window.top.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIWebNavigation)
		.QueryInterface(Ci.nsIDocShellTreeItem)
		.treeOwner
		.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIBaseWindow);

	this.hwndString = this.baseWindow.nativeHandle;
	this.hwnd = ctypes.voidptr_t(ctypes.UInt64(this.hwndString));

	this.minimize = function () {
		if (this.icon == null) {
			this.setup();
		} else {
			setIconTitle(this.icon, title);
			iconVisible(this.icon, true);
		}
		this.baseWindow.visibility = false;
	};

	this.setup = function () {
		var windowTitle = this.baseWindow.title;
		var title = ctypes.char.array()(windowTitle);
		this.icon = createIcon(this.hwnd, title, true);
		addEventHandlers(this.icon, IconPressCallback.ptr(this.press));
	};

	this.press = function(event) {
		this.restore();
	};

	this.restore = function () {
		if (this.icon) {
			iconVisible(this.icon, false);
		}
		this.baseWindow.visibility = true;
	};

	this.cleanup = function () {
		destroyIcon(this.icon);
	}
}

function MinimizerCleanup() {
	for(var win in minimizers) {
		minimizers[win].cleanup();
	}
	trayicon.close();
}