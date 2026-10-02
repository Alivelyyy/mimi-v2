const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  staffRoleId: { type: String, default: null },
  categoryId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  transcriptChannelId: { type: String, default: null },
  ticketCount: { type: Number, default: 0 },
  maxTicketsPerUser: { type: Number, default: 1 },
  panelChannelId: { type: String, default: null },
  panelMessageId: { type: String, default: null },
  panelTitle: { type: String, default: 'Support Tickets' },
  panelDescription: { type: String, default: 'Click the button below to open a support ticket.\nOur team will assist you as soon as possible.' },
  panelButtonLabel: { type: String, default: 'Create Ticket' },
  panelButtonColor: { type: String, default: 'Primary' },
  panelButtonEmoji: { type: String, default: '🎫' },
  ticketNameFormat: { type: String, default: 'ticket-{number}' },
  categories: [{
    name: { type: String },
    emoji: { type: String, default: '🎫' },
    description: { type: String, default: '' },
    categoryId: { type: String, default: null },
    staffRoleId: { type: String, default: null }
  }],
  openTickets: [{
    channelId: { type: String },
    userId: { type: String },
    claimedBy: { type: String, default: null },
    ticketNumber: { type: Number },
    category: { type: String, default: 'general' },
    openedAt: { type: Date, default: Date.now },
    topic: { type: String, default: null }
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
