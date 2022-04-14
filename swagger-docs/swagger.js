const { version } = require('../package.json');

const swaggerDef = {
    openapi: '3.0.3',
    info: {
        title: 'Uni V3 Documentation',
        version,
        license: {
            name: 'MIT',
        },
    },
    servers: [
        {
            url: `http://localhost:1337/`,
            description: 'Local server'
        },
    ],
};

module.exports = swaggerDef;
