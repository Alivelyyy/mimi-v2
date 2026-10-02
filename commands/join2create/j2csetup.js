const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CSetting } = require('@db/join2create.js');

module.exports = {
  name: 'j2csetup',
  aliases: ['j2cs', 'setupvc'],
  cooldown: '',
  category: 'join2create',
  usage: '<#voice-channel> [categoryId]',
  description: 'Set up the Join-to-Create voice channel system',
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['ManageChannels'],
  userPerms: ['ManageGuild'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    if (!args[0]) {
      const existing = await J2CSetting.findOne({ guildId: message.guild.id });
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.mic} Join-to-Create System`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      if (existing) {
        const trigCh = message.guild.channels.cache.get(existing.triggerChannelId);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `### ${blackEmoji.cog} Current Settings\n` +
          `> ${blackEmoji.arrow} **Trigger Channel:** ${trigCh ? `<#${trigCh.id}>` : 'Deleted'}\n` +
          `> ${blackEmoji.arrow} **Category:** ${existing.categoryId ? `<#${existing.categoryId}>` : 'Same as trigger'}\n` +
          `> ${blackEmoji.arrow} **Default Name:** \`${existing.defaultName}\`\n` +
          `> ${blackEmoji.arrow} **Default Limit:** \`${existing.defaultLimit}\`\n` +
          `> ${blackEmoji.arrow} **Default Bitrate:** \`${Math.floor((existing.defaultBitrate || 64000) / 1000)}kbps\`\n` +
          `> ${blackEmoji.arrow} **Interface Panel:** ${existing.interfaceEnabled !== false ? `${blackEmoji.on} Enabled` : `${blackEmoji.off} Disabled`}\n\n` +
          `### ${blackEmoji.info} Setup Commands\n` +
          `> \`${client.prefix}j2csetup #voice-channel\` — Set trigger channel\n` +
          `> \`${client.prefix}j2csetup name {user}'s Room\` — Set default name\n` +
          `> \`${client.prefix}j2csetup limit <0-99>\` — Set default limit\n` +
          `> \`${client.prefix}j2csetup bitrate <8-384>\` — Set default bitrate\n` +
          `> \`${client.prefix}j2csetup interface <on/off>\` — Toggle control panel\n` +
          `> \`${client.prefix}j2csetup disable\` — Disable the system`
        ));
      } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} Join-to-Create is **not configured** for this server.\n\n` +
          `### ${blackEmoji.cog} Quick Setup\n` +
          `> \`${client.prefix}j2csetup #voice-channel\`\n\n` +
          `Create a voice channel (e.g. "Join to Create"), then run the command above. When members join that channel, a temporary voice channel will be created for them automatically.`
        ));
      }

      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### ${blackEmoji.list} Owner Commands\n` +
        `> \`${client.prefix}j2cname\` • \`${client.prefix}j2climit\` • \`${client.prefix}j2cbitrate\`\n` +
        `> \`${client.prefix}j2clock\` • \`${client.prefix}j2cunlock\` • \`${client.prefix}j2cghost\` • \`${client.prefix}j2cunghost\`\n` +
        `> \`${client.prefix}j2cpermit\` • \`${client.prefix}j2cdeny\` • \`${client.prefix}j2cban\` • \`${client.prefix}j2cunban\`\n` +
        `> \`${client.prefix}j2ckick\` • \`${client.prefix}j2cclaim\` • \`${client.prefix}j2ctransfer\`\n` +
        `> \`${client.prefix}j2cinfo\` • \`${client.prefix}j2creset\` • \`${client.prefix}j2cregion\` • \`${client.prefix}j2cstatus\``
      ));

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const sub = args[0].toLowerCase();

    if (sub === 'disable') {
      await J2CSetting.deleteOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Join-to-Create system has been **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (['name', 'limit', 'bitrate', 'interface'].includes(sub)) {
      const existing = await J2CSetting.findOne({ guildId: message.guild.id });
      if (!existing) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} J2C is not set up yet. Run \`${client.prefix}j2csetup #voice-channel\` first.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (sub === 'name') {
      const name = args.slice(1).join(' ');
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Provide a name template.\n` +
          `**Variables:** \`{user}\` \`{username}\` \`{tag}\` \`{count}\`\n` +
          `**Example:** \`${client.prefix}j2csetup name {user}'s Room\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await J2CSetting.updateOne({ guildId: message.guild.id }, { defaultName: name });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Default channel name set to **${name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === 'limit') {
      const limit = parseInt(args[1]);
      if (isNaN(limit) || limit < 0 || limit > 99) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Provide a number between **0** and **99**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await J2CSetting.updateOne({ guildId: message.guild.id }, { defaultLimit: limit });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Default user limit set to **${limit === 0 ? 'Unlimited' : limit}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === 'bitrate') {
      const bitrate = parseInt(args[1]);
      const maxKbps = Math.floor(message.guild.maximumBitrate / 1000);
      if (isNaN(bitrate) || bitrate < 8 || bitrate > maxKbps) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Provide a bitrate between **8** and **${maxKbps}** kbps.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await J2CSetting.updateOne({ guildId: message.guild.id }, { defaultBitrate: bitrate * 1000 });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Default bitrate set to **${bitrate}kbps**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === 'interface') {
      const toggle = args[1]?.toLowerCase();
      if (!['on', 'off', 'enable', 'disable'].includes(toggle)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Use \`${client.prefix}j2csetup interface on\` or \`${client.prefix}j2csetup interface off\`.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const enabled = ['on', 'enable'].includes(toggle);
      await J2CSetting.updateOne({ guildId: message.guild.id }, { interfaceEnabled: enabled });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Interface panel **${enabled ? 'enabled' : 'disabled'}**. ${enabled ? 'New temp channels will show the control panel.' : 'Control panel will not appear in new channels.'}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const triggerChannel = message.mentions.channels.first()
      || message.guild.channels.cache.get(args[0]);

    if (!triggerChannel || triggerChannel.type !== ChannelType.GuildVoice) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Please mention or provide the ID of a **voice channel** to use as the trigger.\n` +
        `Usage: \`${client.prefix}j2csetup #voice-channel\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const categoryId = args[1] || triggerChannel.parentId || null;

    try {
      const existing = await J2CSetting.findOne({ guildId: message.guild.id });

      await J2CSetting.findOneAndUpdate(
        { guildId: message.guild.id },
        {
          guildId: message.guild.id,
          triggerChannelId: triggerChannel.id,
          categoryId,
          createdAt: existing ? existing.createdAt : new Date()
        },
        { upsert: true, new: true }
      );

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Join-to-Create Setup`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Trigger Channel:** ${triggerChannel}\n` +
        `${blackEmoji.list} **Category:** ${categoryId ? `<#${categoryId}>` : 'Same as trigger'}\n\n` +
        `${blackEmoji.arrow} When a member joins **${triggerChannel.name}**, a temporary voice channel will be created for them.\n` +
        `${blackEmoji.arrow} An interactive **control panel** with buttons will appear in the channel.\n` +
        `${blackEmoji.info} Run \`${client.prefix}j2csetup\` to see all configuration options.`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set up J2C: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
