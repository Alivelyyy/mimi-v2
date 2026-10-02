const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  try {
    client.log("Loading player events", "debug");
    let count = 0;

    const playerEventsPath = path.join(process.cwd(), "events", "player");
    if (fs.existsSync(playerEventsPath)) {
      fs.readdirSync(playerEventsPath).forEach((file) => {
        if (file.endsWith(".js")) {
          const event = require(path.join(playerEventsPath, file));
          if (event.name && (typeof event.run === 'function' || typeof event.execute === 'function')) {
            const handler = event.run || event.execute;
            client.manager.on(event.name, (...args) => {
              handler(client, ...args);
            });
            client.log(`Loaded player event: ${event.name}`, "debug");
            count++;
          } else {
            client.log(`Skipping ${file}: not a valid event (missing name or run/execute function)`, "debug");
          }
        }
      });
    }

    return count;
  } catch (e) {
    client.log(`Error loading player events: ${e}`, "error");
    return 0;
  }
};