var testpilotPingChannel = new BroadcastChannel("testpilot-pings");
testpilotPingChannel.postMessage({
  boolData: true,
  arrayOfData: ["one", "two", "three"],
  nestedData: {
    intData: 10,
  },
});
console.log("TEST PILOT PING SENT");
