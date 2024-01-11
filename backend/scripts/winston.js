const winston = require('winston');
const colors = require('colors');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: 'verti-grade.log',
            maxsize: 10485760, // 10MB
            maxFiles: 7,
            tailable: true,
            zippedArchive: true,
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs'
        })
    ]
});

logger.log = logger.info; // Use the 'info' method as an alias for 'log'

module.exports = logger;