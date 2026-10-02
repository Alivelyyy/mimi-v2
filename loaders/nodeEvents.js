const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  try {
    client.log("Loading node events", "debug");
    let count = 0;

    const nodeEventsPath = path.join(process.cwd(), "events", "node");
    if (fs.existsSync(nodeEventsPath)) {
      fs.readdirSync(nodeEventsPath).forEach((file) => {
        if (file.endsWith(".js")) {
          const event = require(path.join(nodeEventsPath, file));
          if (event.name && (typeof event.run === 'function' || typeof event.execute === 'function')) {
            const handler = event.run || event.execute;
            client.manager.on(event.name, (...args) => {
              handler(client, ...args);
            });
            client.log(`Loaded node event: ${event.name}`, "debug");
            count++;
          } else {
            client.log(`Skipping ${file}: not a valid event (missing name or run/execute function)`, "debug");
          }
        }
      });
    }

    return count;
  } catch (e) {
    client.log(`Error loading node events: ${e}`, "error");
    return 0;
  }
};