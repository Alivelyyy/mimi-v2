module.exports = {
  name: "disconnect",
  run: async (client, name, players, moved) => {
    client.log(`Lavalink ${name}: Disconnected — will attempt to reconnect automatically`, "warn");
  },
};
