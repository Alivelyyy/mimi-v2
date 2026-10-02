const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "mention",
  run: async (client, message, args, emoji) => {
    client.log("Mention event handler triggered", "debug");
    try {
      if (!message.mentions.has(client.user.id)) return;

      const hasPerms = await require('@functions/msgCrt/checkPerms.js')(
        message,
        {
          name: "mention",
          userPerms: [],
          botPerms: ["SendMessages", "EmbedLinks"],
        },
        client
      );

      if (!hasPerms) return;

      let prefix = client.prefix;
      try {
        const guildPrefix = await client.db.pfx.get(`${client.user.id}_${message.guild.id}`);
        const userPrefix = await client.db.pfx.get(`${client.user.id}_${message.author.id}`);
        prefix = userPrefix || guildPrefix || client.prefix;
      } catch (error) {
        console.error("Error fetching prefix:", error);
      }

      const totalMembers = message.guild.members.cache.size;
      const botCount = message.guild.members.cache.filter(m => m.user.bot).size;
      const humanCount = totalMembers - botCount;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Invite")
          .setEmoji(blackEmoji.link)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`),

        new ButtonBuilder()
          .setLabel("Support")
          .setEmoji(blackEmoji.team)
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/eTneECMw4D"),

        new ButtonBuilder()
          .setLabel("Vote")
          .setEmoji(blackEmoji.diamond)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://top.gg/bot/${client.user.id}/vote`)
      );

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} Information`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.music} ${message.guild.name}\n` +
          `${blackEmoji.point} Server Prefix: \`${prefix}\`\n` +
          `${blackEmoji.message} Total Members: \`${totalMembers}\`\n` +
          `${blackEmoji.user} Humans: \`${humanCount}\`\n` +
          `${blackEmoji.cog} Bots: \`${botCount}\``
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### Quick Start Guide\n` +
          `${blackEmoji.music} Join a voice channel and use \`${prefix}play\` to start playing music\n` +
          `${blackEmoji.config} Use \`${prefix}help\` to see all available commands\n` +
          `${blackEmoji.filter} Access filters with \`${prefix}filter\` command\n` +
          `${blackEmoji.diamond} Get premium features with \`${prefix}premium\``
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL("https://cdn.discordapp.com/banners/1443226574152274123/0bdff10a0659272edb6feb2b25235dbd.webp?size=1024")
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Developed with ${blackEmoji.heart} by ApeX Devs*`)
      );

      container.addActionRowComponents(row);

      await message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(error => {
        console.error("Error sending mention embed:", error);
        message.channel.send(`Hi! My prefix is \`${prefix}\`. Use \`${prefix}help\` to get started!`).catch(() => {});
      });

    } catch (error) {
      console.error("Mention Event Error:", error);
      
      try {
        await message.channel.send(`Hi! My prefix is \`${client.prefix}\`. Use \`${client.prefix}help\` to get started!`);
      } catch (sendError) {
        console.error("Failed to send fallback message:", sendError);
      }
    }
  }
};
