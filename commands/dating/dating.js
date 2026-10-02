const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Dating = require('@db/dating.js');

module.exports = {
  name: 'dating',
  aliases: ['date', 'datingprofile'],
  cooldown: '3',
  category: 'dating',
  usage: '<subcommand>',
  description: 'Dating system — create profiles, find matches, and connect',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.heart} Dating System\n` +
        (doc ? `${blackEmoji.arrow} Profile: **Active** | Matched: ${doc.matchedWith ? `<@${doc.matchedWith}>` : 'Nobody'}\n\n` : `${blackEmoji.arrow} You don't have a profile yet.\n\n`) +
        `### Profile\n` +
        `> \`${p}dating createprofile\` — Create your profile\n` +
        `> \`${p}dating deleteprofile\` — Delete your profile\n` +
        `> \`${p}dating profile [@user]\` — View a profile\n` +
        `> \`${p}dating toggle\` — Activate/deactivate\n\n` +
        `### Edit Profile\n` +
        `> \`${p}dating setname <name>\`\n` +
        `> \`${p}dating editbio <bio>\`\n` +
        `> \`${p}dating setgender <male/female/other>\`\n` +
        `> \`${p}dating looking <male/female/other/any>\`\n` +
        `> \`${p}dating setage <age>\`\n` +
        `> \`${p}dating interest add/remove/clear <interest>\`\n` +
        `> \`${p}dating uploadpic\` — Attach an image\n` +
        `> \`${p}dating removepic\`\n\n` +
        `### Matching\n` +
        `> \`${p}dating find\` — Find a match\n` +
        `> \`${p}dating like @user\` — Like someone\n` +
        `> \`${p}dating unlike @user\` — Remove a like\n` +
        `> \`${p}dating unmatch\` — Break your match\n` +
        `> \`${p}dating matches\` — View your match\n` +
        `> \`${p}dating likes\` — See who you liked\n` +
        `> \`${p}dating likedby\` — See who liked you\n` +
        `> \`${p}dating gift @user\` — Send a virtual gift\n` +
        `> \`${p}dating leaderboard\` — Most popular profiles\n` +
        `> \`${p}dating stats\` — Server stats`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'createprofile') {
      const existing = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (existing) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You already have a dating profile. Use \`${p}dating editbio\` to edit it.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Dating.create({ userId: message.author.id, guildId: message.guild.id, name: message.author.username });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Dating profile **created**!\n\n` +
        `${blackEmoji.arrow} \`${p}dating editbio <bio>\` — Set your bio\n` +
        `${blackEmoji.arrow} \`${p}dating setgender <male/female/other>\`\n` +
        `${blackEmoji.arrow} \`${p}dating looking <male/female/other/any>\`\n` +
        `${blackEmoji.arrow} \`${p}dating find\` — Start finding matches!`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'deleteprofile') {
      const res = await Dating.deleteOne({ userId: message.author.id, guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res.deletedCount ? `${blackEmoji.yes} Your dating profile has been **deleted**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'toggle') {
      const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't have a dating profile. Use \`${p}dating createprofile\`.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      doc.active = !doc.active;
      await doc.save();
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Your profile is now **${doc.active ? 'active' : 'inactive'}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'setname') {
      const name = args.slice(1).join(' ');
      if (!name || name.length > 32) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating setname <name>\` (max 32 chars)`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { name } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Name set to **${name}**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'removename') {
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { name: null } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Name **removed**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'setgender' || action === 'gender') {
      const gender = args[1]?.toLowerCase();
      if (!['male', 'female', 'other'].includes(gender)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating setgender <male|female|other>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { gender } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Gender set to **${gender}**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'looking' || action === 'setlooking' || action === 'lookingfor') {
      const looking = args[1]?.toLowerCase();
      if (!['male', 'female', 'other', 'any'].includes(looking)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating looking <male|female|other|any>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { looking } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Looking for set to **${looking}**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'editbio' || action === 'bio') {
      const bio = args.slice(1).join(' ');
      if (!bio) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating editbio <your bio>\` (max 500 chars)`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { bio: bio.slice(0, 500) } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Bio **updated**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'uploadpic' || action === 'setpic') {
      const attachment = message.attachments.first();
      const url = attachment?.url || args[1];
      if (!url) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} Please attach an image or provide a URL.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { picture: url } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Profile picture **updated**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'removepic') {
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { picture: null } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Profile picture **removed**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'profile') {
      const target = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : message.author) || message.author;
      const doc = await Dating.findOne({ userId: target.id, guildId: message.guild.id });
      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} ${target.id === message.author.id ? 'You don\'t' : 'This user doesn\'t'} have a dating profile.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const genderEmoji = { male: '\u2642\ufe0f', female: '\u2640\ufe0f', other: '\u26a7\ufe0f' };
      const lookingText = doc.looking ? (doc.looking === 'any' ? 'Anyone' : doc.looking) : 'Not set';

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.heart} ${doc.name || target.username}'s Profile`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      const interestsText = doc.interests?.length ? doc.interests.join(', ') : 'None set';

      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Name:** ${doc.name || target.username}\n` +
        `${blackEmoji.arrow} **Bio:** ${doc.bio}\n` +
        `${blackEmoji.arrow} **Age:** ${doc.age}\n` +
        `${blackEmoji.arrow} **Gender:** ${genderEmoji[doc.gender]} ${doc.gender}\n` +
        `${blackEmoji.arrow} **Looking for:** ${lookingText}\n` +
        `${blackEmoji.arrow} **Interests:** ${interestsText}\n` +
        `${blackEmoji.arrow} **Status:** ${doc.active ? `${blackEmoji.on} Active` : `${blackEmoji.off} Inactive`}\n` +
        `${blackEmoji.arrow} **Matched:** ${doc.matchedWith ? `<@${doc.matchedWith}>` : 'Nobody'}\n` +
        `${blackEmoji.arrow} **Liked by:** ${doc.likedBy?.length || 0} people\n` +
        `${blackEmoji.arrow} **Gifts received:** ${doc.giftsReceived || 0}\n` +
        (doc.picture ? `${blackEmoji.arrow} **Picture:** [View](${doc.picture})` : '')
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'find') {
      const myDoc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!myDoc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Create a profile first with \`${p}dating createprofile\`.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const filter = {
        guildId: message.guild.id,
        active: true,
        userId: { $ne: message.author.id },
        matchedWith: null,
      };
      if (myDoc.looking && myDoc.looking !== 'any') {
        filter.gender = myDoc.looking;
      }

      const profiles = await Dating.find(filter);
      if (!profiles.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No matching profiles found right now. Try again later!`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const random = profiles[Math.floor(Math.random() * profiles.length)];
      const user = await client.users.fetch(random.userId).catch(() => null);
      const genderEmoji = { male: '\u2642\ufe0f', female: '\u2640\ufe0f', other: '\u26a7\ufe0f' };

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.heart} Potential Match`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Name:** ${random.name || user?.username}\n` +
        `${blackEmoji.arrow} **Bio:** ${random.bio}\n` +
        `${blackEmoji.arrow} **Gender:** ${genderEmoji[random.gender]} ${random.gender}\n` +
        `${blackEmoji.arrow} **Looking for:** ${random.looking}\n` +
        (random.picture ? `${blackEmoji.arrow} **Picture:** [View](${random.picture})` : '')
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dating_like_${random.userId}`).setLabel('\u2764\ufe0f Like').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('dating_skip').setLabel('Skip').setStyle(ButtonStyle.Secondary),
      );
      c.addActionRowComponents(row);

      const msg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      const collector = msg.createMessageComponentCollector({ time: 30000 });
      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) return;
        await i.deferUpdate().catch(() => {});

        if (i.customId.startsWith('dating_like_')) {
          const targetId = i.customId.replace('dating_like_', '');
          const freshMyDoc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
          if (freshMyDoc?.matchedWith) {
            const rc = new ContainerBuilder();
            rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You're already matched with someone.`));
            await msg.edit({ components: [rc], flags: MessageFlags.IsComponentsV2 });
            collector.stop();
            return;
          }
          await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $addToSet: { likes: targetId } });
          await Dating.findOneAndUpdate({ userId: targetId, guildId: message.guild.id }, { $addToSet: { likedBy: message.author.id } });
          const targetDoc = await Dating.findOne({ userId: targetId, guildId: message.guild.id });

          if (targetDoc?.likes?.includes(message.author.id) && !targetDoc.matchedWith) {
            await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id, matchedWith: null }, { $set: { matchedWith: targetId } });
            await Dating.findOneAndUpdate({ userId: targetId, guildId: message.guild.id, matchedWith: null }, { $set: { matchedWith: message.author.id } });
            const rc = new ContainerBuilder();
            rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
              `# ${blackEmoji.heart} It's a Match!\n\n` +
              `${blackEmoji.yes} You and **${user?.username || targetId}** both liked each other! You're now matched.\n` +
              `${blackEmoji.info} Use \`${p}dating unmatch\` to break the match.`
            ));
            await msg.edit({ components: [rc], flags: MessageFlags.IsComponentsV2 });
          } else {
            const rc = new ContainerBuilder();
            rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
              `${blackEmoji.yes} You liked **${user?.username || targetId}**! If they like you back, you'll be matched.`
            ));
            await msg.edit({ components: [rc], flags: MessageFlags.IsComponentsV2 });
          }
        } else {
          const rc = new ContainerBuilder();
          rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} Skipped. Use \`${p}dating find\` again to find another.`));
          await msg.edit({ components: [rc], flags: MessageFlags.IsComponentsV2 });
        }
        collector.stop();
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          const rc = new ContainerBuilder();
          rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} Timed out. Use \`${p}dating find\` again.`));
          await msg.edit({ components: [rc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
      });
      return;
    }

    if (action === 'like') {
      const target = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!target || target.id === message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating like @user\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const myDoc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!myDoc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Create a profile first.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (myDoc.matchedWith) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You're already matched with someone. Use \`${p}dating unmatch\` first.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const targetDoc = await Dating.findOne({ userId: target.id, guildId: message.guild.id });
      if (!targetDoc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} That user doesn't have a dating profile in this server.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (targetDoc.matchedWith) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} That user is already matched with someone.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (myDoc.likes?.includes(target.id)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You've already liked this person.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $addToSet: { likes: target.id } });
      await Dating.findOneAndUpdate({ userId: target.id, guildId: message.guild.id }, { $addToSet: { likedBy: message.author.id } });

      if (targetDoc.likes?.includes(message.author.id)) {
        await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id, matchedWith: null }, { $set: { matchedWith: target.id } });
        await Dating.findOneAndUpdate({ userId: target.id, guildId: message.guild.id, matchedWith: null }, { $set: { matchedWith: message.author.id } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.heart} It's a Match!\n\n` +
          `${blackEmoji.yes} You and **${target.username}** both liked each other! You're now matched.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} You liked **${target.username}**! If they like you back, you'll match.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'unlike') {
      const target = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!target) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating unlike @user\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $pull: { likes: target.id } });
      if (res) await Dating.findOneAndUpdate({ userId: target.id, guildId: message.guild.id }, { $pull: { likedBy: message.author.id } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Removed like from **${target.username}**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'unmatch') {
      const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!doc?.matchedWith) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You're not matched with anyone.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const partnerId = doc.matchedWith;
      await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { matchedWith: null } });
      await Dating.findOneAndUpdate({ userId: partnerId, guildId: message.guild.id, matchedWith: message.author.id }, { $set: { matchedWith: null } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} You have been **unmatched**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'matches' || action === 'mymatch' || action === 'match') {
      const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!doc?.matchedWith) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} You're not matched with anyone. Use \`${p}dating find\` to find someone!`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const match = await client.users.fetch(doc.matchedWith).catch(() => null);
      const matchDoc = await Dating.findOne({ userId: doc.matchedWith, guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.heart} Your Match\n\n` +
        `${blackEmoji.arrow} **User:** ${match?.username || doc.matchedWith}\n` +
        `${blackEmoji.arrow} **Name:** ${matchDoc?.name || match?.username}\n` +
        `${blackEmoji.arrow} **Bio:** ${matchDoc?.bio}\n\n` +
        `${blackEmoji.info} Use \`${p}dating unmatch\` to break the match.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'likes' || action === 'mylike' || action === 'mylikes') {
      const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!doc?.likes?.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} You haven't liked anyone yet.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const lines = [];
      for (const id of doc.likes.slice(0, 15)) {
        const u = await client.users.fetch(id).catch(() => null);
        lines.push(`> ${blackEmoji.arrow} ${u?.username || id}`);
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.heart} Your Likes (${doc.likes.length})\n\n${lines.join('\n')}` +
        (doc.likes.length > 15 ? `\n\n${blackEmoji.info} Showing 15 of ${doc.likes.length}` : '')
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'stats') {
      const total = await Dating.countDocuments({ guildId: message.guild.id });
      const active = await Dating.countDocuments({ guildId: message.guild.id, active: true });
      const matched = await Dating.countDocuments({ guildId: message.guild.id, matchedWith: { $ne: null } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.stats || blackEmoji.list} Dating Stats — ${message.guild.name}\n\n` +
        `${blackEmoji.arrow} **Total Profiles:** ${total}\n` +
        `${blackEmoji.arrow} **Active:** ${active}\n` +
        `${blackEmoji.arrow} **Matched:** ${matched}\n` +
        `${blackEmoji.arrow} **Available:** ${active - matched}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'setage' || action === 'age') {
      const age = parseInt(args[1]);
      if (!age || age < 13 || age > 100) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating setage <13-100>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { age } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Age set to **${age}**.` : `${blackEmoji.no} You don't have a profile.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'interest' || action === 'interests') {
      const sub = args[1]?.toLowerCase();
      if (!['add', 'remove', 'clear'].includes(sub)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:**\n` +
          `${blackEmoji.arrow} \`${p}dating interest add <interest>\` — Add an interest\n` +
          `${blackEmoji.arrow} \`${p}dating interest remove <interest>\` — Remove an interest\n` +
          `${blackEmoji.arrow} \`${p}dating interest clear\` — Clear all interests`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'clear') {
        const res = await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { interests: [] } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          res ? `${blackEmoji.yes} All interests **cleared**.` : `${blackEmoji.no} You don't have a profile.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const interest = args.slice(2).join(' ');
      if (!interest || interest.length > 50) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide an interest (max 50 characters).`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'add') {
        const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (!doc) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't have a profile.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if ((doc.interests?.length || 0) >= 10) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You can only have up to **10** interests. Remove some first.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $addToSet: { interests: interest.toLowerCase() } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Added interest: **${interest}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'remove') {
        await Dating.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $pull: { interests: interest.toLowerCase() } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Removed interest: **${interest}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (action === 'likedby' || action === 'admirers' || action === 'wholikesme') {
      const doc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!doc?.likedBy?.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} Nobody has liked you yet. Keep your profile active!`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const lines = [];
      for (const id of doc.likedBy.slice(0, 15)) {
        const u = await client.users.fetch(id).catch(() => null);
        lines.push(`> ${blackEmoji.arrow} ${u?.username || id}`);
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.heart} Liked By (${doc.likedBy.length})\n\n${lines.join('\n')}` +
        (doc.likedBy.length > 15 ? `\n\n${blackEmoji.info} Showing 15 of ${doc.likedBy.length}` : '')
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'gift' || action === 'sendgift') {
      const target = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!target || target.id === message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}dating gift @user\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const myDoc = await Dating.findOne({ userId: message.author.id, guildId: message.guild.id });
      if (!myDoc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Create a profile first with \`${p}dating createprofile\`.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const targetDoc = await Dating.findOne({ userId: target.id, guildId: message.guild.id });
      if (!targetDoc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} That user doesn't have a dating profile.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const gifts = [
        { emoji: '\ud83c\udf39', name: 'Rose' },
        { emoji: '\ud83d\udc8e', name: 'Diamond' },
        { emoji: '\ud83c\udf6b', name: 'Chocolate' },
        { emoji: '\ud83e\uddf8', name: 'Teddy Bear' },
        { emoji: '\ud83d\udc8c', name: 'Love Letter' },
        { emoji: '\u2b50', name: 'Star' },
        { emoji: '\ud83c\udf1f', name: 'Glowing Star' },
        { emoji: '\ud83c\udf3a', name: 'Hibiscus' },
        { emoji: '\ud83e\udd70', name: 'Heart Eyes' },
        { emoji: '\ud83c\udf82', name: 'Cake' }
      ];
      const gift = gifts[Math.floor(Math.random() * gifts.length)];

      await Dating.findOneAndUpdate({ userId: target.id, guildId: message.guild.id }, { $inc: { giftsReceived: 1 } });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.heart} Gift Sent!\n\n` +
        `${gift.emoji} **${message.author.username}** sent a **${gift.name}** to **${target.username}**!\n` +
        `${blackEmoji.info} ${target.username} now has **${(targetDoc.giftsReceived || 0) + 1}** gifts.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'leaderboard' || action === 'lb' || action === 'top') {
      const profiles = await Dating.aggregate([
        { $match: { guildId: message.guild.id } },
        { $addFields: { likedByCount: { $size: { $ifNull: ['$likedBy', []] } } } },
        { $sort: { likedByCount: -1, giftsReceived: -1 } },
        { $limit: 10 }
      ]);
      if (!profiles.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No dating profiles in this server yet.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const lines = [];
      const medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
      for (let i = 0; i < profiles.length; i++) {
        const prof = profiles[i];
        const u = await client.users.fetch(prof.userId).catch(() => null);
        const prefix = medals[i] || `**${i + 1}.**`;
        lines.push(`${prefix} ${u?.username || prof.userId} — ${blackEmoji.heart} ${prof.likedByCount || 0} likes, ${prof.giftsReceived || 0} gifts`);
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.stats || blackEmoji.list} Dating Leaderboard\n\n${lines.join('\n')}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}dating\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
