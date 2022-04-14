const express = require('express');
const swaggerDefinition = require('../../swagger-docs/swagger');
const router = express.Router();

(async function () {
    const { default: swaggerJsdoc } = await import('swagger-jsdoc');
    const { serve, setup } = await import('swagger-ui-express')
    const swaggerSpec = swaggerJsdoc({
        swaggerDefinition,
        apis: ['swagger-docs/*.yml', 'routes/**/*.js'],
    });

    router.use('/', serve);
    router.get(
        '/',
        setup(swaggerSpec, {
            explorer: true,
            swaggerOptions: {
                filter: true,
                displayRequestDuration: true,
            }
        })
    );
}());

module.exports = router;
