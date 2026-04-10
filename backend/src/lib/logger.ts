import winston from "winston";
import path from "path";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ timestamp, level, message, userId, ...meta }) => {
  const uid = userId ? ` userId=${userId}` : "";
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]${uid} ${message}${extra}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "app.log"),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// In development, also log to console with colour
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
    }),
  );
}

export default logger;
