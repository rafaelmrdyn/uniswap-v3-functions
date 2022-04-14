const express = require("express");
const bodyParser = require("body-parser");
const { logger } = require("./loggers");

const app = express();

app.use(
    bodyParser.json({
        limit: "15mb"
    })
);
app.use(
    bodyParser.urlencoded({
        limit: "15mb",
        extended: true
    })
);

app.use('/uniV3', require('./routes/uniswapV3'));

if (process.env.NODE_ENV !== 'production') {
    const swaggerRoutes = require('./routes/swagger/swagger.route');
    app.use('/api-docs', swaggerRoutes);
}

const port = process.env.PORT || 1337;
const httpServer = require("http").createServer(app);

httpServer.listen(port, function () {
    logger.info(`App running on port ${port}.`);
});
