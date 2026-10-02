const { createCanvas, loadImage } = require("@napi-rs/canvas");

const W = 900, H = 280;

const SOURCE_COLORS = {
  spotify:    "#1db954",
  youtube:    "#ff0000",
  soundcloud: "#ff5500",
  applemusic: "#fc3c44",
  deezer:     "#a238ff",
  twitch:     "#9146ff",
  bandcamp:   "#1da0c3",
};

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

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.substring(0, max - 3) + "..." : str;
}

function formatTime(ms) {
  if (!ms) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function tryLoadImage(url) {
  if (!url) return null;
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

async function generatePlayerCard(track, player) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const sourceName  = (track.sourceName || "").toLowerCase();
  const sourceColor = SOURCE_COLORS[sourceName] || "#7289da";
  const artImg      = await tryLoadImage(track.thumbnail);

  // ── Background ──────────────────────────────────────────────────────────────
  if (artImg) {
    ctx.save();
    ctx.filter = "blur(24px) brightness(0.28) saturate(1.4)";
    ctx.drawImage(artImg, -30, -30, W + 60, H + 60);
    ctx.filter = "none";
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0b0b1a");
    bg.addColorStop(0.5, "#1a1a3e");
    bg.addColorStop(1, "#0b0b1a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Dark gradient overlay (left heavy for text contrast)
  const overlay = ctx.createLinearGradient(0, 0, W, 0);
  overlay.addColorStop(0,    "rgba(0,0,0,0.85)");
  overlay.addColorStop(0.38, "rgba(0,0,0,0.75)");
  overlay.addColorStop(0.65, "rgba(0,0,0,0.50)");
  overlay.addColorStop(1,    "rgba(0,0,0,0.20)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // Very subtle vignette edge
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.8);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── Album Art ───────────────────────────────────────────────────────────────
  const artX = 28, artY = 28, artSize = 224, artR = 16;

  ctx.save();
  ctx.shadowColor  = "rgba(0,0,0,0.9)";
  ctx.shadowBlur   = 30;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, artX, artY, artSize, artSize, artR);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.restore();

  if (artImg) {
    ctx.save();
    roundedRect(ctx, artX, artY, artSize, artSize, artR);
    ctx.clip();
    ctx.drawImage(artImg, artX, artY, artSize, artSize);
    ctx.restore();

    // Subtle inner border on art
    ctx.save();
    roundedRect(ctx, artX, artY, artSize, artSize, artR);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    roundedRect(ctx, artX, artY, artSize, artSize, artR);
    ctx.clip();
    const ph = ctx.createLinearGradient(artX, artY, artX + artSize, artY + artSize);
    ph.addColorStop(0, "#1a1a3e");
    ph.addColorStop(1, "#2a2a5e");
    ctx.fillStyle = ph;
    ctx.fill();
    ctx.font          = "bold 90px sans-serif";
    ctx.textAlign     = "center";
    ctx.textBaseline  = "middle";
    ctx.fillStyle     = "rgba(255,255,255,0.1)";
    ctx.fillText("♫", artX + artSize / 2, artY + artSize / 2);
    ctx.restore();
  }

  // ── Right Side Info ──────────────────────────────────────────────────────────
  const infoX = artX + artSize + 32;
  const infoW = W - infoX - 22;
  let curY = 30;

  // Source badge
  const badgeLabel = track.isStream
    ? "◉  LIVE"
    : (sourceName.charAt(0).toUpperCase() + sourceName.slice(1)) || "Music";
  ctx.font = "bold 11px sans-serif";
  const bW = ctx.measureText(badgeLabel).width + 20;
  const bH = 21;
  roundedRect(ctx, infoX, curY, bW, bH, 10);
  ctx.fillStyle = sourceColor;
  ctx.fill();
  ctx.fillStyle     = "#fff";
  ctx.textAlign     = "left";
  ctx.textBaseline  = "middle";
  ctx.font          = "bold 11px sans-serif";
  ctx.fillText(badgeLabel, infoX + 10, curY + bH / 2);
  curY += bH + 12;

  // Title
  ctx.font         = "bold 25px sans-serif";
  ctx.fillStyle    = "#ffffff";
  ctx.textBaseline = "top";
  ctx.shadowColor  = "rgba(0,0,0,0.8)";
  ctx.shadowBlur   = 8;
  ctx.fillText(truncate(track.title, 36), infoX, curY);
  ctx.shadowBlur = 0;
  curY += 34;

  // Artist
  ctx.font      = "16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(truncate(track.author, 44), infoX, curY);
  curY += 26;

  // Separator
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(infoX, curY);
  ctx.lineTo(infoX + infoW, curY);
  ctx.stroke();
  curY += 14;

  // Stats row
  const duration = track.isStream ? "◉ LIVE" : formatTime(track.length);
  const volume   = `${player?.volume ?? 100}%`;
  const status   = player?.paused ? "⏸ Paused" : "▶ Playing";
  ctx.font      = "13px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`⏱  ${duration}`, infoX, curY);
  ctx.fillText(`🔊  ${volume}`,  infoX + 130, curY);
  ctx.fillText(status,           infoX + 220, curY);
  curY += 30;

  // Requester
  const requester = track.requester;
  if (requester) {
    const name   = requester.username || requester.tag || String(requester);
    const ava    = requester.displayAvatarURL
      ? requester.displayAvatarURL({ extension: "png", size: 64 })
      : null;
    const avaImg = await tryLoadImage(ava);
    const avR    = 15;

    ctx.save();
    ctx.beginPath();
    ctx.arc(infoX + avR, curY + avR, avR, 0, Math.PI * 2);
    if (avaImg) {
      ctx.clip();
      ctx.drawImage(avaImg, infoX, curY, avR * 2, avR * 2);
    } else {
      ctx.fillStyle = sourceColor;
      ctx.fill();
    }
    ctx.restore();

    ctx.font      = "11px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("Requested by", infoX + avR * 2 + 8, curY + 2);
    ctx.font      = "bold 13px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(truncate(name, 30), infoX + avR * 2 + 8, curY + 16);
  }

  // ── Progress Bar ─────────────────────────────────────────────────────────────
  const barX = infoX;
  const barY = H - 36;
  const barW = infoW;
  const barH = 5;

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundedRect(ctx, barX, barY, barW, barH, 3);
  ctx.fill();

  // Start dot / tiny fill
  const startFill = Math.max(barH, 5);
  const barGrad   = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGrad.addColorStop(0, sourceColor);
  barGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = barGrad;
  roundedRect(ctx, barX, barY, startFill, barH, 3);
  ctx.fill();

  // Playhead dot
  ctx.beginPath();
  ctx.arc(barX + startFill, barY + barH / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Time labels
  ctx.font      = "10px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("0:00", barX, barY + barH + 14);
  ctx.textAlign = "right";
  ctx.fillText(track.isStream ? "LIVE" : formatTime(track.length), barX + barW, barY + barH + 14);

  return canvas.toBuffer("image/png");
}

module.exports = { generatePlayerCard };
