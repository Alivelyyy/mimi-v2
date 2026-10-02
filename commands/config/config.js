const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');
const Automod = require('@db/automod.js');
const Antibot = require('@db/antibot.js');
const Autorole = require('@db/autorole.js');
const Autoresponder = require('@db/autoresponder.js');
const Autoreact = require('@db/autoreact.js');

module.exports = {
  name: "config",
  aliases: ['cfg', 'settings'],
  cooldown: "3",
  category: "config",
  usage: "",
  description: "View all server configuration at a glance",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const on = blackEmoji.on;
    const off = blackEmoji.off;

    const [pfx, twoFourSeven, ignoredChannelsRaw, premiumArr, aioDoc, amDoc, abDoc, arDoc, arCount, reactCount] = await Promise.all([
      client.db.pfx.get(`${client.user.id}_${message.guild.id}`),
      client.db.twoFourSeven.get(`${client.user.id}_${message.guild.id}`),
      client.db.ignore.get(`${client.user.id}_${message.guild.id}`),
      require(`@functions/msgCrt/checkPremium.js`)(message),
      Automod.findOne({ guildId: message.guild.id }),
      Antibot.findOne({ guildId: message.guild.id }),
      Autorole.findOne({ guildId: message.guild.id }),
      Autoresponder.countDocuments({ guildId: message.guild.id, enabled: true }),
      Autoreact.countDocuments({ guildId: message.guild.id }),
    ]);

    const premiumUser = premiumArr[0];
    const ignoredChannels = Array.isArray(ignoredChannelsRaw) ? ignoredChannelsRaw : [];

    let amModules = 0;
    if (amDoc) {
      if (amDoc.antiLinks) amModules++;
      if (amDoc.antiInvites) amModules++;
      if (amDoc.antiSpam) amModules++;
      if (amDoc.antiMassMention) amModules++;
      if (amDoc.antiCaps) amModules++;
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.config || blackEmoji.cog} Server Configuration`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.info} General\n` +
        `> ${blackEmoji.prefix || blackEmoji.arrow} **Prefix:** \`${client.prefix}\`${pfx ? ` / \`${pfx}\`` : ``}\n` +
        `> ${blackEmoji.ignore || blackEmoji.arrow} **Ignored:** ${ignoredChannels.length > 0 ? `\`${ignoredChannels.length}\` channel(s)` : `\`None\``}\n` +
        `> ${blackEmoji.diamond} **Premium:** ${premiumUser ? `${on} Active` : `${off} Inactive`}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.cog} Systems\n` +
        `> ${blackEmoji.diamond} **AIO has been removed** — Use the individual system commands instead.\n` +
        `> ${amDoc?.enabled ? on : off} **AutoMod** — ${amDoc?.enabled ? `${amModules} module(s) active, \`${amDoc.punishment}\`` : 'Disabled'}\n` +
        `> ${abDoc?.enabled ? on : off} **Anti-Bot** — ${abDoc?.enabled ? `Action: \`${abDoc.action}\`, ${abDoc.whitelist?.length || 0} whitelisted` : 'Disabled'}\n` +
        `> ${arDoc?.enabled !== false && (arDoc?.humanRoles?.length || arDoc?.botRoles?.length) ? on : off} **Autorole** — ${arDoc?.humanRoles?.length || 0} human, ${arDoc?.botRoles?.length || 0} bot roles`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.message || blackEmoji.arrow} Automation\n` +
        `> ${arCount > 0 ? on : off} **Autoresponders:** ${arCount} active trigger(s)\n` +
        `> ${reactCount > 0 ? on : off} **Autoreacts:** ${reactCount} trigger(s)\n` +
        `> ${twoFourSeven ? on : off} **24/7 Mode** ${twoFourSeven ? `— <#${twoFourSeven.VoiceId}>` : ''}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.info} Use \`${client.prefix}help <category>\` for detailed commands`
      )
    );

    await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => {});
  },
};
