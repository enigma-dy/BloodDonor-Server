import winston from "winston";
const { combine, timestamp, printf, colorize, align } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    colorize(),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    align(),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console transport for development
    new winston.transports.Console(),
    // File transports for production
    process.env.NODE_ENV === "production" &&
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
      }),
    process.env.NODE_ENV === "production" &&
      new winston.transports.File({ filename: "logs/combined.log" }),
  ].filter(Boolean), // Filter out false values
});

// Stream for morgan to use winston
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: "logs/exceptions.log" })
);

// Handle unhandled rejections
logger.rejections.handle(
  new winston.transports.File({ filename: "logs/rejections.log" })
);

export default logger;
