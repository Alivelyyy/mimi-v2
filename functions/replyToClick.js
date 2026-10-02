const { MessageFlags } = require("discord.js");

module.exports = replyToClick = async (int, args, ephemeral = true) => {
  try {
    if (args) {
      const flags = ephemeral
        ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        : MessageFlags.IsComponentsV2;
      await int.reply({
        components: [new int.client.embed().desc(`${args}`)],
        flags,
      });
    } else {
      await int.deferUpdate();
    }
  } catch (err) {
    try {
      if (!int.replied && !int.deferred) {
        await int.deferUpdate();
      }
    } catch (secondErr) {
      console.error('Error in replyToClick:', secondErr);
    }
  }
};
