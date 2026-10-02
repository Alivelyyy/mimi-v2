const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "poll",
  aliases: ['vote2', 'survey'],
  category: "utility",
  description: "Create a poll with reactions",
  usage: "<question> or <question | option1 | option2 ...>",
  args: true,
  vote: false, new: false, admin: false, owner: false,
  userPerms: [],
  botPerms: ["SendMessages", "AddReactions"],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,

  execute: async (client, message, args) => {
    const question = args.join(' ');
    const options = question.split('|').map(opt => opt.trim()).filter(Boolean);

    if (options.length > 1 && options.length <= 11) {
      const numberEmojis = [blackEmoji.num1, blackEmoji.num2, blackEmoji.num3, blackEmoji.num4, blackEmoji.num5, blackEmoji.num6, blackEmoji.num7, blackEmoji.num8, blackEmoji.num9, blackEmoji.num10];
      const pollQuestion = options[0];
      const pollOptions = options.slice(1);

      if (pollOptions.length < 2) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Provide at least **2** options.\n${blackEmoji.arrow} **Format:** \`poll Question | Option 1 | Option 2\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.poll} ${pollQuestion}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        pollOptions.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n')
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `*${blackEmoji.user} Poll by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:f>*`
      ));

      const pollMsg = await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      for (let i = 0; i < pollOptions.length; i++) {
        await pollMsg.react(numberEmojis[i]).catch(() => {});
      }
    } else {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.poll} Poll`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(question));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `*${blackEmoji.user} Poll by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:f>*`
      ));

      const pollMsg = await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      await pollMsg.react(blackEmoji.thumbsup).catch(() => {});
      await pollMsg.react(blackEmoji.thumbsdown).catch(() => {});
    }

    if (message.deletable) message.delete().catch(() => {});
  }
};