const Joi = require('joi');

const addPosition = {
    body: Joi.object().keys({
        amount: Joi.number().required(),
        range: Joi.number().required(),
    })
};

const getTokenId = {
    params: Joi.object().keys({
        txHash: Joi.string().required()
    })
};

const getAllocation = {
    params: Joi.object().keys({
        tokenId: Joi.string().required()
    })
};

const getRewards = getAllocation;

const exitPosition = {
    body: Joi.object().keys({
        tokenId: Joi.number().required(),
    })
};

const subscribePriceChange = {
    body: Joi.object().keys({
        pair: Joi.string().required(),
        fee: Joi.number().required(),
    })
};

module.exports = {
    addPosition,
    getTokenId,
    getAllocation,
    getRewards,
    subscribePriceChange,
    exitPosition
}
