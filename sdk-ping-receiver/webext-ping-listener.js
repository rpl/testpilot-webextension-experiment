const self = require("sdk/self");
const { Ci, Cu } = require("chrome");
const { Class } = require("sdk/core/heritage");
const { Disposable } = require("sdk/core/disposable");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// Lazy imports.
XPCOMUtils.defineLazyModuleGetter(this, "Services",
                                  "resource://gre/modules/Services.jsm");

let {getExtensionUUID} = Cu.import("resource://gre/modules/Extension.jsm", {});

function createChannelForAddonId(name, addonId) {
  let targetExtensionUUID = getExtensionUUID(addonId);
  let baseURI = Services.io
        .newURI(`moz-extension://${targetExtensionUUID}/_blank.html`, null, null);
  let principal = Services.scriptSecurityManager
        .createCodebasePrincipal(baseURI, { addonId });

  let addonChromeWebNav = Services.appShell.createWindowlessBrowser(true);
  let docShell = addonChromeWebNav.QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIDocShell);
  docShell.createAboutBlankContentViewer(principal);
  let window = docShell.contentViewer.DOMDocument.defaultView;
  let addonBroadcastChannel = new window.BroadcastChannel(name);

  return {
    addonChromeWebNav,
    addonBroadcastChannel
  };
}

module.exports = Class({
  implements: [Disposable],

  initialize(targetAddonId) {
    this.pingListeners = new Set();

    this.targetAddonId = targetAddonId;

    let {
      addonChromeWebNav,
      addonBroadcastChannel
    } = createChannelForAddonId("testpilot-pings", targetAddonId);

    // NOTE: Keep a ref to prevent it from going away during garbage collection
    // (or the BroadcastChannel will stop working).
    this.addonChromeWebNav = addonChromeWebNav;
    this.addonBroadcastChannel = addonBroadcastChannel;
  },

  dispose() {
    this.addonBroadcastChannel.removeEventListener();
    this.addonChromeWebNav.close();
    this.pingListeners.clear();

    this.addonBroadcastChannel = null;
    this.addonChromeWebNav = null;
  },

  registerPingListener(callback) {
    this.pingListeners.add(callback);

    if (this.pingListeners.size >= 0) {
      this.addonBroadcastChannel.addEventListener("message", this);
    }
  },

  unregisterPingListener(callback) {
    this.pingListeners.delete(callback);

    if (this.pingListeners.size == 0) {
      this.addonBroadcastChannel.removeEventListener("message", this);
    }
  },

  handleEvent(event) {
    if (event.data) {
      this.notifyPing(event.data, {addonId: this.targetAddonId});
    }
  },

  notifyPing(data, sender) {
    for (let pingListener of this.pingListeners) {
      try {
        pingListener({
          senderAddonId: sender.addonId,
          testpilotPingData: data,
        });
      } catch(e) {
        console.error("Error executing pingListener", err);
      }
    }
  }
});
