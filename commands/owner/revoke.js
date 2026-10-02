const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "revoke",
  aliases: ['rp', 'revokepremium'],
  cooldown: "",
  category: "owner",
  usage: "<mention> <bl/premium>",
  description: "Remove status from a user",
  args: false,
  vote: false,
  new: false,
  admin: true,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const id = message.mentions.users.first()?.id || args[0] || null;
    if (message.mentions?.users?.first()?.id && !args[1]) args[1] = args[0];
    const validUser = await client.users.fetch(id).catch(() => null);

    if (!validUser) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid User`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Please provide a valid user\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}revoke @user <bl/premium>\``
        )
      );
      return await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const [bl, premium] = await Promise.all([
      client.db.blacklist.get(`${client.user.id}_${id}`),
      client.db.premium.get(`${client.user.id}_${id}`),
    ]);

    let statusType = args[1] || null;
    const statusMap = { bl: "blacklist", premium: "premium" };
    const statusValues = { bl, premium };
    let db = statusMap[statusType] || null;

    switch (statusType) {
      case "bl":
      case "premium":
        if (!statusValues[statusType]) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Status Not Found`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} ${validUser.tag} doesn't have the \`${statusType}\` status`
            )
          );
          return await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        await client.db[db].delete(`${client.user.id}_${id}`);
        const successContainer = new ContainerBuilder();
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Status Revoked`)
        );
        successContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.user} **User:** ${validUser.tag}\n` +
            `${blackEmoji.arrow} **Status:** \`${statusType}\` removed\n` +
            `${blackEmoji.info} **ID:** \`${validUser.id}\``
          )
        );
        await message.reply({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2,
        });
        await client.webhooks.static
          ?.send({
            username: client.user.username,
            avatarURL: client.user.displayAvatarURL(),
            components: [
              new client.embed()
                .desc(
                  `**Revoked the status :** ${statusType}\n` +
                    `**Moderator :** ${message.author}\n` +
                    `**User :** ${validUser.tag}[[${id}](https://discord.gg/XSUZQZn3yB)]`
                ),
            ],
            flags: MessageFlags.IsComponentsV2,
          })
          .catch(() => {});
        break;

      default:
        const errorContainer = new ContainerBuilder();
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Status`)
        );
        errorContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} \`bl\` - Remove blacklist status\n` +
            `${blackEmoji.arrow} \`premium\` - Remove premium status\n\n` +
            `${blackEmoji.info} **Usage:** \`${client.prefix}revoke @user <bl/premium>\``
          )
        );
        message.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
        break;
    }
  },
};
