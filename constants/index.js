module.exports = {
    BLOCKCHAIN: {
        ethereum: 'ethereum',
        binance: 'binance',
        bitcoin: 'bitcoin',
        polygon: 'polygon'
    },
    STATUS_TYPES: {
        success: 'success',
        pending: 'pending',
        error: 'error'
    },
    CS_WALLET_TRANSACTION_TYPES: {
        ETH_SWAP: 'ETH_SWAP',
        NATIVE_TOKEN_SEND: 'NATIVE_TOKEN_SEND',
        FUNGIBLE_TOKEN_SEND: 'FUNGIBLE_TOKEN_SEND',
        NON_FUNGIBLE_TOKEN_SEND: 'NON_FUNGIBLE_TOKEN_SEND'
    },
    NATIVE_TOKENS: {
        ethereum: 'ethereum',
        binance: 'binance-coin',
        bitcoin: 'bitcoin',
        polygon: 'matic-network'
    },
    CONTRACT_NAME: {
        ethereum: 'ethereum',
        binance: 'binance_smart',
        polygon: 'polygon-pos'
    },
    ARKANE_BLOCKCHAIN: {
        ethereum: 'ETHEREUM',
        binance: 'BSC',
        bitcoin: 'BITCOIN',
        polygon: 'MATIC'
    },
    ARKANE_BLOCKCHAIN_REVERSE: {
        ETHEREUM: 'ethereum',
        BSC: 'binance',
        BITCOIN: 'bitcoin',
        MATIC: 'polygon'
    },
    TRANSACTION_TYPES: {
        approve: 'approve',
        swap: 'swap',
        send: 'send'
    },
    ResponseCodes: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        EMAIL_IS_ALREADY_REGISTERED: 409,
        EMAIL_IS_ALREADY_REGISTERED_WITH_SOCIAL: 409
    },
}
