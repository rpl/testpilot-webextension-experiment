const WebExtensionPingListener = require("./webext-ping-listener");
const self = require("sdk/self");

let targetAddonId = "webext-ping-sender@mozilla.com";

let webextPingListener = new WebExtensionPingListener(
  targetAddonId // The addon which is going to send testpilot pings
);

webextPingListener.registerPingListener((ping) => {
  console.log("TEST PILOT PING RECEIVED", ping);
  dump(`TEST PILOT PING RECEIVED: ${JSON.stringify(ping, null, 2)}\n`);
});

console.log("SDK LISTENING for TESTPILOT PINGS FROM addon", targetAddonId);
