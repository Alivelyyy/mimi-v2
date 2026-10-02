const chalk = require("chalk");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const util = require("util");

const LOG_LEVELS = {
  error:    { priority: 0, color: "#ff2200", icon: "ERR ", bg: "#ff2200", file: true },
  warn:     { priority: 1, color: "#ffaa00", icon: "WARN", bg: "#ffaa00", file: true },
  start:    { priority: 2, color: "#00ff88", icon: "STRT", bg: "#00ff88", file: true },
  ready:    { priority: 2, color: "#77ee55", icon: "RDY ", bg: "#77ee55", file: true },
  success:  { priority: 2, color: "#00ff00", icon: "PASS", bg: "#00ff00", file: true },
  info:     { priority: 3, color: "#66aaff", icon: "INFO", bg: "#66aaff", file: true },
  log:      { priority: 3, color: "#ffffff", icon: "INFO", bg: "#ffffff", file: true },
  event:    { priority: 3, color: "#0088cc", icon: "EVNT", bg: "#0088cc", file: true },
  cmd:      { priority: 3, color: "#ff2277", icon: "CMD ", bg: "#ff2277", file: true },
  database: { priority: 3, color: "#55cc22", icon: "DB  ", bg: "#55cc22", file: true },
  cluster:  { priority: 3, color: "#00cccc", icon: "CLST", bg: "#00cccc", file: true },
  player:   { priority: 3, color: "#22aaff", icon: "PLYR", bg: "#22aaff", file: true },
  lavalink: { priority: 3, color: "#ff8800", icon: "LAVA", bg: "#ff8800", file: true },
  stats:    { priority: 3, color: "#ff66ff", icon: "STAT", bg: "#ff66ff", file: true },
  web:      { priority: 3, color: "#00ddff", icon: "WEB ", bg: "#00ddff", file: true },
  debug:    { priority: 4, color: "#dddd55", icon: "DBUG", bg: "#dddd55", file: false },
};

const MAX_LOG_FILES = 14;
const FLUSH_INTERVAL_MS = 500;
const MAX_BUFFER_SIZE = 200;

module.exports = class Logger {
  static logDir = path.join(__dirname, "..", "logs");
  static logFile = null;
  static errorFile = null;
  static currentDate = null;
  static consoleIntercepted = false;
  static minPriority = 4;
  static originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
  };

  static logBuffer = [];
  static errorBuffer = [];
  static flushTimer = null;
  static _stats = { total: 0, errors: 0, warns: 0, flushed: 0 };

  static ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    const dateStr = moment().format("YYYY-MM-DD");
    if (this.currentDate !== dateStr) {
      this.currentDate = dateStr;
      this.logFile = path.join(this.logDir, `bot-${dateStr}.log`);
      this.errorFile = path.join(this.logDir, `errors-${dateStr}.log`);
    }
  }

  static rotateLogs() {
    try {
      if (!fs.existsSync(this.logDir)) return;
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith("bot-") || f.startsWith("errors-"))
        .sort();

      const botFiles = files.filter(f => f.startsWith("bot-"));
      const errFiles = files.filter(f => f.startsWith("errors-"));

      const removeOld = (list) => {
        while (list.length > MAX_LOG_FILES) {
          const oldest = list.shift();
          try { fs.unlinkSync(path.join(this.logDir, oldest)); } catch (_) {}
        }
      };
      removeOld(botFiles);
      removeOld(errFiles);
    } catch (_) {}
  }

  static checkDateRoll() {
    const now = moment().format("YYYY-MM-DD");
    if (this.currentDate && this.currentDate !== now) {
      this.flushLogs();
      this.currentDate = now;
      this.logFile = path.join(this.logDir, `bot-${now}.log`);
      this.errorFile = path.join(this.logDir, `errors-${now}.log`);
      this.rotateLogs();
    }
  }

  static writeToFile(content, type = "log") {
    try {
      if (!this.logFile) this.ensureLogDirectory();
      this.checkDateRoll();

      const levelDef = LOG_LEVELS[type] || LOG_LEVELS.log;
      if (!levelDef.file) return;

      const timestamp = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      const fileContent = `[${timestamp}] [${levelDef.icon.trim().padEnd(4)}] ${content}\n`;

      this.logBuffer.push(fileContent);

      if (levelDef.priority <= 1) {
        this.errorBuffer.push(fileContent);
      }

      if (this.logBuffer.length >= MAX_BUFFER_SIZE) {
        this.flushLogs();
      } else {
        this.scheduleFlush();
      }
    } catch (error) {
      this.originalConsole.error("Logger file write failed:", error.message);
    }
  }

  static scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushLogs();
    }, FLUSH_INTERVAL_MS);
  }

  static flushLogs(sync = false) {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.logBuffer.length > 0) {
      const content = this.logBuffer.join("");
      this._stats.flushed += this.logBuffer.length;
      this.logBuffer = [];
      if (sync) {
        try { fs.appendFileSync(this.logFile, content); } catch (_) {}
      } else {
        fs.appendFile(this.logFile, content, (err) => {
          if (err) this.originalConsole.error("Log flush error:", err.message);
        });
      }
    }

    if (this.errorBuffer.length > 0) {
      const content = this.errorBuffer.join("");
      this.errorBuffer = [];
      if (sync) {
        try { fs.appendFileSync(this.errorFile, content); } catch (_) {}
      } else {
        fs.appendFile(this.errorFile, content, (err) => {
          if (err) this.originalConsole.error("Error log flush error:", err.message);
        });
      }
    }
  }

  static log(content, type = "log", client = "Process") {
    const levelDef = LOG_LEVELS[type] || LOG_LEVELS.log;

    if (levelDef.priority > this.minPriority) return;

    this._stats.total++;
    if (type === "error") this._stats.errors++;
    if (type === "warn") this._stats.warns++;

    const date = moment().format("HH:mm:ss");

    const timestamp = chalk.hex("#444444")(`[${date}]`);
    const clientDisplay = chalk.hex("#888888")(`[${client.toUpperCase().padEnd(8)}]`);
    const typeDisplay = chalk.bgHex(levelDef.bg).black(` ${levelDef.icon} `);
    const contentDisplay = chalk.hex(levelDef.color)(content);

    const consoleMethod = (type === "error" || type === "warn") ? this.originalConsole[type] : this.originalConsole.log;
    consoleMethod(`${timestamp} ${clientDisplay} ${typeDisplay} ${contentDisplay}`);

    const cleanContent = `[${client}] ${content}`;
    this.writeToFile(cleanContent, type);
  }

  static error(content, client = "Process") {
    this.log(content, "error", client);
  }

  static warn(content, client = "Process") {
    this.log(content, "warn", client);
  }

  static info(content, client = "Process") {
    this.log(content, "info", client);
  }

  static debug(content, client = "Process") {
    this.log(content, "debug", client);
  }

  static success(content, client = "Process") {
    this.log(content, "success", client);
  }

  static ready(content, client = "Process") {
    this.log(content, "ready", client);
  }

  static event(content, client = "Process") {
    this.log(content, "event", client);
  }

  static cmd(content, client = "Process") {
    this.log(content, "cmd", client);
  }

  static table(label, data, client = "Process") {
    if (!data || typeof data !== "object") return;
    const lines = Object.entries(data)
      .map(([k, v]) => `  ${chalk.hex("#888888")(k.padEnd(16))} ${chalk.hex("#ffffff")(String(v))}`)
      .join("\n");
    this.log(`${label}\n${lines}`, "info", client);
  }

  static group(label, fn, client = "Process") {
    const date = moment().format("HH:mm:ss");
    const timestamp = chalk.hex("#444444")(`[${date}]`);
    const clientDisplay = chalk.hex("#888888")(`[${client.toUpperCase().padEnd(8)}]`);
    const groupLabel = chalk.hex("#66aaff").bold(`┌─ ${label}`);
    this.originalConsole.log(`${timestamp} ${clientDisplay} ${groupLabel}`);
    fn();
    const groupEnd = chalk.hex("#66aaff").bold(`└─ end`);
    this.originalConsole.log(`${timestamp} ${clientDisplay} ${groupEnd}`);
  }

  static measure(label, fn, client = "Process") {
    const start = process.hrtime.bigint();
    const result = fn();
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    this.log(`${label} completed in ${elapsed.toFixed(2)}ms`, "debug", client);
    return result;
  }

  static async measureAsync(label, fn, client = "Process") {
    const start = process.hrtime.bigint();
    const result = await fn();
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    this.log(`${label} completed in ${elapsed.toFixed(2)}ms`, "debug", client);
    return result;
  }

  static getStats() {
    return {
      ...this._stats,
      bufferSize: this.logBuffer.length,
      errorBufferSize: this.errorBuffer.length,
      currentLogFile: this.logFile,
      currentErrorFile: this.errorFile,
      uptime: process.uptime(),
    };
  }

  static interceptConsole() {
    if (this.consoleIntercepted) return;
    this.consoleIntercepted = true;

    const self = this;
    const methodMap = { log: "log", error: "error", warn: "warn", info: "info" };

    for (const [method, type] of Object.entries(methodMap)) {
      console[method] = function (...args) {
        const message = args
          .map((arg) =>
            typeof arg === "object"
              ? util.inspect(arg, { depth: 3, colors: false, maxArrayLength: 50 })
              : String(arg)
          )
          .join(" ");

        const stack = new Error().stack;
        const callerLine = stack.split("\n")[2] || "";
        const fileMatch =
          callerLine.match(/\((.+):(\d+):(\d+)\)/) ||
          callerLine.match(/at (.+):(\d+):(\d+)/);
        let source = "Console";
        if (fileMatch) {
          const fullPath = fileMatch[1];
          source = path.basename(fullPath, path.extname(fullPath));
        }

        self.log(message, type, source);
      };
    }
  }

  static restoreConsole() {
    if (!this.consoleIntercepted) return;
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    this.consoleIntercepted = false;
  }

  static banner() {
    const bColor = chalk.hex("#00ffff").bold;
    const sColor = chalk.hex("#ff00ff").bold;
    const vColor = chalk.hex("#77ff77");

    const width = 60;
    const line = sColor("═".repeat(width));

    this.originalConsole.log("");
    this.originalConsole.log(sColor(`╔${line}╗`));
    this.originalConsole.log(
      sColor("║") +
        bColor(" MIMI MUSIC STREAMING ".padStart(width / 2 + 10).padEnd(width)) +
        sColor("║")
    );
    this.originalConsole.log(sColor(`╠${line}╣`));
    this.originalConsole.log(
      sColor("║") +
        "  " +
        chalk.white("Version : ") +
        vColor("6.0.0".padEnd(width - 14)) +
        sColor("║")
    );
    this.originalConsole.log(
      sColor("║") +
        "  " +
        chalk.white("Node    : ") +
        vColor(process.version.padEnd(width - 14)) +
        sColor("║")
    );
    this.originalConsole.log(
      sColor("║") +
        "  " +
        chalk.white("System  : ") +
        vColor(process.platform.toUpperCase().padEnd(width - 14)) +
        sColor("║")
    );
    this.originalConsole.log(
      sColor("║") +
        "  " +
        chalk.white("PID     : ") +
        vColor(String(process.pid).padEnd(width - 14)) +
        sColor("║")
    );
    this.originalConsole.log(sColor(`╚${line}╝`));
    this.originalConsole.log("");
  }

  static _shutdownHooked = false;

  static setupShutdownHooks() {
    if (this._shutdownHooked) return;
    this._shutdownHooked = true;

    process.on("exit", () => {
      this.flushLogs(true);
    });
  }

  static init(options = {}) {
    if (options.logDir) this.logDir = options.logDir;
    if (typeof options.minPriority === "number") this.minPriority = options.minPriority;

    this.ensureLogDirectory();
    this.rotateLogs();
    this.setupShutdownHooks();
    this.interceptConsole();
    this.banner();
    return this;
  }
};
