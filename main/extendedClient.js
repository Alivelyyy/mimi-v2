const Jishaku = require("dokdo");
require("module-alias/register");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const { Collection, Partials, Client, WebhookClient } = require("discord.js");

module.exports = class ExtendedClient extends Client {
  constructor() {
    super({
      intents: 3276799,

      failIfNotExists: false,
      restRequestTimeout: 60000,

      rest: {
        timeout: 60000,
      },

      sweepers: {
        messages: {
          interval: 1800,
          lifetime: 1800,
        },
      },

      allowedMentions: {
        repliedUser: false,
        parse: [],
      },

      partials: [
        Partials.User,
        Partials.Guilds,
        Partials.Channel,
        Partials.Message,
        Partials.GuildMember,
        Partials.Reaction,
      ],

      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
    });

    this.setMaxListeners(25);

    this.manager;

    this.cluster = new ClusterClient(this);

    this.aliases = new Collection();
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.snipes = new Collection();

    this.config = require("../config/options");

    this.owners = this.config.bot.owners;
    this.admins = this.config.bot.admins;
    this.webhooks = this.config.webhooks;
    this.support = this.config.links.support;

    this.button = require("@plugins/button.js");
    this.logger = require("@plugins/logger.js");

    this.db = {
      pfx: require("@db/prefix.js"),
      ignore: require("@db/ignore.js"),
      premium: require("@db/premium.js"),
      vouchers: require("@db/vouchers.js"),
      blacklist: require("@db/blacklist.js"),
      twoFourSeven: require("@db/twoFourSeven.js"),
      badges: require("@db/badges.js"),
      np: require("@db/noprefix.js"),
      spotify: require("@db/spotify.js"),
      aio: require("@db/aio.js")
    };
    this.formatTime = require("@formatters/formatTime.js");
    this.formatBytes = require("@formatters/formatBytes.js");

    this.categories = require("fs").readdirSync("./commands");

    // Handle clientReady event for Discord.js v14+
    this.once("clientReady", async (client) => {
      this.vote = `https://top.gg/bot/${this.user.id}/vote`;
      await require("@functions/handleReadyEvent.js")(this);
    });

    this.webhooks = {
      error: new WebhookClient({ url: this.webhooks.error }),
      static: new WebhookClient({ url: this.webhooks.static }),
      server: new WebhookClient({ url: this.webhooks.server }),
      player: new WebhookClient({ url: this.webhooks.player }),
      command: new WebhookClient({ url: this.webhooks.command }),
    };
  }

  sleep = (t) => {
    return new Promise((r) => setTimeout(r, t));
  };

  getPlayer = async (id) => {
    let player = await this.manager.getPlayer(id);
    return player ? player : null;
  };

  log = (message, type = "log") => {
    return this.logger.log(message, type, this.user?.username || undefined);
  };

  connect = async (token, prefix = "%", emoji, color) => {
    this.prefix = prefix;
    this.jsk = new Jishaku.Client(this, {
      aliases: ["jsk"],
      prefix: this.prefix,
      owners: this.owners,
    });
    this.emojiSet = emoji;
    this.color = color || "#2f3136";
    await require("@plugins/player")(this);
    const rawEmoji = require("@assets/emoji.js")[this.emojiSet] || {};
    this.emoji = require("@utils/emojiSafe.js").createSafeEmojiObject(rawEmoji);
    this.embed = require("@plugins/embed.js")(this.color);

    try {
      const mongoose = require('mongoose');
      const yaml = require('js-yaml');
      const fs = require('fs');

      const configFile = fs.readFileSync('./config.yml', 'utf8');
      const config = yaml.load(configFile);
      
      this.topGgKey = config.BOT?.TOPGG_KEY;
      
      if (mongoose.connection.readyState === 0) {
        const mongoUri = config.DATABASE?.MONGODB_URI;

        if (mongoUri) {
          await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
          });

          this.log('MongoDB connected successfully', 'ready');
        } else {
          this.log('MongoDB URI not found in config.yml', 'warn');
        }
      }
    } catch (error) {
      this.log(`MongoDB connection failed: ${error.message}`, 'warn');
      this.log('Some features requiring database may not work properly', 'warn');
    }
    await super
      .login(token)
      .then((token) => {
        this.log(`Client logged in !!!`, `ready`);
      })
      .catch((error) => {
        this.log(`Client cannot be logged in !!! ${error}`, `warn`);
      });
  };
};