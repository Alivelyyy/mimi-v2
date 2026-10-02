
const { AttachmentBuilder, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, StringSelectMenuBuilder } = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = async (client, message, emoji, ignored, menu = false) => {
  await message.guild.channels.fetch();

  let channels = await message.guild.channels.cache.filter(
    (ch) =>
      ch.type == 0 &&
      ch !== message.guild.rulesChannel &&
      ch
        .permissionsFor(message.guild.members.me)
        .has(["ViewChannel", "SendMessages", "EmbedLinks"])
  );

  let options = channels.map((ch) => ({
    label: `${ignored.includes(ch.id) ? 'Remove' : 'Add'} ${ch.name.substring(0, 22)}`,
    emoji: ignored.includes(ch.id) ? blackEmoji.off : blackEmoji.on,
    value: `${ignored.includes(ch.id) ? `del` : `add`}_${ch.id}`,
    description: `Channel ID: ${ch.id}`
  }));

  const maxOptions = 25;
  const noOfMenus = Math.ceil(options.length / maxOptions);

  let menus = [];
  for (let i = 0; i < noOfMenus; i++) {
    const start = i * maxOptions;
    const end = Math.min((i + 1) * maxOptions, options.length);

    const menuOptions = options.slice(start, end);

    let selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`menu_${i}`)
      .setMinValues(1)
      .setMaxValues(menuOptions.length)
      .setPlaceholder("Select channel/(s) here . . . ")
      .addOptions(menuOptions);

    menus.push(new ActionRowBuilder().addComponents(selectMenu));
  }

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Ignored Channels`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  const ignoredText = ignored.length > 0
    ? ignored.map((id) => `${blackEmoji.point} <#${id}>`).join('\n')
    : 'No ignored channels';

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(ignoredText)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`*Developed By ApeXs*`)
  );

  if (menu && menus.length > 0) {
    for (const menuRow of menus) {
      container.addActionRowComponents(menuRow);
    }
  }

  return menu
    ? {
        container: container,
        text: ignoredText
      }
    : {
        container: container,
        text: ignoredText
      };
};
