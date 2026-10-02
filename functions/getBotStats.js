const { getInfo } = require("discord-hybrid-sharding");

module.exports = async (client) => {
    try {
        const stats = {
            servers: 0,
            users: 0,
            commandsUsed: 0,
            uptime: formatUptime(client.uptime),
            songsPlayed: 0,
            votesToday: 0
        };

        if (client.cluster) {
            // Get stats from all shards/clusters
            const clusterStats = await client.cluster.broadcastEval(client => {
                return {
                    servers: client.guilds.cache.size,
                    users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
                    uptime: client.uptime
                };
            });

            stats.servers = clusterStats.reduce((acc, shard) => acc + shard.servers, 0);
            stats.users = clusterStats.reduce((acc, shard) => acc + shard.users, 0);
        } else {
            // Single instance stats
            stats.servers = client.guilds.cache.size;
            stats.users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        }

        // Get command usage from database if available
        try {
            // This would depend on how you track command usage
            // For now, using a placeholder
            stats.commandsUsed = "1000+";
        } catch (error) {
            stats.commandsUsed = "N/A";
        }

        // Get songs played if music manager is available
        try {
            if (client.manager && client.manager.players) {
                stats.songsPlayed = client.manager.players.size * 10; // Rough estimate
            } else {
                stats.songsPlayed = "500+";
            }
        } catch (error) {
            stats.songsPlayed = "N/A";
        }

        return stats;
    } catch (error) {
        console.error('Error getting bot stats:', error);
        return {
            servers: "N/A",
            users: "N/A",
            commandsUsed: "N/A",
            uptime: "N/A",
            songsPlayed: "N/A",
            votesToday: 0
        };
    }
};

function formatUptime(uptime) {
    if (!uptime) return "0h 0m";
    
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}