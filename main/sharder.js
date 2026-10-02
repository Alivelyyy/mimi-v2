 const YML = require("js-yaml").load(
  require("fs").readFileSync("./config.yml", "utf8"),
);
const logger = require("@plugins/logger");

const { ClusterManager } = require("discord-hybrid-sharding");
[
  {
    file: "./clients/Mimi.js",
    token: YML.Mimi.TOKEN,
    shards: YML.Mimi.SHARDS,
    perCluster: YML.Mimi.PER_CLUSTER,
  },
].forEach((client) => {
  new ClusterManager(client.file, {
    restarts: {
      max: 5,
      interval: 1000,
    },
    respawn: true,
    mode: "worker",
    token: client.token,
    totalShards: client.shards || "auto",
    shardsPerClusters: parseInt(client.perCluster) || 2,
  })

    .on("shardCreate", (cluster) => {
      logger.log(
        `Launched cluster ${cluster.id}`,
        "cluster",
        "Sharder"
      );
    })
    .on("debug", (info) => {
      logger.log(`${info}`, "debug", "Sharder");
    })
    .spawn({ timeout: -1 });
});
