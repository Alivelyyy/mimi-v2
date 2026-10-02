const { EmbedBuilder } = require('discord.js');
const CustomEmbed = require('@db/customEmbed.js');

async function parseEmbeds(text, guildId, placeholders = {}) {
  if (!text || !text.includes('{embed:')) return { text, embeds: [] };

  const regex = /\{embed:([a-zA-Z0-9_-]+)\}/g;
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return { text, embeds: [] };

  const embeds = [];
  let cleanText = text;

  for (const match of matches) {
    const embedName = match[1].toLowerCase();
    const doc = await CustomEmbed.findOne({ guildId, name: embedName });
    if (!doc) continue;

    cleanText = cleanText.replace(match[0], '');

    const embed = new EmbedBuilder();

    const applyPlaceholders = (str) => {
      if (!str) return str;
      let result = str;
      for (const [key, value] of Object.entries(placeholders)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      return result;
    };

    if (doc.title) embed.setTitle(applyPlaceholders(doc.title));
    if (doc.description) embed.setDescription(applyPlaceholders(doc.description));
    if (doc.color) {
      try { embed.setColor(doc.color); } catch (_) {}
    }
    if (doc.footer || doc.footerIcon) {
      embed.setFooter({
        text: applyPlaceholders(doc.footer),
        iconURL: doc.footerIcon || undefined
      });
    }
    if (doc.image) embed.setImage(doc.image);
    if (doc.thumbnail) embed.setThumbnail(doc.thumbnail);
    if (doc.author || doc.authorIcon) {
      embed.setAuthor({
        name: applyPlaceholders(doc.author),
        iconURL: doc.authorIcon || undefined,
        url: doc.authorUrl || undefined
      });
    }
    if (doc.url) embed.setURL(doc.url);
    if (doc.fields?.length) {
      for (const field of doc.fields) {
        embed.addFields({
          name: applyPlaceholders(field.name),
          value: applyPlaceholders(field.value),
          inline: field.inline
        });
      }
    }

    embeds.push(embed);
  }

  return { text: cleanText.trim(), embeds };
}

function hasEmbedTag(text) {
  return text && /\{embed:[a-zA-Z0-9_-]+\}/.test(text);
}

module.exports = { parseEmbeds, hasEmbedTag };
