const {
 ContainerBuilder,
 TextDisplayBuilder,
 SeparatorBuilder,
 SeparatorSpacingSize,
 MessageFlags,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ComponentType
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
 name: "stop",
 aliases: ['st', 'stopmusic'],
 cooldown: "",
 category: "music",
 usage: "",
 description: "stop the player",
 args: false,
 vote: false,
 new: false,
 admin: false,
 owner: false,
 botPerms: [],
 userPerms: [],
 player: true,
 queue: true,
 inVoiceChannel: true,
 sameVoiceChannel: true,
 execute: async (client, message, args, prefix) => {
   const player = await client.getPlayer(message.guild.id);

   const container = new ContainerBuilder();

   container.addTextDisplayComponents(
     new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Stop Confirmation`)
   );
   container.addSeparatorComponents(
     new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
   );
   container.addTextDisplayComponents(
     new TextDisplayBuilder().setContent(
       `Are you sure you want to stop the music?\n\n` +
       `${blackEmoji.arrow} Clear the current queue\n` +
       `${blackEmoji.arrow} Stop the current track\n` +
       `${blackEmoji.arrow} Disconnect from voice channel\n` +
       `${blackEmoji.arrow} Reset all player settings`
     )
   );

   const confirmButton = new ButtonBuilder()
     .setCustomId("stop_confirm")
     .setLabel("Confirm Stop")
     .setStyle(ButtonStyle.Danger)
     .setEmoji(blackEmoji.checkReact);

   const cancelButton = new ButtonBuilder()
     .setCustomId("stop_cancel")
     .setLabel("Cancel")
     .setStyle(ButtonStyle.Secondary)
     .setEmoji(blackEmoji.crossReact);

   container.addActionRowComponents(
     new ActionRowBuilder().addComponents(confirmButton, cancelButton)
   );

   const msg = await message.reply({
     components: [container],
     flags: MessageFlags.IsComponentsV2
   });

   const collector = msg.createMessageComponentCollector({
     filter: (i) => i.user.id === message.author.id,
     time: 30000,
     componentType: ComponentType.Button
   });

   collector.on("collect", async (interaction) => {
     try {
       await interaction.deferUpdate().catch(() => {});

       if (interaction.customId === "stop_confirm") {
         player.queue.clear();
         player.data.delete("autoplay");
         player.loop = "none";
         player.playing = false;
         player.paused = false;

         await player.skip();
         await client.sleep(500);

         const successContainer = new ContainerBuilder();
         successContainer.addTextDisplayComponents(
           new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Player Stopped`)
         );
         successContainer.addSeparatorComponents(
           new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
         );
         successContainer.addTextDisplayComponents(
           new TextDisplayBuilder().setContent(
             `${blackEmoji.arrow} Queue cleared and player stopped\n` +
             `${blackEmoji.arrow} Disconnected from voice channel\n` +
             `${blackEmoji.arrow} **Stopped by:** ${message.author}`
           )
         );

         await interaction.message.edit({
           components: [successContainer],
           flags: MessageFlags.IsComponentsV2
         }).catch(() => {});

       } else if (interaction.customId === "stop_cancel") {
         const cancelContainer = new ContainerBuilder();
         cancelContainer.addTextDisplayComponents(
           new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Stop Cancelled`)
         );
         cancelContainer.addSeparatorComponents(
           new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
         );
         cancelContainer.addTextDisplayComponents(
           new TextDisplayBuilder().setContent(
             `${blackEmoji.arrow} Player stop operation was cancelled\n` +
             `${blackEmoji.arrow} Music will continue playing`
           )
         );

         await interaction.message.edit({
           components: [cancelContainer],
           flags: MessageFlags.IsComponentsV2
         }).catch(() => {});
       }

       collector.stop();
     } catch (error) {
       console.error("Error handling stop confirmation:", error);
       collector.stop();
     }
   });

   collector.on("end", async (collected, reason) => {
     if (reason === "time") {
       try {
         const timeoutContainer = new ContainerBuilder();
         timeoutContainer.addTextDisplayComponents(
           new TextDisplayBuilder().setContent(`# ${blackEmoji.time} Stop Timed Out`)
         );
         timeoutContainer.addSeparatorComponents(
           new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
         );
         timeoutContainer.addTextDisplayComponents(
           new TextDisplayBuilder().setContent(
             `${blackEmoji.arrow} Confirmation timed out\n` +
             `${blackEmoji.arrow} Player was not stopped`
           )
         );

         const disabledRow = new ActionRowBuilder().addComponents(
           new ButtonBuilder()
             .setCustomId("stop_confirm")
             .setLabel("Confirm Stop")
             .setStyle(ButtonStyle.Danger)
             .setEmoji(blackEmoji.checkReact)
             .setDisabled(true),
           new ButtonBuilder()
             .setCustomId("stop_cancel")
             .setLabel("Cancel")
             .setStyle(ButtonStyle.Secondary)
             .setEmoji(blackEmoji.crossReact)
             .setDisabled(true)
         );

         timeoutContainer.addActionRowComponents(disabledRow);

         await msg.edit({
           components: [timeoutContainer],
           flags: MessageFlags.IsComponentsV2
         }).catch(() => {});
       } catch (error) {
         console.error("Error handling stop timeout:", error);
       }
     }
   });
 },
};
