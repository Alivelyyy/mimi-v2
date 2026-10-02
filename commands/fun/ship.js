const {
  MessageFlags,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const blackEmoji = require("@assets/emojis/black.js");

const shipDataPath = path.join(__dirname, "../../database/ship.json");
if (!fs.existsSync(shipDataPath)) {
  fs.writeFileSync(shipDataPath, JSON.stringify({}));
}

const OWNER_ID   = "1304080189029875753";
const BHAABHI_ID = "1414206702479347732";
const SISTER_ID  = "1463187118158385323";

function getShipKey(id1, id2) {
  return [id1, id2].sort().join("_");
}

function buildBar(percentage) {
  const total = 10;
  const filled = Math.round((percentage / 100) * total);
  const empty  = total - filled;
  return "[" + "#".repeat(filled) + "-".repeat(empty) + "]";
}

function getStatusLabel(percentage) {
  if (percentage <= 0)   return "No connection";
  if (percentage <= 15)  return "Very low";
  if (percentage <= 30)  return "Low";
  if (percentage <= 45)  return "Moderate";
  if (percentage <= 60)  return "Good";
  if (percentage <= 75)  return "Strong";
  if (percentage <= 90)  return "Very strong";
  if (percentage < 100)  return "Almost perfect";
  return "Perfect match";
}

async function fetchAvatarImage(user) {
  try {
    const url = user.displayAvatarURL({ extension: "png", size: 256 });
    return await loadImage(url);
  } catch {
    return null;
  }
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function circleClip(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
}

async function generateShipImage(user1, user2, percentage, notPossible) {
  const W = 700, H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   "#1a1a2e");
  bg.addColorStop(0.5, "#16213e");
  bg.addColorStop(1,   "#0f3460");
  ctx.fillStyle = bg;
  roundedRect(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // Subtle grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
  }
  for (let i = 0; i < H; i += 40) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
  }

  const avatarSize = 100;
  const avatarY    = 70;
  const av1X       = 100;
  const av2X       = W - 100;

  // Avatar backgrounds (glow rings)
  const glowColor = percentage === 100 ? "#ff6b9d" : notPossible ? "#666" : "#e94560";
  ctx.shadowColor  = glowColor;
  ctx.shadowBlur   = 20;
  ctx.fillStyle    = glowColor;
  ctx.beginPath();
  ctx.arc(av1X, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(av2X, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw avatars
  const av1 = await fetchAvatarImage(user1);
  const av2 = await fetchAvatarImage(user2);
  const drawAvatar = (img, cx, cy, r, user) => {
    ctx.save();
    circleClip(ctx, cx, cy, r);
    if (img) {
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = "#2a2a4a";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(user.username[0].toUpperCase(), cx, cy);
    }
    ctx.restore();
  };
  drawAvatar(av1, av1X, avatarY + avatarSize / 2, avatarSize / 2, user1);
  drawAvatar(av2, av2X, avatarY + avatarSize / 2, avatarSize / 2, user2);

  // Center symbol
  const midX = W / 2;
  const midY = avatarY + avatarSize / 2;
  ctx.font      = "bold 38px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (notPossible) {
    ctx.fillStyle = "#888888";
    ctx.fillText("x", midX, midY);
  } else if (percentage === 100) {
    ctx.fillStyle = "#ff6b9d";
    ctx.fillText("<3", midX, midY);
  } else {
    ctx.fillStyle = "#e94560";
    ctx.fillText("+", midX, midY);
  }

  // Usernames
  ctx.font          = "bold 17px sans-serif";
  ctx.textAlign     = "center";
  ctx.textBaseline  = "top";
  ctx.fillStyle     = "#ffffff";
  ctx.fillText(user1.username, av1X, avatarY + avatarSize + 10);
  ctx.fillText(user2.username, av2X, avatarY + avatarSize + 10);

  // Percentage text
  const pctY = avatarY + avatarSize + 36;
  if (notPossible) {
    ctx.font      = "bold 22px sans-serif";
    ctx.fillStyle = "#aaaaaa";
    ctx.textAlign = "center";
    ctx.fillText("Not possible", midX, pctY);
  } else {
    ctx.font      = "bold 28px sans-serif";
    ctx.fillStyle = percentage === 100 ? "#ff6b9d" : "#e94560";
    ctx.textAlign = "center";
    ctx.fillText(`${percentage}%`, midX, pctY - 2);
  }

  // Progress bar
  const barW = 320, barH = 14, barX = (W - barW) / 2, barY = H - 50;
  // Bar background
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundedRect(ctx, barX, barY, barW, barH, 7);
  ctx.fill();

  if (!notPossible && percentage > 0) {
    const fill = Math.round((percentage / 100) * barW);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fill, 0);
    if (percentage === 100) {
      barGrad.addColorStop(0, "#ff6b9d");
      barGrad.addColorStop(1, "#ff8fab");
    } else {
      barGrad.addColorStop(0, "#e94560");
      barGrad.addColorStop(1, "#f77f00");
    }
    ctx.fillStyle = barGrad;
    roundedRect(ctx, barX, barY, fill, barH, 7);
    ctx.fill();
  }

  // Status label below bar
  ctx.font         = "15px sans-serif";
  ctx.fillStyle    = "rgba(255,255,255,0.55)";
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  const label = notPossible ? "Not possible" : getStatusLabel(percentage);
  ctx.fillText(label, W / 2, barY + barH + 6);

  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "ship",
  aliases: ['lovemeter', 'couple'],
  category: "fun",
  usage: "$ship <@user1> [<@user2>]",
  execute: async (client, message, args, emoji) => {
    const mentioned = [...message.mentions.users.values()];

    if (!mentioned.length) {
      return message.reply(
        `Please mention at least one user!\nUsage: \`${module.exports.usage}\``
      ).catch(() => {});
    }

    let user1, user2;
    if (mentioned.length >= 2) {
      user1 = mentioned[0];
      user2 = mentioned[1];
    } else {
      user1 = message.author;
      user2 = mentioned[0];
    }

    if (user1.id === user2.id) {
      return message.reply("You can't ship someone with themselves!").catch(() => {});
    }

    const id1 = user1.id;
    const id2 = user2.id;

    const isOwnerBhaabhi =
      (id1 === OWNER_ID && id2 === BHAABHI_ID) ||
      (id1 === BHAABHI_ID && id2 === OWNER_ID);

    const isBhaabhiSister =
      (id1 === BHAABHI_ID && id2 === SISTER_ID) ||
      (id1 === SISTER_ID && id2 === BHAABHI_ID);

    const involvesSpecial =
      id1 === OWNER_ID || id2 === OWNER_ID ||
      id1 === BHAABHI_ID || id2 === BHAABHI_ID;

    let lovePercentage;
    let notPossible = false;

    if (isOwnerBhaabhi || isBhaabhiSister) {
      lovePercentage = 100;
    } else if (involvesSpecial) {
      lovePercentage = 0;
      notPossible = true;
    } else {
      const key = getShipKey(id1, id2);
      const shipData = JSON.parse(fs.readFileSync(shipDataPath, "utf-8"));
      if (shipData[key] !== undefined) {
        lovePercentage = shipData[key];
      } else {
        lovePercentage = Math.floor(Math.random() * 101);
        shipData[key] = lovePercentage;
        fs.writeFileSync(shipDataPath, JSON.stringify(shipData, null, 2));
      }
    }

    try {
      const imgBuffer  = await generateShipImage(user1, user2, lovePercentage, notPossible);
      const attachment = new AttachmentBuilder(imgBuffer, { name: "ship.png" });
      const label      = notPossible ? `Not possible ${blackEmoji.brokenHeart}` : getStatusLabel(lovePercentage);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${blackEmoji.cupid} ${user1.username}  +  ${user2.username}\n` +
        (notPossible
          ? `**Love:** \`0%\` — ${label}`
          : `**Love:** \`${lovePercentage}%\` — ${label}`)
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://ship.png')));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Ship System`));

      await message.channel.send({ components: [c], files: [attachment], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      console.error("[ship] canvas error:", err);
      // Fallback: plain text
      const bar   = buildBar(lovePercentage);
      const label = notPossible ? "Not possible" : getStatusLabel(lovePercentage);
      const lines = [
        `${user1.username} + ${user2.username}`,
        ``,
        `Love : ${notPossible ? "0% - Not possible" : `${lovePercentage}%`}`,
        `Meter: ${bar}`,
        `Status: ${label}`
      ];
      await message.channel.send(lines.join("\n")).catch(() => {});
    }
  }
};
