const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "backup",
  aliases: ['bkp', 'getbackup'],
  cooldown: "",
  category: "owner",
  usage: "",
  description: "sends backup zip to DM",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const moment = require("moment");
    const date = moment().format("DD-MM-YYYY_hh-mm-ss");

    const backup_zip_manager = async (msg) => {
      const file = `./backup-${args[0] ? `${args[0]}-` : ``}${date}.zip`;

      const { AttachmentBuilder } = require("discord.js");

      const loadingContainer = new ContainerBuilder();
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Creating Backup`)
      );
      loadingContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Preparing backup zip file...\n` +
          `${blackEmoji.arrow} Please wait`
        )
      );

      let m = await msg
        .reply({
          components: [loadingContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => {});

      await require("@functions/archiver.js")(file);

      await msg.author
        .send({
          files: [
            new AttachmentBuilder(file, {
              name: file,
            }),
          ],
        })
        .then(async () => {
          const successContainer = new ContainerBuilder();
          successContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Backup Complete`)
          );
          successContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          successContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Successfully sent backup to your DMs\n` +
              `${blackEmoji.arrow} **File:** \`${file}\``
            )
          );
          await m
            .edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch(() => {});
        })
        .catch(async (err) => {
          const errorContainer = new ContainerBuilder();
          errorContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Backup Failed`)
          );
          errorContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          errorContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Could not send zip to DM\n` +
              `${blackEmoji.arrow} **Error:** ${err.message}`
            )
          );
          await m
            .edit({
              components: [errorContainer],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch(() => {});
        });
      const fs = require("fs");
      await fs.unlink(file, () => {
        return;
      });
    };

    await backup_zip_manager(message);
  },
};
