module.exports = (client) => {
  const logger = require("@plugins/logger.js");
  client.log(`Loaded Anti-Crash Error Handler (UR, UE)`, "ready");

  process.on("unhandledRejection", (reason, promise) => {
    logger.log(`unhandledRejection ${reason}`, "warn", "Process");
  });
  process.on("uncaughtException", (...args) => {
    client.log(`uncaughtException ${args}`, "warn");
    console.log(...args);
  });
};