module.exports = async (client) => {
  let eventsSize = {};

  // Remove only client-level and manager-level listeners.
  // Do NOT touch client.manager.shoukaku listeners — Shoukaku manages its own
  // internal WebSocket handlers and removing them breaks the node connection.
  await client.removeAllListeners();
  await client.manager.removeAllListeners();

  // Clear cached event files so they are re-required fresh
  let eventFiles = Object.keys(require.cache).filter(
    (f) => f.includes("events") && !f.includes("node_modules"),
  );
  for (const key of eventFiles) {
    try {
      delete require.cache[require.resolve(key)];
    } catch (e) {}
  }

  try {
    eventsSize.client = await require("@loaders/clientEvents.js")(client);
    eventsSize.node = await require("@loaders/nodeEvents")(client);
    eventsSize.player = await require("@loaders/playerEvents")(client);
    eventsSize.custom = await require("@loaders/customEvents.js")(client);
    return (
      `Re-Loaded Events [` +
      ` Client: ${eventsSize.client} ` +
      ` Node: ${eventsSize.node} ` +
      ` Player: ${eventsSize.player} ` +
      ` Custom: ${eventsSize.custom} ]`
    );
  } catch (error) {
    return `${error.stack}`;
  }
};
