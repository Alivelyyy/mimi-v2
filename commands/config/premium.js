const voucher_codes = require("voucher-code-generator");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "premium",
  aliases: ['prem', 'premiumstatus'],
  cooldown: "",
  category: "config",
  usage: "",
  description: "Shows your premium status and benefits",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    let [ premiumUser, owner, admin ] = await Promise.all([
      await client.db.premium.get(`${client.user.id}_${message.author.id}`),
      await client.owners.find((x) => x === message.author.id),
      await client.admins.find((x) => x === message.author.id),
    ]);

    const cmd = args[0]?.toLowerCase();
    const duration = args[1] || "7";

    switch (cmd) {
      case "gen":
        if (!owner && !admin) {
          const adminContainer = new ContainerBuilder();
          adminContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.owner} **Only my Owner/s and Admin/s can use this command**`)
          );
          return message.reply({
            components: [adminContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        const code = voucher_codes.generate({
          pattern: `Mimi-#####-USER-DUR${duration}`
        })[0].toUpperCase();

        await client.db.vouchers.set(code, true);

        const genContainer = new ContainerBuilder();
        genContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Premium Code Generated`)
        );
        genContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        genContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.free} **Generated Code Details:**\n` +
            `${blackEmoji.point} Type: User Premium\n` +
            `${blackEmoji.point} Duration: ${duration} Days\n` +
            `${blackEmoji.point} Code: ||${code}||\n\n` +
            `${blackEmoji.bell} **Usage:** ${client.prefix}redeem <code>`
          )
        );

        return message.reply({
          components: [genContainer],
          flags: MessageFlags.IsComponentsV2,
        });

      case "status":
        const userStatus = premiumUser === true
          ? "Lifetime"
          : premiumUser
            ? `Expires <t:${Math.floor(premiumUser/1000)}:R>`
            : "Not Active";

        const statusContainer = new ContainerBuilder();
        statusContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Premium Status`)
        );
        statusContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        statusContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.user} **User Premium:** ${userStatus}\n\n` +
            `${blackEmoji.bell} Contact us in the support server to purchase premium`
          )
        );

        return message.reply({
          components: [statusContainer],
          flags: MessageFlags.IsComponentsV2,
        });

      default:
        const infoContainer = new ContainerBuilder();
        infoContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# Premium Benefits & Information`)
        );
        infoContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        infoContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.premium} **Premium Benefits:**\n` +
            `${blackEmoji.point} No prefix required for commands\n` +
            `${blackEmoji.point} Vote bypass for all commands\n` +
            `${blackEmoji.point} Priority support in server\n` +
            `${blackEmoji.point} Exclusive profile badge\n` +
            `${blackEmoji.point} Special role in support server\n` +
            `${blackEmoji.point} Ad-free music experience\n` +
            `${blackEmoji.point} Enhanced audio quality\n` +
            `${blackEmoji.point} Higher volume limit (500%)\n` +
            `${blackEmoji.point} 24/7 playback support\n\n` +
            `${blackEmoji.free} **How to get Premium:**\n` +
            `${blackEmoji.point} Contact bot owner in support server\n` +
            `${blackEmoji.point} Join our support community\n\n` +
            `${blackEmoji.bell} Use \`${client.prefix}premium status\` to check your status`
          )
        );
        infoContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        infoContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Premium system by ApeX`)
        );

        return message.reply({
          components: [infoContainer],
          flags: MessageFlags.IsComponentsV2,
        });
    }
  }
};
