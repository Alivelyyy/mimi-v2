const VoiceStats = require('@db/voiceStats.js');
const MessageStats = require('@db/messageStats.js');

function startLeaderboardScheduler(client) {
  const CHECK_INTERVAL = 60000;
  let lastDailyReset = getStartOfDay();
  let lastWeeklyReset = getStartOfWeek();

  setInterval(async () => {
    try {
      const now = new Date();
      const currentDayStart = getStartOfDay(now);
      const currentWeekStart = getStartOfWeek(now);

      if (currentDayStart.getTime() > lastDailyReset.getTime()) {
        await VoiceStats.updateMany({}, { $set: { dailyTime: 0 } });
        await MessageStats.updateMany({}, { $set: { dailyMessages: 0 } });
        lastDailyReset = currentDayStart;
        if (client?.log) client.log('Leaderboard daily stats reset', 'info');
      }

      if (currentWeekStart.getTime() > lastWeeklyReset.getTime()) {
        await VoiceStats.updateMany({}, { $set: { weeklyTime: 0 } });
        await MessageStats.updateMany({}, { $set: { weeklyMessages: 0 } });
        lastWeeklyReset = currentWeekStart;
        if (client?.log) client.log('Leaderboard weekly stats reset', 'info');
      }
    } catch (err) {}
  }, CHECK_INTERVAL);
}

function getStartOfDay(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

module.exports = { startLeaderboardScheduler };
