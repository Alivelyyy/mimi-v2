const { REST } = require("discord.js");

let rest;

function getRest(token) {
  if (!rest) {
    rest = new REST({ version: "10" }).setToken(token);
  }
  return rest;
}

async function setBotAvatar(token, guildId, imageUrl) {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const base64Data = `data:image/png;base64,${buffer.toString("base64")}`;

  await getRest(token).patch(`/guilds/${guildId}/members/@me`, {
    body: { avatar: base64Data },
  });
}

async function setBotBanner(token, guildId, imageUrl) {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const base64Data = `data:image/png;base64,${buffer.toString("base64")}`;

  await getRest(token).patch(`/guilds/${guildId}/members/@me`, {
    body: { banner: base64Data },
  });
}

async function setBotBio(token, guildId, bioText) {
  await getRest(token).patch(`/guilds/${guildId}/members/@me`, {
    body: { bio: bioText },
  });
}

async function setBotNickname(token, guildId, nickname) {
  await getRest(token).patch(`/guilds/${guildId}/members/@me`, {
    body: { nick: nickname },
  });
}

async function resetBotProfile(token, guildId) {
  await getRest(token).patch(`/guilds/${guildId}/members/@me`, {
    body: {
      avatar: null,
      banner: null,
      bio: null,
      nick: null,
    },
  });
}

module.exports = { setBotAvatar, setBotBanner, setBotBio, setBotNickname, resetBotProfile };
