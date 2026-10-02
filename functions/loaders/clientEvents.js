const { readdirSync } = require("fs");
module.exports = async (client) => {
  let count = 0;
  readdirSync("./events/client").forEach((file) => {
    const event = require(`${process.cwd()}/events/client/${file}`);
    const handler = event.run || event.execute;
    if (handler && typeof handler === 'function') {
      client.on(event.name, (...args) => {
        handler(client, ...args);
      });
      count++;
    }
  });
  return count;
};
