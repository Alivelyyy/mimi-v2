const HEALTH_CHECK_INTERVAL_MS = 30_000; // check every 30 seconds

/**
 * Starts a recurring health check that watches whether the Lavalink node
 * is still connected. If the node WebSocket is no longer open, it attempts
 * to reconnect by calling the node's internal connect logic.
 */
module.exports = function startNodeHealthCheck(client) {
  if (client._nodeHealthCheckInterval) {
    clearInterval(client._nodeHealthCheckInterval);
  }

  client._nodeHealthCheckInterval = setInterval(async () => {
    try {
      if (!client.manager || !client.manager.shoukaku) return;

      const nodes = [...client.manager.shoukaku.nodes.values()];

      for (const node of nodes) {
        // WebSocket readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
        const wsState = node.ws?.readyState;
        const isConnected = node.state === "connected" || wsState === 1;

        if (!isConnected) {
          client.log(
            `[HealthCheck] Node "${node.name}" is not connected (state=${node.state}, ws=${wsState}). Forcing reconnect...`,
            "warn"
          );
          try {
            await node.connect();
          } catch (err) {
            client.log(
              `[HealthCheck] Failed to reconnect node "${node.name}": ${err.message}`,
              "error"
            );
          }
        }
      }
    } catch (err) {
      client.log(`[HealthCheck] Unexpected error: ${err.message}`, "error");
    }
  }, HEALTH_CHECK_INTERVAL_MS);

  client.log("[HealthCheck] Node health monitor started (30s interval)", "debug");
};
