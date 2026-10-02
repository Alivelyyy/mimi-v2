const { AuditLogEvent } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');

module.exports = {
  name: 'webhooksUpdate',
  run: async (client, channel) => {
    try {
      const guild = channel.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.WebhookCreate, 'antiwebhook', 'Anti-Webhook — Webhook created', null);
    } catch (_) {}

    try {
      const guild = channel.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.WebhookDelete, 'antiwebhook', 'Anti-Webhook — Webhook deleted', null);
    } catch (_) {}

    try {
      const guild = channel.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.WebhookUpdate, 'antiwebhook', 'Anti-Webhook — Webhook updated', null);
    } catch (_) {}
  },
};
