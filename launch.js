
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

require("dotenv").config();
require("module-alias/register");

// Suppress Discord.js deprecation warnings
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('clientReady')) {
    return;
  }
  console.warn(warning);
});

const logger = require("@plugins/logger.js");

logger.interceptConsole();

logger.setupShutdownHooks();

logger.banner();

logger.log("Starting Mimi Bot...", "start", "Launch");

const configPath = path.join(__dirname, 'config.yml');
let config;
try {
  config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  logger.log("Configuration loaded successfully", "success", "Launch");
} catch (error) {
  logger.log(`Failed to load config.yml: ${error.message}`, "error", "Launch");
  process.exit(1);
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";

logger.log(`Environment: ${process.env.NODE_ENV}`, "info", "Launch");

logger.log("Launching Bot Sharder...", "ready", "Launch");
require("@main/sharder.js");

process.on('SIGINT', () => {
  logger.log("Received SIGINT - Shutting down gracefully...", "warn", "Launch");
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.log("Received SIGTERM - Shutting down gracefully...", "warn", "Launch");
  process.exit(0);
});

logger.log("Launch script initialized successfully!", "success", "Launch");
