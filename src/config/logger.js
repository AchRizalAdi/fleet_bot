const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { env } = require("./env");

function ensureLogDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createLogger() {
  const isProduction = env.NODE_ENV === "production";
  const logLevel = env.LOG_LEVEL || "info";
  const logFilePath = env.LOG_FILE_PATH || "/app/logs/app.log";

  ensureLogDir(logFilePath);

  if (isProduction) {
    const transport = pino.transport({
      targets: [
        {
          target: "pino/file",
          options: { destination: 1 },
          level: logLevel,
        },
        {
          target: "pino/file",
          options: { destination: logFilePath, mkdir: true },
          level: logLevel,
        },
      ],
    });

    return pino({ level: logLevel }, transport);
  }

  const transport = pino.transport({
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
        level: logLevel,
      },
      {
        target: "pino/file",
        options: { destination: logFilePath, mkdir: true },
        level: logLevel,
      },
    ],
  });

  return pino({ level: logLevel }, transport);
}

module.exports = { createLogger };