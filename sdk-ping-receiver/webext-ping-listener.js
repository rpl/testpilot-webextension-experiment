const self = require("sdk/self");
const { Cu } = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// Lazy imports.
XPCOMUtils.defineLazyModuleGetter(this, "Services",
                                  "resource://gre/modules/Services.jsm");

// Import Messenger and BaseContext from ExtensionUtils.
Cu.import("resource://gre/modules/ExtensionUtils.jsm");
let {Messenger, BaseContext} = ExtensionUtils;

// TODO: Firefox 46 doesn't have BaseContext
const xulApp = require("sdk/system/xul-app");
if (!xulApp.satisfiesVersion(">= 48.0a1")) {
  throw Error("This module does not work on Firefox < 48");
}

class WebExtensionContext extends BaseContext {
  constructor(webextAddonId, { customContextType, id, url }) {
    super(webextAddonId);

    this.customContextType = customContextType || "custom-context";

    let sender = {
      id: id || self.id,
      url: url || module.uri,
    };

    // Receive messages from the senderAddonId.
    let filter = {extensionId: webextAddonId};

    // Classic Extensions (xul overlays, bootstrap restartless and Addon SDK)
    // runs with a systemPrincipal.
    this.addonPrincipal = Services.scriptSecurityManager.getSystemPrincipal();

    this.messenger = new Messenger(this, [Services.mm, Services.ppmm],
                                   sender, filter, null);

    this._cloneScope = Cu.Sandbox(this.addonPrincipal, {});
    Cu.setSandboxMetadata(this._cloneScope, {addonId: webextAddonId});

    this.api = {
      onConnect: this.messenger.onConnect("runtime.onConnect"),
      onMessage: this.messenger.onMessage("runtime.onMessage"),
    };
  }

  /**
   * Signal that the context is shutting down and call the unload method.
   * Called when the extension shuts down.
   */
  shutdown() {
    this.unload();
  }

  /**
   * This method is called when the extension shuts down or is unloaded.
   */
  unload() {
    if (this.unloaded) {
      return;
    }

    super.unload();
    Cu.nukeSandbox(this._cloneScope);
  }

  /**
   * Return the context cloneScope.
   */
  get cloneScope() {
    return this._cloneScope;
  }

  /**
   * The custom type of this context (that will always be "classic_extension").
   */
  get type() {
    return this.customContextType;
  }

  /**
   * The principal associated to the context (which is a system principal as the other
   * code running in a classic extension).
   */
  get principal() {
    return this.addonPrincipal;
  }
}

module.exports = class WebExtensionPingListener {
  constructor(webextAddonId, listenerAddonId, listenerURL) {
    this.pingListeners = new Set();
    this.listenerWebExtContext = new WebExtensionContext(webextAddonId, {
      id: listenerAddonId,
      url: listenerURL,
    });

    this.handleWebExtensionMessage = this.handleWebExtensionMessage.bind(this);

    this.listenerWebExtContext.api.onMessage.addListener(this.handleWebExtensionMessage);
  }

  destroy() {
    this.listenerWebExtContexts.unload();
    this.listenerWebExtContexts = null;
    this.pingListeners.clear();
  }

  registerPingListener(callback) {
    this.pingListeners.add(callback);
  }

  handleWebExtensionMessage(msg, sender, sendReply) {
    if (msg.testpilotPingData) {
      this.notifyPing(msg, sender);

      sendReply({
        testpilotPingReceived: true,
      });
    }
  }

  notifyPing(msg, sender) {
    for (let pingListener of this.pingListeners) {
      try {
        pingListener({
          senderAddonId: sender.extensionId,
          testpilotPingData: msg.testpilotPingData,
        });
      } catch(e) {
        console.error("Error executing pingListener", err);
      }
    }
  }
};
