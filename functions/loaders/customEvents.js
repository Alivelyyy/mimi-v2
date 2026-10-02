const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  let count = 0;
  
  try {
    const customEventsPath = path.join(process.cwd(), "events", "custom");
    
    if (!fs.existsSync(customEventsPath)) {
      return 0;
    }

    const files = fs.readdirSync(customEventsPath).filter(f => f.endsWith(".js"));
    
    for (const file of files) {
      try {
        const filePath = path.join(customEventsPath, file);
        delete require.cache[require.resolve(filePath)];
        const event = require(filePath);
        
        if (event.name && (typeof event.run === 'function' || typeof event.execute === 'function')) {
          const handler = event.run || event.execute;
          client.on(event.name, (...args) => {
            handler(client, ...args);
          });
          count++;
        }
      } catch (fileError) {
        client.log(`Error loading custom event ${file}: ${fileError.message}`, "error");
      }
    }

    client.playSharedPlaylist = require("@functions/playSharedPlaylist.js");
  } catch (e) {
    client.log(`Error loading custom events: ${e.message}`, "error");
  }
  
  return count;
};