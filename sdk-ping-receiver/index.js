const WebExtensionPingListener = require("./webext-ping-listener");
const self = require("sdk/self");

let webextPingListener = new WebExtensionPingListener(
  "webext-ping-sender@mozilla.com", // The addon which is going to send testpilot pings
  self.id, // The id of the addon which receive the ping (the main testpilot addon id)
  module.url // The url of the module that is listening for webextension testpilot pings
);

webextPingListener.registerPingListener((ping) => {
  console.log("TEST PILOT PING RECEIVED", ping);
  dump(`TEST PILOT PING RECEIVED: ${JSON.stringify(ping, null, 2)}\n`);
});
