const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  try {
    client.log("Loading commands", "debug");
    let count = 0;

    const loadCommands = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          loadCommands(filePath);
        } else if (file.endsWith(".js")) {
          try {
            const command = require(filePath);
            if (command.name) {
              client.commands.set(command.name, command);
              if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => {
                  client.aliases.set(alias, command.name);
                });
              }
              client.log(`Loaded command: ${command.name}`, "debug");
              count++;
            }
          } catch (e) {
            client.log(`Error loading command ${file}: ${e}`, "error");
          }
        }
      }
    };

    const commandsPath = path.join(process.cwd(), "commands");
    if (fs.existsSync(commandsPath)) {
      loadCommands(commandsPath);
    }

    return count;
  } catch (e) {
    client.log(`Error loading commands: ${e}`, "error");
    return 0;
  }
};