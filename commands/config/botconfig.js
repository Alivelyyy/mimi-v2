const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const { setBotAvatar, setBotBanner, setBotBio, setBotNickname, resetBotProfile } = require("@functions/botProfile.js");

const SUBCOMMANDS = ["avatar", "banner", "bio", "nickname", "reset"];

module.exports = {
  name: "botconfig",
  aliases: ['bcfg', 'bconfig'],
  cooldown: "5",
  category: "config",
  usage: "<avatar|banner|bio|nickname|reset> [value]",
  description: "Configure the bot's guild-specific profile",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false, 
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const isOwner = client.owners.includes(message.author.id);
    const isAdmin = client.admins?.includes(message.author.id);
    const hasServerAdmin = message.member.permissions.has('Administrator');

    if (!isOwner && !isAdmin && !hasServerAdmin) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.warn} You need \`Administrator\` permission or bot owner/admin access to use this command.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }

    const sub = args[0]?.toLowerCase();

    // ── No subcommand — show usage ────────────────────────────────────────────
    if (!sub || !SUBCOMMANDS.includes(sub)) {
      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Bot Config`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.info} Configure the bot's profile for this server\n` +
          `> ${blackEmoji.arrow} \`${client.prefix}botconfig avatar <url>\` — Set guild avatar\n` +
          `> ${blackEmoji.arrow} \`${client.prefix}botconfig banner <url>\` — Set guild banner\n` +
          `> ${blackEmoji.arrow} \`${client.prefix}botconfig bio <text>\` — Set guild bio\n` +
          `> ${blackEmoji.arrow} \`${client.prefix}botconfig nickname <text>\` — Set guild nickname\n` +
          `> ${blackEmoji.arrow} \`${client.prefix}botconfig reset\` — Reset all to default`
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.warn} Changes apply to **this server only**`
        )
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }

    const guildId = message.guild.id;
    const token = client.token;
    const value = args.slice(1).join(" ").trim();

    // ── reset ─────────────────────────────────────────────────────────────────
    if (sub === "reset") {
      const loadingContainer = buildSimple(
        `${blackEmoji.loading} Resetting bot profile for this server…`
      );
      const m = await message.reply({
        components: [loadingContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      try {
        await resetBotProfile(token, guildId);
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Bot Config — Reset`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.success} **Profile reset successfully**\n` +
            `${blackEmoji.info} Avatar, banner, bio and nickname have been cleared for this server.`
          )
        );
        await m?.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch (err) {
        await m?.edit({
          components: [buildError("Failed to reset profile", err)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }
      return;
    }

    // ── subcommands that require a value ──────────────────────────────────────
    if (!value) {
      const hints = {
        avatar:   `\`${client.prefix}botconfig avatar <image url>\``,
        banner:   `\`${client.prefix}botconfig banner <image url>\``,
        bio:      `\`${client.prefix}botconfig bio <text>\``,
        nickname: `\`${client.prefix}botconfig nickname <text>\``,
      };
      return message.reply({
        components: [buildSimple(
          `${blackEmoji.warn} Please provide a value.\n${blackEmoji.arrow} Usage: ${hints[sub]}`
        )],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }

    // ── avatar ────────────────────────────────────────────────────────────────
    if (sub === "avatar") {
      if (!isValidUrl(value)) {
        return message.reply({
          components: [buildSimple(`${blackEmoji.cross} That doesn't look like a valid URL.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

      const m = await message.reply({
        components: [buildSimple(`${blackEmoji.loading} Setting guild avatar…`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      try {
        await setBotAvatar(token, guildId, value);
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Bot Config — Avatar`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.success} **Guild avatar updated**\n` +
            `${blackEmoji.link} [Image URL](${value})`
          )
        );
        await m?.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch (err) {
        await m?.edit({
          components: [buildError("Failed to set avatar", err)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }
      return;
    }

    // ── banner ────────────────────────────────────────────────────────────────
    if (sub === "banner") {
      if (!isValidUrl(value)) {
        return message.reply({
          components: [buildSimple(`${blackEmoji.cross} That doesn't look like a valid URL.`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

      const m = await message.reply({
        components: [buildSimple(`${blackEmoji.loading} Setting guild banner…`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      try {
        await setBotBanner(token, guildId, value);
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Bot Config — Banner`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.success} **Guild banner updated**\n` +
            `${blackEmoji.link} [Image URL](${value})`
          )
        );
        await m?.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch (err) {
        await m?.edit({
          components: [buildError("Failed to set banner", err)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }
      return;
    }

    // ── bio ───────────────────────────────────────────────────────────────────
    if (sub === "bio") {
      if (value.length > 190) {
        return message.reply({
          components: [buildSimple(`${blackEmoji.cross} Bio must be 190 characters or fewer. (Provided: \`${value.length}\`)`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

      const m = await message.reply({
        components: [buildSimple(`${blackEmoji.loading} Setting guild bio…`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      try {
        await setBotBio(token, guildId, value);
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Bot Config — Bio`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.success} **Guild bio updated**\n` +
            `${blackEmoji.info} New bio:\n> ${value}`
          )
        );
        await m?.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch (err) {
        await m?.edit({
          components: [buildError("Failed to set bio", err)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }
      return;
    }

    // ── nickname ──────────────────────────────────────────────────────────────
    if (sub === "nickname") {
      if (value.length > 32) {
        return message.reply({
          components: [buildSimple(`${blackEmoji.cross} Nickname must be 32 characters or fewer. (Provided: \`${value.length}\`)`)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

      const m = await message.reply({
        components: [buildSimple(`${blackEmoji.loading} Setting guild nickname…`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);

      try {
        await setBotNickname(token, guildId, value);
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Bot Config — Nickname`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.success} **Guild nickname updated**\n` +
            `${blackEmoji.info} New nickname: \`${value}\``
          )
        );
        await m?.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch (err) {
        await m?.edit({
          components: [buildError("Failed to set nickname", err)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }
      return;
    }
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSimple(text) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
  return c;
}

function buildError(label, err) {
  const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${blackEmoji.cross} ${label}`)
  );
  c.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${blackEmoji.danger} **Error:** \`${err?.message || "Unknown error"}\`\n` +
      `${blackEmoji.info} Make sure the URL is publicly accessible and the image is a valid PNG/JPG.`
    )
  );
  return c;
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}