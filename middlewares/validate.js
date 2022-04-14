const Joi = require('joi');
const pick = require('../utils/pick');

const validate = (schema) => (req, res, next) => {
    const validSchema = pick(schema, ['body', 'params', 'headers', 'query']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' } })
        .validate(object);

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return res.status(400).json({
            message: errorMessage
        });
    }
    Object.assign(req, value);

    return next();
};

module.exports = validate;
