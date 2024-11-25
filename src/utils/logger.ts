import winston, { Logger } from 'winston';
import path from 'path';
import chalk, { ChalkInstance } from 'chalk';

// Constants
const DEFAULT_LOG_LEVEL = 'debug';
const TIME_ZONE = 'Europe/Warsaw';
const DATE_FORMAT = 'en-GB';
const CONSOLE_COLOR_MAP: Record<string, ChalkInstance> = {
    info: chalk.green,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.blue,
    http: chalk.cyan,
    verbose: chalk.magenta,
    silly: chalk.grey
};

// Force chalk colors
chalk.level = 3;

// Helper function to format date
const formatDateInTimeZone = (date: Date, timeZone: string): string => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        timeZone,
        hour12: false
    };
    return new Intl.DateTimeFormat(DATE_FORMAT, options).format(date);
};

// Winston formats
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => formatDateInTimeZone(new Date(), TIME_ZONE)
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.printf(({ level, message, timestamp, label, filename }) => {
    const colorizerFn = CONSOLE_COLOR_MAP[level] ?? chalk.white;
    const colorizedLevel = colorizerFn(level);
    const colorizedTimestamp = chalk.gray(timestamp);
    const colorizedLabel = chalk.hex('#FFA500')(label); // Orange
    const colorizedFilename = chalk.hex('#00CED1')(filename); // Dark Turquoise
    return `${colorizedTimestamp} [${colorizedLevel}] [${colorizedLabel}] [${colorizedFilename}]: ${message}`;
});

// Create file transport
const fileTransport = (filename: string, level: string = 'debug') =>
    new winston.transports.File({
        filename: path.resolve(__dirname, '..', '..', 'logs', filename),
        level,
        format: logFormat
    });

// Console transport
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), consoleFormat)
});

// Singleton Logger Instance
let loggerInstance: Logger;

function createLogger(): Logger {
    if (!loggerInstance) {
        loggerInstance = winston.createLogger({
            level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
            format: logFormat,
            transports: [
                fileTransport('combined.log'),
                fileTransport('error.log', 'error'),
                consoleTransport
            ]
        });
    }
    return loggerInstance;
}

// Ensure logs directory exists
function ensureLogsDirectory(): void {
    const logsDir = path.resolve(__dirname, '..', '..', 'logs');
    if (!require('fs').existsSync(logsDir)) {
        require('fs').mkdirSync(logsDir, { recursive: true });
    }
}

ensureLogsDirectory();

// Export the singleton logger
export const logger = createLogger();
