const { readdirSync } = require("fs");

module.exports = async (client) => {
  let count = 0;
  const seen = new Map();
  readdirSync("./commands").forEach((dir) => {
    const commandFiles = readdirSync(`./commands/${dir}/`).filter((f) =>
      f.endsWith(".js"),
    );
    for (const file of commandFiles) {
      const command = require(`${process.cwd()}/commands/${dir}/${file}`);
      if (seen.has(command.name)) {
        client.logger?.warn?.(`Duplicate command name "${command.name}" in ${dir}/${file} (already loaded from ${seen.get(command.name)}). Skipping.`);
        continue;
      }
      seen.set(command.name, `${dir}/${file}`);
      client.commands.set(command.name, command);
      count++;
    }
  });
  return count;
};
