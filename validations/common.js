const Joi = require('joi');
const { BLOCKCHAIN } = require('../constants/index');

const platforms = ['web', 'android', 'ios'];

const tokenValidation = Joi.string().min(34).max(34).messages({
    "string.min": "check token",
    "string.max": "check token",
}).required();
const tokenOptionalValidation = Joi.string().min(34).max(34).messages({
    "string.min": "check token",
    "string.max": "check token",
}).allow('').optional();
const platformValidation = Joi.string().valid(...platforms).required();
const blockchainValidation = Joi.string().valid(...Object.keys(BLOCKCHAIN)).only().messages({
    "any.only": "check blockchain"
}).required();
const blockchainOptionalValidation = Joi.string().valid(...Object.keys(BLOCKCHAIN)).only().messages({
    "any.only": "check blockchain"
}).allow('').optional();
const csWalletAddressValidation = Joi.string().required();
const csWalletAddressOptionalValidation = Joi.string().allow('').optional()
const bitcoinWalletAddressValidation = Joi.string().min(10).max(200).messages({
    "string.min": "check address",
    "string.max": "check address",
}).required()
const bitcoinWalletAddressOptionalValidation = Joi.string().min(10).max(200).messages({
    "string.min": "check address",
    "string.max": "check address",
}).allow('').optional()
const appUserValidation = Joi.string()
    .when(
        'token',
        {
            is: Joi.string().exist(),
            then: Joi.string().allow(''),
            otherwise: Joi.string().required()
        }
    )

const defaultHeaders = {
    headers: Joi.object().keys({
        token: tokenValidation,
        platform: platformValidation,
        blockchain: blockchainValidation,
    }).unknown(true),
}

module.exports = {
    defaultHeaders,
    tokenValidation,
    platformValidation,
    blockchainValidation,
    csWalletAddressValidation,
    blockchainOptionalValidation,
    csWalletAddressOptionalValidation,
    bitcoinWalletAddressValidation,
    bitcoinWalletAddressOptionalValidation,
    tokenOptionalValidation,
    appUserValidation
}
