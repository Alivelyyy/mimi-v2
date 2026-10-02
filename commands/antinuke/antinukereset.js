const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antinuke = require('@db/antinuke.js');

module.exports = {
  name: 'antinukereset',
  aliases: ['anreset', 'nukeresetall'],
  cooldown: '10',
  category: 'antinuke',
  usage: '',
  description: 'Reset all anti-nuke settings to defaults',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['Administrator'], userPerms: ['Administrator'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    if (message.guild.ownerId !== message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can reset anti-nuke.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const confirm = new ContainerBuilder();
    confirm.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.warn} Reset Anti-Nuke\n` +
      `This will **delete** all anti-nuke settings, whitelist, and module configs.\n` +
      `${blackEmoji.info} Are you sure?`
    ));
    confirm.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('anreset_yes').setLabel('Reset Everything').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('anreset_no').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      )
    );

    const m = await message.reply({ components: [confirm], flags: MessageFlags.IsComponentsV2 });

    let interaction;
    try {
      interaction = await m.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        time: 15000,
        componentType: ComponentType.Button,
      });
    } catch {
      const tc = new ContainerBuilder();
      tc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset timed out.`));
      return m.edit({ components: [tc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    if (interaction.customId === 'anreset_no') {
      const cc = new ContainerBuilder();
      cc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset cancelled.`));
      return interaction.update({ components: [cc], flags: MessageFlags.IsComponentsV2 });
    }

    await Antinuke.deleteOne({ guildId: message.guild.id });

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.yes} All anti-nuke settings have been **reset** to defaults.\n` +
      `${blackEmoji.info} Run \`${client.prefix}antinuke setup\` to reconfigure.`
    ));
    return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
