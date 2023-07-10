const winston = require('winston');
const chalk = require('chalk');
let logger;
const moment = require('moment');
const config = require('config');
let alignColorsAndTime = winston.format.combine(
    winston.format.colorize({
        all: true
    }),
    winston.format.printf(
        info => `${moment().format("MMM-DD-YYYY HH:mm:ss")} ${info.level} : ${info.message}`
    )
);
const consoleFormat = winston.format.combine(
    winston.format.timestamp({
        format: "YY-MM-DD-HH:MM:SS"
    }),
    winston.format.printf(
        info => `${info.timestamp}  ${info.level} : ${info.message}`
    )
);
if (!logger) {
    const levels = winston.config.syslog.levels;
    levels.silly = 8;
    const transports = [
        new winston.transports.Console({
            format: alignColorsAndTime,
        }),
    ];
    logger = winston.createLogger({
        levels: levels,
        level: process.env.FD_LOG_LEVEL ? process.env.FD_LOG_LEVEL : "info",
        format: winston.format.json(),
        transports
    });
    logger.silly(chalk.bold.blue.bgGray('Starting Logging'));
}
module.exports = logger;