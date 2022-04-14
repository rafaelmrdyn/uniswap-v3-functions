const { createLogger, format, transports, config } = require('winston');

const logger = createLogger({
    levels: config.syslog.levels,
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json()
    ),
    transports: [
        new transports.Console()
    ],
    exceptionHandlers: [
        new transports.Console()
    ]
});

module.exports = {
    logger
};
