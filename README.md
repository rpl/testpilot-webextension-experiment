Test Pilot WebExtension Ping Listener Experiment
================================================

This repo contains an experiment to be able to receive "TestPilot pings" generated from a "webextension testpilot experiment addon"
from the main "SDK TestPilot addon", before the Embedded WebExtension feature is landed.

The experiment contains two small addons:

- **sdk-ping-receiver**: is a small SDK addon that simulate the TestPilot ping receiver
  (the main TestPilot addon) and it contains a small helper module, `webext-ping-listener`
  (which is the module intended to be reused in the main TestPilot addon), and an example
  of its usage in the `index.js` entrypoint module

- **webext-ping-sender**: is a small WebExtension addon that simulate the ping sending,
  and in a callback waiting for a "ping sent" confirmation.

The `webext-ping-listener` SDK module is based on the code written for the Embedded
WebExtension feature, but it doesn't depends from it, but it works only for
Firefox >= 48 because of the changes happened in the WebExtensions internals.

## How to run the experiment

1. enter the `sdk-ping-receiver` and run the receiver addon using **jpm run**
2. in the opened Firefox instance, navigate to the `"about:debugging"` page
3. load the `webext-ping-sender` as a Temporarely Installed Addon
4. look in the Browser Console for addon logs to ensure that the ping has been
   sent (and received) as expected
