
const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = async (
  message,
  command,
  ignoreWarnRateLimitManager,
  client = message.client,
) => {
  const ignoreWarnRlBucket = ignoreWarnRateLimitManager.acquire(
    `${message.author.id}_${command.name}`,
  );
  if (ignoreWarnRlBucket.limited) return;
  try {
    ignoreWarnRlBucket.consume();
  } catch (e) {}

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${client.emoji.warn} **Ignored Channel : You can't use me here**`
    )
  );

  return message
    .reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    })
    .then(async (m) =>
      setTimeout(async () => {
        await m.delete().catch(() => {});
      }, 5000),
    )
    .catch(() => {});
};
