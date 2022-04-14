module.exports = {
    BLOCKCHAIN: {
        ethereum: 'ethereum',
        binance: 'binance',
        polygon: 'polygon'
    },
    NATIVE_TOKENS: {
        ethereum: 'ethereum',
        binance: 'binance-coin',
        polygon: 'matic-network'
    },
    CONTRACT_NAME: {
        ethereum: 'ethereum',
        binance: 'binance_smart',
        polygon: 'polygon-pos'
    },
    STATUS_TYPES: {
        success: 'success',
        pending: 'pending',
        error: 'error'
    },
    TRANSACTION_TYPES: {
        approve: 'approve',
        swap: 'swap',
        send: 'send'
    },
    EXPLORER_URL: {
        ethereum: 'https://etherscan.io/tx/',
        binance: 'https://bscscan.com/tx/',
        polygon: 'https://polygonscan.com/tx/'
    },
    FEE_PERCENT: 0,
    WALLET_FOR_FEE: '0xfd4fd7e00f9Ebd266F3c9214A60Ecd90Fa9555f6',
    CURRENT_PROVIDER_CONTRACT: '0x111111125434b319222cdbf8c261674adb56f3ae',
    ONE_INCH_NATIVE_CONTRACT: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    ETH_DECIMALS: 18,
    GWEI_DECIMALS: 9,
    ONE_INCH_API: {
        ethereum: 'https://coinstats.api.enterprise.1inch.exchange/v3.0/1',
        binance: 'https://coinstats.api.enterprise.1inch.exchange/v3.0/56',
        polygon: 'https://coinstats.api.enterprise.1inch.exchange/v3.0/137'
    },
    ETHERSCAN_API: 'https://api.etherscan.io/api',
    EXPLORER_API_URL: {
        ethereum: 'https://api.etherscan.io/api',
        binance: 'https://api.bscscan.com/api',
        polygon: 'https://api.polygonscan.com/api',
    },
    UNISWAP_V3_POOL_POSITION_MANAGER_CONTRACT: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    TRANSACTION_FLOW_TYPES: {
        DEFI_SWAP: 'defi_swap',
        UNI_V3_POOL: 'pool',
        DEFI: 'defi'
    },
    NATIVE_COINS_SYMBOLS : {
        ethereum: 'ETH',
        binance: 'BNB',
        polygon: 'MATIC'
    },
    TRANSACTION_METHODS: {
        UNI_V3_APPROVE: 'uni_v3_approve',
        UNI_V3_MINT: 'uni_v3_mint',
        UNI_V3_COLLECT_FEE: 'uni_v3_collect_fee',
        UNI_V3_DECREASE_LP: 'uni_v3_decrease_lp',
        UNI_V3_INCREASE_LP: 'uni_v3_increase_lp',
        UNI_V3_RESTAKE_FEE: 'uni_v3_restake_fee',
    }
}
