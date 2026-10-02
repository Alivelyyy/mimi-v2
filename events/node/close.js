module.exports = {
  name: "close",
  run: async (client, name, code, reason) => {
    client.log(
      `Lavalink ${name}: Closed, Code ${code}, Reason ${reason || "No reason"}`,
      "error",
    );
  },
};
