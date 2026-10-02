const axios = require("axios");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = async (client, message, user) => {

  let [premiumUser] = await require("@functions/msgCrt/checkPremium.js")(message);
  if (premiumUser) return true;

  try {
    const topggKey = client.topGgKey;

    if (topggKey) {
      const res = await axios.get(
        `https://top.gg/api/bots/${client.user.id}/check?userId=${user.id}`,
        {
          headers: {
            Authorization: topggKey,
          },
        }
      );

      if (res.status === 200 && res.data?.voted === 1) {
        return true;
      }
    }
  } catch (err) {
    console.log("Top.gg Error:", err.message);
  }

  const voteUrl =
    client.vote || `https://top.gg/bot/${client.user.id}/vote`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Vote on Top.gg")
      .setStyle(ButtonStyle.Link)
      .setURL(voteUrl)
      .setEmoji(blackEmoji.vote)
  );

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Vote Required`)
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${blackEmoji.diamond} **You need to vote to use this command!**\n\n` +
      `${blackEmoji.arrow} Click the button below to vote and unlock this feature.\n` +
      `${blackEmoji.arrow} Voting helps us grow and is greatly appreciated!`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );
  container.addActionRowComponents(row);

  const msg = await message.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => null);

  if (msg) {
    setTimeout(() => {
      msg.delete().catch(() => null);
    }, 15000);
  }

  return false;
};
