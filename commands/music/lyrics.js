const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');
const axios = require('axios');

async function fetchFromLrclib(title, artist) {
  try {
    const { Client } = await import("lrclib-api");
    const client = new Client();
    
    const result = await client.findLyrics({
      track_name: title,
      artist_name: artist
    });
    
    if (result && result.plainLyrics) {
      return {
        lyrics: result.plainLyrics,
        source: "LRCLIB",
        syncedLyrics: result.syncedLyrics || null
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchFromGenius(title, artist) {
  try {
    const Genius = require("genius-lyrics");
    const client = new Genius.Client();
    const searches = await client.songs.search(`${title} ${artist}`);
    if (searches && searches.length > 0) {
      const song = searches[0];
      const lyrics = await song.lyrics();
      if (lyrics) return { lyrics: lyrics, source: "Genius" };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchFromOvh(title, artist) {
  try {
    const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    if (response.data && response.data.lyrics) {
      return {
        lyrics: response.data.lyrics,
        source: "OVH"
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchLyrics(title, artist) {
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]|feat\.|ft\./gi, '').trim();
  const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/gi, '').trim();
  
  const sources = [
    () => fetchFromLrclib(cleanTitle, cleanArtist),
    () => fetchFromLrclib(title, artist),
    () => fetchFromOvh(cleanTitle, cleanArtist),
    () => fetchFromGenius(cleanTitle, cleanArtist)
  ];
  
  for (const fetchSource of sources) {
    try {
      const result = await fetchSource();
      if (result && result.lyrics) return result;
    } catch (error) { continue; }
  }
  
  try {
    const lrclibRes = await fetchFromLrclib(cleanTitle, "");
    if (lrclibRes && lrclibRes.lyrics) return lrclibRes;
  } catch (e) {}

  return null;
}

function splitLyrics(lyrics, maxLength = 3800) {
  const pages = [];
  const lines = lyrics.split('\n');
  let currentPage = '';
  for (const line of lines) {
    if ((currentPage + '\n' + line).length > maxLength) {
      if (currentPage) pages.push(currentPage.trim());
      currentPage = line;
    } else {
      currentPage += (currentPage ? '\n' : '') + line;
    }
  }
  if (currentPage.trim()) pages.push(currentPage.trim());
  return pages;
}

function createProgressBar(current, total, size = 25) {
  const progress = Math.round((size * current) / total);
  const emptyProgress = size - progress;
  const progressText = '▰'.repeat(progress);
  const emptyProgressText = '▱'.repeat(emptyProgress);
  const percentage = Math.round((current / total) * 100);
  return `${progressText}${emptyProgressText} **${percentage}%**`;
}

module.exports = {
  name: "lyrics",
  aliases: ['ly', 'songlyrics'],
  category: "music",
  usage: "[song name]",
  description: "Get lyrics for the current song or search for lyrics",
  execute: async (client, message, args) => {
    let title, artist, player;
    player = await client.getPlayer(message.guild.id);

    if (args.length > 0) {
      const query = args.join(" ");
      const parts = query.split("-").map(p => p.trim());
      if (parts.length >= 2) {
        artist = parts[0];
        title = parts.slice(1).join("-");
      } else {
        title = query;
        artist = "";
      }
    } else {
      const track = player?.queue?.current;
      if (!track) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.lyrics} No song playing`));
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
      title = track.title;
      artist = track.author;
    }
    
    const loadingMsg = await message.reply({ 
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Searching for lyrics...`))
      ],
      flags: MessageFlags.IsComponentsV2 
    });
    
    try {
      const result = await fetchLyrics(title, artist);
      if (!result) {
        return loadingMsg.edit({ 
          components: [
            new ContainerBuilder()
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Lyrics not found.`))
          ],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const lyricsPages = splitLyrics(result.lyrics);
      let currentPage = 0;
      let isLive = false;
      let liveInterval;

      const createContainer = () => {
        const container = new ContainerBuilder();
        if (isLive && result.syncedLyrics) {
          const currentTime = player?.position || 0;
          const totalTime = player?.queue?.current?.length || 0;
          const lines = result.syncedLyrics.split('\n').filter(l => l.trim());
          
          let currentLineIndex = 0;
          const parsedLines = lines.map(line => {
            const match = line.match(/\[(\d+):(\d+)[.:](\d+)\]/);
            if (match) {
              const ms = (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000 + parseInt(match[3]) * 10;
              return { time: ms, text: line.replace(/\[.*?\]/g, '').trim() };
            }
            const simpleMatch = line.match(/\[(\d+):(\d+\.?\d*)\]/);
            if (simpleMatch) {
              const ms = (parseInt(simpleMatch[1]) * 60 + parseFloat(simpleMatch[2])) * 1000;
              return { time: ms, text: line.replace(/\[.*?\]/g, '').trim() };
            }
            return { time: -1, text: line.trim() };
          }).filter(l => l.time !== -1);

          if (parsedLines.length > 0) {
            currentLineIndex = parsedLines.findIndex((l, i) => {
              const nextLine = parsedLines[i + 1];
              return currentTime >= l.time && (!nextLine || currentTime < nextLine.time);
            });
            if (currentLineIndex === -1) {
              if (currentTime < parsedLines[0].time) currentLineIndex = 0;
              else currentLineIndex = parsedLines.length - 1;
            }
          }
          
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${blackEmoji.music} Now Playing - ${title}`));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# **by ${artist}**`));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.time} **${client.formatTime(currentTime)}** / **${client.formatTime(totalTime)}** • Line **${currentLineIndex + 1}**/**${parsedLines.length || lines.length}**`));

          const start = Math.max(0, currentLineIndex - 2);
          const end = Math.min(parsedLines.length || lines.length, start + 5);
          let linesDisplay = '';
          for (let i = start; i < end; i++) {
            const lineText = parsedLines.length > 0 ? parsedLines[i].text : lines[i].replace(/\[.*?\]/g, '').trim();
            if (i === currentLineIndex) linesDisplay += `**► ${lineText}**\n`;
            else linesDisplay += `-# ${lineText}\n`;
          }
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(linesDisplay));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(createProgressBar(currentTime, totalTime)));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# **Real-time sync** | Updates every 0.2s | Source: ${result.source}`));
        } else {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.lyrics} Lyrics - ${title}`));
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`\n${lyricsPages[currentPage]}\n\`\`\``));
        }

        const buttons = [];
        if (!isLive && lyricsPages.length > 1) {
          buttons.push(
            new ButtonBuilder().setCustomId("prev").setLabel("Back").setStyle(ButtonStyle.Primary).setDisabled(currentPage === 0),
            new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(currentPage === lyricsPages.length - 1)
          );
        }
        if (result.syncedLyrics) buttons.push(new ButtonBuilder().setCustomId("toggle_live").setLabel(isLive ? "Static View" : "Live View").setStyle(ButtonStyle.Success));
        buttons.push(new ButtonBuilder().setCustomId("delete").setLabel("Close").setStyle(ButtonStyle.Danger));
        container.addActionRowComponents(new ActionRowBuilder().addComponents(buttons));
        return container;
      };

      await loadingMsg.edit({ content: null, components: [createContainer()], flags: MessageFlags.IsComponentsV2 });
      
      const collector = loadingMsg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 600000 });

      const deleteLyrics = async () => {
        clearInterval(liveInterval);
        collector.stop();
        await loadingMsg.delete().catch(() => {});
      };

      const trackEndHandler = async (p) => { if (p.guildId === message.guild.id) await deleteLyrics(); };
      client.on('trackEnd', trackEndHandler);
      client.on('queueEnd', trackEndHandler);

      collector.on("collect", async (i) => {
        await i.deferUpdate();
        if (i.customId === "toggle_live") {
          isLive = !isLive;
          if (isLive) {
            liveInterval = setInterval(async () => {
              const updatedPlayer = await client.getPlayer(message.guild.id);
              if (!updatedPlayer || !updatedPlayer.queue.current || (player?.queue?.current?.uri !== updatedPlayer.queue.current.uri)) return await deleteLyrics();
              player = updatedPlayer;
              await loadingMsg.edit({ components: [createContainer()] }).catch(() => clearInterval(liveInterval));
            }, 200);
          } else clearInterval(liveInterval);
        } else if (i.customId === "next") currentPage++;
        else if (i.customId === "prev") currentPage--;
        else if (i.customId === "delete") return await deleteLyrics();
        await loadingMsg.edit({ components: [createContainer()] });
      });

      collector.on('end', () => {
        clearInterval(liveInterval);
        client.off('trackEnd', trackEndHandler);
        client.off('queueEnd', trackEndHandler);
      });

    } catch (error) {
      return loadingMsg.edit({ 
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`An error occurred: ${error.message}`))
        ],
        flags: MessageFlags.IsComponentsV2
      });
    }
  },
};