const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const CustomEmbed = require('@db/customEmbed.js');

const COLOR_MAP = {
  red: '#e74c3c', blue: '#3498db', green: '#2ecc71', yellow: '#f1c40f',
  purple: '#9b59b6', pink: '#e91e63', orange: '#e67e22', white: '#ffffff',
  black: '#000000', cyan: '#1abc9c', gold: '#f39c12', gray: '#95a5a6',
  lime: '#00ff00', navy: '#34495e', teal: '#008080', coral: '#ff7f50',
};

function resolveColor(input) {
  if (!input) return null;
  const lower = input.toLowerCase();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  if (/^#?[0-9a-f]{6}$/i.test(input)) return input.startsWith('#') ? input : `#${input}`;
  return null;
}

module.exports = {
  name: 'embed',
  aliases: ['em', 'custemembed'],
  cooldown: '3',
  category: 'embed',
  usage: '<create|delete|list|preview|edit all|title|description|color|footer|image|thumbnail|author|field|url>',
  description: 'Create and manage custom embeds to use in welcome, leave, joindm messages with {embed:name}',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Custom Embeds\n` +
        `Create embeds and use them anywhere with \`{embed:name}\`\n\n` +
        `### Management\n` +
        `> \`${p}embed create <name>\` — Create a new embed\n` +
        `> \`${p}embed delete <name>\` — Delete an embed\n` +
        `> \`${p}embed list\` — List all embeds\n` +
        `> \`${p}embed preview <name>\` — Preview an embed\n` +
        `> \`${p}embed edit all <name>\` — Open the interactive embed editor\n\n` +
        `### Edit Properties\n` +
        `> \`${p}embed title <name> <text>\` — Set title\n` +
        `> \`${p}embed description <name> <text>\` — Set description\n` +
        `> \`${p}embed color <name> <color>\` — Set color\n` +
        `> \`${p}embed footer <name> <text>\` — Set footer\n` +
        `> \`${p}embed footericon <name> <url>\` — Set footer icon\n` +
        `> \`${p}embed image <name> <url>\` — Set image\n` +
        `> \`${p}embed thumbnail <name> <url>\` — Set thumbnail\n` +
        `> \`${p}embed author <name> <text>\` — Set author\n` +
        `> \`${p}embed authoricon <name> <url>\` — Set author icon\n` +
        `> \`${p}embed url <name> <url>\` — Set title URL\n` +
        `> \`${p}embed field <name> <title> | <value> | [inline]\` — Add field\n` +
        `> \`${p}embed clearfields <name>\` — Remove all fields\n\n` +
        `### Usage\n` +
        `> Add \`{embed:name}\` in welcome, leave, joindm, or autoresponder messages.\n` +
        `> **Placeholders:** \`{user}\`, \`{username}\`, \`{server}\`, \`{count}\` work inside embeds too!`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'create') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed create <name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (name.length > 32 || !/^[a-z0-9_-]+$/.test(name)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Name must be 1-32 characters, only lowercase letters, numbers, hyphens, and underscores.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const count = await CustomEmbed.countDocuments({ guildId: message.guild.id });
      if (count >= 25) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This server has reached the maximum of **25** custom embeds.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      try {
        await CustomEmbed.create({ guildId: message.guild.id, name, createdBy: message.author.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Embed **${name}** created!\n` +
          `${blackEmoji.arrow} Use \`${p}embed title ${name} <text>\` to set a title\n` +
          `${blackEmoji.arrow} Use \`${p}embed description ${name} <text>\` to set description\n` +
          `${blackEmoji.info} Add \`{embed:${name}}\` in your messages to use it.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        if (err.code === 11000) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} An embed named **${name}** already exists.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        throw err;
      }
    }

    if (action === 'delete') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed delete <name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const result = await CustomEmbed.findOneAndDelete({ guildId: message.guild.id, name });
      if (!result) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Embed **${name}** deleted.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list') {
      const docs = await CustomEmbed.find({ guildId: message.guild.id }).sort({ name: 1 });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Custom Embeds — ${message.guild.name}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      if (docs.length === 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} No custom embeds yet.\nUse \`${p}embed create <name>\` to make one.`
        ));
      } else {
        const lines = docs.map((d, i) =>
          `**${i + 1}.** \`{embed:${d.name}}\` — ${d.title || d.description?.slice(0, 40)}`
        );
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Total:** ${docs.length}/25 embeds`));
      }
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'preview') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed preview <name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const doc = await CustomEmbed.findOne({ guildId: message.guild.id, name });
      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const embed = buildPreview(doc, message);
      if (!embed) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This embed is empty. Set a title or description first.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      return message.reply({ embeds: [embed] });
    }

    if (action === 'edit' && args[1]?.toLowerCase() === 'all') {
      const name = args[2]?.toLowerCase();
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed edit all <name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await CustomEmbed.findOne({ guildId: message.guild.id, name });
      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const summaryLines = [
        `**Title:** ${doc.title || 'None'}`,
        `**Description:** ${doc.description ? doc.description.slice(0, 120) : 'None'}`,
        `**Color:** ${doc.color || 'None'}`,
        `**URL:** ${doc.url || 'None'}`,
        `**Footer:** ${doc.footer || 'None'}`,
        `**Footer Icon:** ${doc.footerIcon || 'None'}`,
        `**Author:** ${doc.author || 'None'}`,
        `**Author Icon:** ${doc.authorIcon || 'None'}`,
        `**Author URL:** ${doc.authorUrl || 'None'}`,
        `**Image:** ${doc.image || 'None'}`,
        `**Thumbnail:** ${doc.thumbnail || 'None'}`,
        `**Fields:** ${doc.fields?.length || 0}`
      ];

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Edit Embed — ${name}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(summaryLines.join('\n')));

      const makeButton = (field, label) => new ButtonBuilder()
        .setCustomId(`embed_edit:${name}:${field}:${message.author.id}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(
        makeButton('title', 'Title'),
        makeButton('description', 'Description'),
        makeButton('color', 'Color'),
        makeButton('url', 'Title URL')
      );
      const row2 = new ActionRowBuilder().addComponents(
        makeButton('footer', 'Footer'),
        makeButton('footerIcon', 'Footer Icon'),
        makeButton('author', 'Author'),
        makeButton('authorIcon', 'Author Icon')
      );
      const row3 = new ActionRowBuilder().addComponents(
        makeButton('authorUrl', 'Author URL'),
        makeButton('image', 'Image'),
        makeButton('thumbnail', 'Thumbnail'),
        makeButton('fields', 'Add Field')
      );
      const row4 = new ActionRowBuilder().addComponents(
        makeButton('clearfields', 'Clear Fields')
      );

      return message.reply({
        components: [c, row1, row2, row3, row4],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const textProps = ['title', 'description', 'footer', 'author'];
    const urlProps = ['image', 'thumbnail', 'footericon', 'authoricon', 'authorurl', 'url'];
    const fieldMap = {
      title: 'title', description: 'description', footer: 'footer', author: 'author',
      image: 'image', thumbnail: 'thumbnail', footericon: 'footerIcon',
      authoricon: 'authorIcon', authorurl: 'authorUrl', url: 'url'
    };

    if (textProps.includes(action) || urlProps.includes(action)) {
      const name = args[1]?.toLowerCase();
      const value = args.slice(2).join(' ');
      if (!name || !value) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed ${action} <name> <value>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const dbField = fieldMap[action];

      const result = await CustomEmbed.findOneAndUpdate(
        { guildId: message.guild.id, name },
        { $set: { [dbField]: value, updatedAt: new Date() } },
        { new: true }
      );
      if (!result) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Updated **${action}** for embed **${name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'color') {
      const name = args[1]?.toLowerCase();
      const colorInput = args[2];
      if (!name || !colorInput) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}embed color <name> <color>\`\n` +
          `**Colors:** ${Object.keys(COLOR_MAP).map(cn => `\`${cn}\``).join(', ')} or hex \`#ff0000\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const color = resolveColor(colorInput);
      if (!color) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Invalid color. Use a name or hex code.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const result = await CustomEmbed.findOneAndUpdate(
        { guildId: message.guild.id, name },
        { $set: { color, updatedAt: new Date() } },
        { new: true }
      );
      if (!result) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Color set to \`${color}\` for embed **${name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'field') {
      const name = args[1]?.toLowerCase();
      const rest = args.slice(2).join(' ');
      const parts = rest.split('|').map(s => s.trim());
      if (!name || parts.length < 2) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed field <name> <title> | <value> | [inline: true/false]\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const fieldName = parts[0];
      const fieldValue = parts[1];
      const inline = parts[2]?.toLowerCase() === 'true';
      const result = await CustomEmbed.findOneAndUpdate(
        { guildId: message.guild.id, name },
        { $push: { fields: { name: fieldName, value: fieldValue, inline } }, $set: { updatedAt: new Date() } },
        { new: true }
      );
      if (!result) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Field added to embed **${name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'clearfields') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}embed clearfields <name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const result = await CustomEmbed.findOneAndUpdate(
        { guildId: message.guild.id, name },
        { $set: { fields: [], updatedAt: new Date() } },
        { new: true }
      );
      if (!result) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No embed named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} All fields cleared from embed **${name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}embed\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};

function buildPreview(doc, message) {
  const hasContent = doc.title || doc.description || doc.image || doc.thumbnail || doc.fields?.length;
  if (!hasContent) return null;

  const placeholders = {
    user: message.author.toString(),
    username: message.author.username,
    server: message.guild.name,
    count: message.guild.memberCount.toString()
  };

  const apply = (str) => {
    if (!str) return str;
    let result = str;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  };

  const embed = new EmbedBuilder();
  if (doc.title) embed.setTitle(apply(doc.title));
  if (doc.description) embed.setDescription(apply(doc.description));
  if (doc.color) { try { embed.setColor(doc.color); } catch (_) {} }
  if (doc.footer || doc.footerIcon) embed.setFooter({ text: apply(doc.footer), iconURL: doc.footerIcon || undefined });
  if (doc.image) embed.setImage(doc.image);
  if (doc.thumbnail) embed.setThumbnail(doc.thumbnail);
  if (doc.author || doc.authorIcon) embed.setAuthor({ name: apply(doc.author), iconURL: doc.authorIcon || undefined, url: doc.authorUrl || undefined });
  if (doc.url) embed.setURL(doc.url);
  if (doc.fields?.length) {
    for (const f of doc.fields) {
      embed.addFields({ name: apply(f.name), value: apply(f.value), inline: f.inline });
    }
  }
  return embed;
}
