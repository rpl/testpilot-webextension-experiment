browser.runtime.sendMessage({
  testpilotPingData: {
    boolData: true,
    arrayOfData: ["one", "two", "three"],
    nestedData: {
      intData: 10,
    },
  },
}, (reply) => {
  console.log("TEST PILOT PING REPLY RECEIVED", reply);
});
