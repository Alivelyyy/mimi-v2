const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  try {
    client.log("Loading client events", "debug");
    let count = 0;

    const clientEventsPath = path.join(process.cwd(), "events", "client");
    if (fs.existsSync(clientEventsPath)) {
      fs.readdirSync(clientEventsPath).forEach((file) => {
        if (file.endsWith(".js")) {
          const event = require(path.join(clientEventsPath, file));
          if (event.name && (typeof event.run === 'function' || typeof event.execute === 'function')) {
            const handler = event.run || event.execute;
            client.on(event.name, (...args) => {
              handler(client, ...args);
            });
            client.log(`Loaded client event: ${event.name}`, "debug");
            count++;
          } else {
            client.log(`Skipping ${file}: not a valid event (missing name or run/execute function)`, "debug");
          }
        }
      });
    }

    return count;
  } catch (e) {
    client.log(`Error loading client events: ${e}`, "error");
    return 0;
  }
};