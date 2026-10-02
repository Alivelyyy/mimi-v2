const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

module.exports = {
  name: "blUser",
  run: async (client, message, blacklistUser) => {
    let container = new client.embed().desc(
      `${client.emoji.no} **You are blacklisted and can't use my commands !**\n` +
        `${client.emoji.bell} *Note : This message wont be shown ever again !*`
    );

    let row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Click to join Support Server")
        .setURL(client.support)
        .setEmoji(client.emoji.helpline)
        .setStyle(ButtonStyle.Link)
    );

    if (blacklistUser != "warned") {
      await client.db.blacklist.set(
        `${client.user.id}_${message.author.id}`,
        "warned"
      );

      await message.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2,
      });

      await message.author
        .send({
          components: [container, row],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => {});

      await client.webhooks.static
        .send({
          username: client.user.username,
          avatarURL: client.user.displayAvatarURL(),
          components: [
            new client.embed()
              .desc(
                `**Blacklisted an user**\n` +
                  `**Moderator :** Anti-Abuse\n` +
                  `**Guild :** ${message.guild.name.substring(0, 10)}[[${
                    message.guild.id
                  }](https://discord.gg/XSUZQZn3yB)]\n` +
                  `**User :** ${message.author.tag}[[${message.author.id}](https://discord.gg/XSUZQZn3yB)]`
              ),
          ],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => {});
      return;
    }
  },
};
