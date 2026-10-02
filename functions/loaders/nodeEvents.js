const { readdirSync } = require("fs");
module.exports = async (client) => {
  let count = 0;
  readdirSync("./events/node").forEach((file) => {
    const event = require(`${process.cwd()}/events/node/${file}`);
    const handler = event.run || event.execute;
    if (handler && typeof handler === 'function') {
      client.manager.shoukaku.on(event.name, (...args) =>
        handler(client, ...args),
      );
      count++;
    }
  });
  return count;
};
