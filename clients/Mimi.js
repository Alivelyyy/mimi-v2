const YML = require("js-yaml").load(
  require("fs").readFileSync("./config.yml", "utf8"),
);
const bot = require("../main/extendedClient");

const client = new bot();
require("@utils/antiCrash")(client);
client.connect(
  YML.Mimi.TOKEN,
  YML.Mimi.PREFIX,
  YML.Mimi.EMOJIS,
);
module.exports = client;
