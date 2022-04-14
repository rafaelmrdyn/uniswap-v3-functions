const Web3 = require('web3');
const { utils } = require('ethers');
const {
    BLOCKCHAIN,
    NATIVE_COINS_SYMBOLS,
    UNISWAP_V3_POOL_POSITION_MANAGER_CONTRACT,
    TRANSACTION_FLOW_TYPES
} = require('../uniV3Pool/constants');

const {
    tryParseTick,
    getAmountsForLiquidity,
    getLiquidityByPercent,
    getLiquidityForAmount0,
    getLiquidityForAmount1
} = require('../uniV3Pool/uniV3Functions');
const { tickToPrice } = require('@uniswap/v3-sdk');
const { Token } = require("@uniswap/sdk-core");

const ethRpcURL = `https://kovan.infura.io/v3/7472d9d5f526415190bd2acee60c92d2`;
const bscRpcURL = 'https://bsc-dataseed.binance.org';
const polygonRpcURL = 'https://rpc-mainnet.maticvigil.com';
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const ABI = require('./erc20ABI.json');

const uniV3ABI = require('../uniV3Pool/abis/uniswapV3ABI.json');
const poolABI = require('../uniV3Pool/abis/poolABI.json');
const factoryABI = require('../uniV3Pool/abis/factoryABI.json');
const positionManagerAddress = UNISWAP_V3_POOL_POSITION_MANAGER_CONTRACT;
const BadRequestException = require("../../exceptions/bad-request.exception");

/**
 * Get rpc url of blockchain
 * @param {String} blockchain - The blockchain name for accessing provider
 * @returns {String} The rpc url
 */
function getRpcUrlByBlockchain(blockchain) {
    if (blockchain === 'ethereum') {
        return ethRpcURL;
    }
    if (blockchain === 'binance') {
        return bscRpcURL;
    }
    if (blockchain === 'polygon') {
        return polygonRpcURL;
    }
    throw Error("Blockchain not supported")
}

/**
 * Get balance of erc20 token without dividing by decimals
 * @param {String} walletAddress - The wallet address
 * @param {String} tokenAddress - The smart contract address of token
 * @param {String} blockchain - The blockchain name for accessing provider
 * @returns {String} The token balance of wallet without divide by decimals
 */
async function getFullBalanceOfToken(walletAddress, tokenAddress, blockchain) {
    const minABI = [
        // balanceOf
        {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint8" }],
            "type": "function"
        }
    ];
    const rpcURL = getRpcUrlByBlockchain(blockchain);
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(minABI, tokenAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    return balance;
}

/**
 * Get if coin approved
 * @param {String} walletAddress - The wallet address
 * @param {String} tokenAddress - The smart contract address of token
 * @param {String} providerAddress - The provider address
 * @param {String} blockchain - The blockchain name for accessing provider
 * @return {String} The number of approval token
 */
async function getCoinApproval(walletAddress, tokenAddress, providerAddress, blockchain) {
    const minABI = [
        {
            "name": "allowance",
            "outputs": [
                {
                    "type": "uint256",
                    "name": ""
                }
            ],
            "inputs": [
                {
                    "type": "address",
                    "name": "arg0"
                },
                {
                    "type": "address",
                    "name": "arg1"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
    ];

    const rpcURL = getRpcUrlByBlockchain(blockchain);
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(minABI, tokenAddress);

    const approvalAmount = await contract.methods.allowance(walletAddress, providerAddress).call();
    return approvalAmount;
}

/**
 * Get decimals of erc20 token
 * @param {String} tokenAddress - The smart contract address of token
 * @param {String} blockchain - The blockchain name for accessing provider
 * @returns {Number} The decimals of token
 */
async function getDecimalsOfToken(tokenAddress, blockchain) {
    if (tokenAddress === ETH_ADDRESS) return 18;
    const minABI = [
        // decimals
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint8" }],
            "type": "function"
        }
    ];
    const rpcURL = getRpcUrlByBlockchain(blockchain);
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(minABI, tokenAddress);
    const decimals = await contract.methods.decimals().call();
    return Number(decimals);
}

/**
 * Get transaction status
 * @param {String} txHash - The hash of transaction
 * @param {String} blockchain - The blockchain name for accessing provider
 * @returns {Number} The status of transaction
 */
async function getTxStatus(txHash, blockchain) {
    // return -1 if pending, 0 === error, 1 === success
    const rpcURL = getRpcUrlByBlockchain(blockchain);
    const web3 = new Web3(rpcURL);
    const tx = await web3.eth.getTransactionReceipt(txHash);
    if (!tx) return -1;
    if (tx.status) return 1;
    return 0;
}

/**
 * Get token approve data
 * @param {String} walletAddress - The wallet address
 * @param {String} tokenAddress - The smart contract address of token
 * @param {Number} gasPrice- The gas price
 * @param {String} type - the transaction type
 * @param {String} toApproveAddress - the contract provider address
 * @param {String} blockchain - The blockchain name for accessing provider
 * @return {Object} The approve data of transaction
 */
async function getApproveData(walletAddress, tokenAddress, gasPrice, type, toApproveAddress, blockchain) {
    const rpcURL = getRpcUrlByBlockchain(blockchain);
    const web3 = new Web3(rpcURL);
    const maxNumber = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

    const contract = new web3.eth.Contract(ABI, tokenAddress);
    const gasLimit = await contract.methods.approve(toApproveAddress, maxNumber).estimateGas({ from: walletAddress });
    const gas = gasLimit + gasLimit * 25 / 100;

    await checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice);
    const data = await contract.methods.approve(toApproveAddress, maxNumber).encodeABI();

    const txRaw = {
        from: walletAddress,
        to: tokenAddress,
        value: 0,
        data,
        gas,
        gasPrice
    };

    return wrappedTransaction(txRaw, type);
}

/**
 * Create Uni V3 LP Mint
 * @param {String} walletAddress - The wallet address
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} fee - The fee amount of LP
 * @param {Number} tickLower - The lower tick of LP
 * @param {Number} tickUpper - The upper tick of LP
 * @param {Number} gasPrice - The gas price
 * @param {Boolean} max0 - The max0 amount of coins
 * @param {Boolean} max1 - The max1 amount of coins
 * @param {String} type - the transaction type
 * @return {Object} The mint data of transaction
 */
async function createPoolMint(walletAddress, coin0, coin1, fee, tickLower, tickUpper, gasPrice, max0, max1, type) {
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const expiryDate = Math.floor(Date.now() / 1000) + 900000;
    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));

    await getMaxAmountOfCoins(coin0, coin1, max0, max1, walletAddress);

    let value = 0;
    const ethCoin = coin0.isEth ? coin0 : coin1.isEth ? coin1 : null;

    if (ethCoin) {
        value = ethCoin.amount;
    }

    let gasLimit = await contract.methods.mint([
        coin0.address, coin1.address, fee, tickLower, tickUpper, coin0.amount, coin1.amount, 0, 0, walletAddress, expiryDate
    ]).estimateGas({ from: walletAddress, value });

    let data = await contract.methods.mint([
        coin0.address, coin1.address, fee, tickLower, tickUpper, coin0.amount, coin1.amount, 0, 0, walletAddress, expiryDate
    ]).encodeABI();

    // checking eth case for refundETH method and tx value
    if (ethCoin) {
        // add refundETH with multicall
        const refundETHData = await contract.methods.refundETH().encodeABI();
        gasLimit = await contract.methods.multicall([data, refundETHData]).estimateGas({ from: walletAddress, value });
        data = await contract.methods.multicall([data, refundETHData]).encodeABI();
    }

    const gas = gasLimit + gasLimit * 10 / 100;

    await checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice);
    await checkIfEnoughBalanceAndApproval([coin0, coin1], walletAddress, positionManagerAddress);

    const txRaw = {
        from: walletAddress,
        to: positionManagerAddress,
        value,
        data,
        gasPrice,
        gas
    }

    return wrappedTransaction(txRaw, type);
}

/**
 * Get collected fee of current LP
 * @param {String} walletAddress - The wallet address
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} tokenId - The tokenId of LP
 * @param {Number} gasPrice - The gas price
 * @param {String} type - the transaction type
 * @return {Object} The collected fee data of transaction
 */
async function getCollectFee(walletAddress, coin0, coin1, tokenId, gasPrice, type) {
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const minAmount = '340282366920938463463374607431768211455';
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));

    let data = await contract.methods.collect([tokenId, walletAddress, minAmount, minAmount]).encodeABI();
    let gasLimit = await contract.methods.collect([tokenId, walletAddress, minAmount, minAmount]).estimateGas({ from: walletAddress });

    const ethCoin = coin0.isEth ? coin0 : coin1.isEth ? coin1 : null;

    if (ethCoin) {
        const unwrapWETH9Data = await contract.methods.unwrapWETH9('0', walletAddress).encodeABI();
        const notEthCoin = !coin0.isEth ? coin0 : !coin1.isEth ? coin1 : null;
        const sweepToken = await contract.methods.sweepToken(notEthCoin.address, '0', walletAddress).encodeABI();
        data = await contract.methods.collect([tokenId, zeroAddress, minAmount, minAmount]).encodeABI();
        gasLimit = await contract.methods.multicall([data, unwrapWETH9Data, sweepToken]).estimateGas({ from: walletAddress });
        data = await contract.methods.multicall([data, unwrapWETH9Data, sweepToken]).encodeABI();
    }

    const gas = gasLimit + gasLimit * 10 / 100;

    await checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice);

    const txRaw = {
        from: walletAddress,
        to: positionManagerAddress,
        value: 0,
        data,
        gasPrice,
        gas
    }

    return wrappedTransaction(txRaw, type);
}

/**
 * Decrease current LP by percent
 * @param {String} walletAddress - The wallet address
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} tokenId - The tokenId of LP
 * @param {Number} gasPrice - The gas price
 * @param {Number} percent - The amount of percent to decrease LP
 * @param {String} type - the transaction type
 * @return {Object} The decreased data of transaction
 */
async function decreaseLiquidityPool(walletAddress, coin0, coin1, tokenId, gasPrice, percent, type) {
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const minAmount = '340282366920938463463374607431768211455';
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));
    const positionData = await contract.methods.positions(tokenId).call();

    const liquidity = getLiquidityByPercent(positionData.liquidity, percent);
    const expiryDate = Math.floor(Date.now() / 1000) + 900000;

    let data;

    const decreaseLiquidityData = await contract.methods.decreaseLiquidity([tokenId, liquidity, '0', '0', expiryDate]).encodeABI();
    const collectData = await contract.methods.collect([tokenId, walletAddress, minAmount, minAmount]).encodeABI();
    let gasLimit = await contract.methods.multicall([decreaseLiquidityData, collectData]).estimateGas({ from: walletAddress });

    data = await contract.methods.multicall([decreaseLiquidityData, collectData]).encodeABI();

    const ethCoin = coin0.isEth ? coin0 : coin1.isEth ? coin1 : null;

    if (ethCoin) {
        const notEthCoin = !coin0.isEth ? coin0 : !coin1.isEth ? coin1 : null;
        const sweepToken = await contract.methods.sweepToken(notEthCoin.address, '0', walletAddress).encodeABI();
        data = await contract.methods.collect([tokenId, zeroAddress, minAmount, minAmount]).encodeABI();
        const unwrapWETH9Data = await contract.methods.unwrapWETH9('0', walletAddress).encodeABI();
        gasLimit = await contract.methods.multicall([decreaseLiquidityData, collectData, unwrapWETH9Data, sweepToken]).estimateGas({ from: walletAddress });
        data = await contract.methods.multicall([decreaseLiquidityData, collectData, unwrapWETH9Data, sweepToken]).encodeABI();
    }

    const gas = gasLimit + gasLimit * 10 / 100;

    await checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice);

    const txRaw = {
        from: walletAddress,
        to: positionManagerAddress,
        value: 0,
        data,
        gasPrice,
        gas
    }

    return wrappedTransaction(txRaw, type);
}

/**
 * Increase current Lp
 * @param {String} walletAddress - The wallet address
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} tokenId - The tokenId of LP
 * @param {Number} gasPrice - The gas price
 * @param {Boolean} max0 - The max0 amount of coins
 * @param {Boolean} max1 - The max1 amount of coins
 * @param {String} type - the transaction type
 * @return {Object} The increased data of transaction
 */
async function increaseLiquidityPool(walletAddress, coin0, coin1, tokenId, gasPrice, max0, max1, type) {
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));
    const expiryDate = Math.floor(Date.now() / 1000) + 900000;

    await getMaxAmountOfCoins(coin0, coin1, max0, max1, walletAddress);

    let value = 0;

    let data = await contract.methods.increaseLiquidity([tokenId, coin0.amount, coin1.amount, '0', '0', expiryDate]).encodeABI();
    let gasLimit = await contract.methods.increaseLiquidity([tokenId, coin0.amount, coin1.amount, '0', '0', expiryDate]).estimateGas({ from: walletAddress, value });

    const ethCoin = coin0.isEth ? coin0 : coin1.isEth ? coin1 : null;

    if (ethCoin) {
        value = ethCoin.amount;
        const refundETHData = await contract.methods.refundETH().encodeABI();

        gasLimit = await contract.methods.multicall([data, refundETHData]).estimateGas({ from: walletAddress, value });
        data = await contract.methods.multicall([data, refundETHData]).encodeABI();
    }

    const gas = gasLimit + gasLimit * 25 / 100;

    await checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice);
    await checkIfEnoughBalanceAndApproval([coin0, coin1], walletAddress, positionManagerAddress);

    const txRaw = {
        from: walletAddress,
        to: positionManagerAddress,
        value,
        data,
        gasPrice,
        gas
    }

    return wrappedTransaction(txRaw, type);
}

/**
 * Get earned fee current LP
 * @param {String} walletAddress - The wallet address
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} tokenId - The tokenId of LP
 * @return {Object} The earned fee data
 */
async function getLPEarnedFee(walletAddress, coin0, coin1, tokenId) {
    return { amount1: 0.9854, amount2: 1.01 };
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const minAmount = '340282366920938463463374607431768211455';
    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));

    const collectData = await contract.methods.collect([tokenId, walletAddress, minAmount, minAmount]).call();

    return { feeData: collectData, coin0, coin1 };
}

/**
 * Get LP pair amount
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} fee - The fee amount of LP
 * @param {Number} minPrice - The min price of current LP
 * @param {Number} maxPrice - The max price of current LP
 * @param {Token} token0 - The object of token0
 * @param {Token} token1 - The object of token1
 * @return {Object} The pair amount data
 */
async function getLPPairAmount(coin0, coin1, fee, minPrice, maxPrice, token0, token1) {
    const poolContract = await getPoolContract(coin0, coin1, fee);
    const slot = await poolContract.methods.slot0().call();

    const tickLower = tryParseTick(token0, token1, fee, minPrice);
    const tickUpper = tryParseTick(token0, token1, fee, maxPrice);

    const [amount0, amount1] = getAmountsByCoin(coin0, coin1, token0, token1, fee, tickLower, tickUpper, slot.tick);
    let amountA, amountB;

    if (coin0.amount) {
        amountB = 1 / amount0 * amount1 * coin0.amount;
    } else if (coin1.amount) {
        amountA =  1 / amount1 * amount0 * coin1.amount;
    }

    const data = {
        amountA,
        amountB
    }

    return data;
}

/**
 * Restake current LP
 * @param {String} walletAddress - The wallet address
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} tokenId - The tokenId of LP
 * @param {Number} gasPrice - The gas price
 * @param {Token} token0 - The object of token0
 * @param {Token} token1 - The object of token1
 * @param {String} type - the transaction type
 * @return {Object} The restaked data of transaction
 */
async function restakeFees(walletAddress, coin0, coin1, tokenId, gasPrice, token0, token1, type) {
    const { feeData } = await getLPEarnedFee(walletAddress, coin0, coin1, tokenId);

    coin0.amount = feeData.amount0;
    coin1.amount = feeData.amount1;
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const minAmount = '340282366920938463463374607431768211455';
    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));
    const expiryDate = Math.floor(Date.now() / 1000) + 900000;

    const positionData = await contract.methods.positions(tokenId).call();
    const poolContract = await getPoolContract(coin0, coin1, positionData.fee);
    const slot = await poolContract.methods.slot0().call();

    const [, amount1] = getAmountsByCoin(coin0, coin1, token0, token1, positionData.fee, Number(positionData.tickLower), Number(positionData.tickUpper), slot.tick);

    //@TODO Save in DB remindedBalance
    let remindedBalance;
    const fee0 = coin0.amount * amount1;
    const fee1 = coin1.amount / amount1;

    if (fee0 < coin1.amount) {
        const remindedBalance = coin1.amount - fee0;
    } else if (fee1 > coin1.amount) {
        const remindedBalance = coin0.amount - fee1;
    }

    const collectData = await contract.methods.collect([tokenId, walletAddress, minAmount, minAmount]).encodeABI();
    const increaseData = await contract.methods.increaseLiquidity([tokenId, coin0.amount, coin1.amount, '0', '0', expiryDate]).encodeABI();

    let gasLimit = await contract.methods.multicall([collectData, increaseData]).estimateGas({ from: walletAddress });
    let data = await contract.methods.multicall([collectData, increaseData]).encodeABI();

    const ethCoin = coin0.isEth ? coin0 : coin1.isEth ? coin1 : null;

    if (ethCoin) {
        const unwrapWETH9Data = await contract.methods.unwrapWETH9('0', walletAddress).encodeABI();
        gasLimit = await contract.methods.multicall([collectData, increaseData, unwrapWETH9Data]).estimateGas({ from: walletAddress });
        data = await contract.methods.multicall([collectData, increaseData, unwrapWETH9Data]).encodeABI();
    }
    const gas = gasLimit + gasLimit * 10 / 100;

    await checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice);

    const txRaw = {
        from: walletAddress,
        to: positionManagerAddress,
        value: 0,
        data,
        gasPrice,
        gas
    }

    return wrappedTransaction(txRaw, type);
}

/**
 * Get pool contract
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} fee - The fee amount of LP
 * @return {Promise} Promise object represents pool contract data
 */
async function getPoolContract(coin0, coin1, fee) {
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));
    const factoryAddress = await contract.methods.factory().call();
    const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);
    const poolAddress = await factoryContract.methods.getPool(coin0.address, coin1.address, fee).call();

    console.log(positionManagerAddress, factoryAddress)
    const poolContract = new web3.eth.Contract(poolABI, poolAddress);

    return poolContract;
}

/**
 * Get position contract
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} fee - The fee amount of LP
 * @return {Promise} Promise object represents position contract data
 */
async function getPositionContract(coin0, coin1, fee, tokenId) {
    const rpcURL = getRpcUrlByBlockchain(BLOCKCHAIN.ethereum);
    const web3 = new Web3(rpcURL);

    const contract = new web3.eth.Contract(uniV3ABI, Web3.utils.toChecksumAddress(positionManagerAddress));
    const positionData = await contract.methods.positions(tokenId).call();
    return positionData;
}


/**
 * Check if has enough balance for fee
 * @param {String} walletAddress - The wallet address
 * @param {Number} gasLimit - The gas limit
 * @param {Number} gasPrice - The gas price
 * @return {Error} The error represents when balance is small than fee
 */
async function checkIfEnoughBalanceForFee(walletAddress, gasLimit, gasPrice) {
    const balance = await getBalance(walletAddress, BLOCKCHAIN.ethereum);
    const feeAmount = gasLimit * gasPrice;

    if (Number(balance) < Number(feeAmount)) {
        throw new BadRequestException(`There is not enough ${NATIVE_COINS_SYMBOLS[BLOCKCHAIN.ethereum]} for gas fee.`);
    }
}

/**
 * Check if has enough balance and approval
 * @param {Array} coins - The array of coin
 * @param {String} walletAddress - The wallet address
 * @param {String} providerAddress - The provider address
 * @return {Error} - The error represents when balance is small than fee
 */
async function checkIfEnoughBalanceAndApproval(coins, walletAddress, providerAddress) {
    let balance;

    for (const coin of coins) {
        if (coin.isEth) {
            balance = await getBalance(walletAddress, BLOCKCHAIN.ethereum);
        } else {
            balance = await getFullBalanceOfToken(walletAddress, coin.address, BLOCKCHAIN.ethereum);
            const approval = getCoinApproval(walletAddress, coin.address, providerAddress, BLOCKCHAIN.ethereum);

            if (Number(approval) < Number(coin.amount)) {
                throw new BadRequestException('Not enough allowance.');
            }
        }

        if (Number(balance) < Number(coin.amount)) {
            throw new BadRequestException(`Not enough ${coin.symbol}.`);
        }
    }
}

/**
 * Get balance of native token
 * @param {String} walletAddress - The wallet address
 * @param {String} blockchain - The blockchain name for accessing provider
 * @returns {String} The balance of wallet
 */
async function getBalance(walletAddress, blockchain) {
    const rpcURL = getRpcUrlByBlockchain(blockchain);
    const web3 = new Web3(rpcURL);
    const balance = await web3.eth.getBalance(walletAddress);

    return balance;
}

/**
 * Parse unit
 * @param {Number} amount - Amount
 * @param {Number} decimals - Decimal
 * @return {String} The parsed string
 */
function parseUnits(amount, decimals) {
    try {
        let num = String(amount);

        if (num.includes('e-')) {
            //in case of big num
            num = Number(num).toFixed(decimals);
        }

        return String(utils.parseUnits(num, decimals));
    } catch(e) {
        throw Error(`Cannot parse amount-${amount} decimals-${decimals}`);
    }
}

/**
 * Sort coin places
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Number} fee - The fee amount of LP
 * @return {Object} The sorted coins object
 */
async function sortCoinsPlaces(coin0, coin1, fee) {
    const poolContract = await getPoolContract(coin0, coin1, fee);
    const token0 = await poolContract.methods.token0().call();
    const token1 = await poolContract.methods.token1().call();


    let coinA;
    let coinB;

    if (token0.toLowerCase() === coin0.address.toLowerCase()) {
        coinA = coin0
        coinB = coin1
    } else {
        coinA = coin1
        coinB = coin0
    }

    return { coinA, coinB };
}

/**
 * Get amounts by coin
 * @param {Object} coin0 - The coin0 object
 * @param {Object} coin1 - The coin1 object
 * @param {Token} token0 - The object of token0
 * @param {Token} token1 - The object of token1
 * @param {Number} fee - The fee amount of LP
 * @param {Number} tickLower - The lower tick of LP
 * @param {Number} tickUpper - The lower tick of LP
 * @param {String} currentTick - The current tick
 * @param {Number} currentLiquidity - The current liquidity
 * @return {Array} The array of coins amount
 */
function getAmountsByCoin(coin0, coin1, token0, token1, fee, tickLower, tickUpper, currentTick, currentLiquidity) {
    const coin0Price = tickToPrice(token1, token0, tickLower).toSignificant(6);
    const coin1Price = tickToPrice(token1, token0, tickUpper).toSignificant(6);
    const sqrtRatioAX96 = Math.sqrt(Number(coin0Price));
    const sqrtRatioBX96 = Math.sqrt(Number(coin1Price));
    const currentPrice = tickToPrice(token1, token0, Number(currentTick)).toSignificant(6);
    const sqrtRatioX96 =  Math.sqrt(Number(currentPrice));

    let liquidity;
    if (currentLiquidity) {
        liquidity = currentLiquidity;
    }else if (coin0.amount) {
        liquidity = getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, 1);
    } else if(coin1.amount) {
        liquidity = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, 1);
    }
    const [amountA, amountB] = getAmountsForLiquidity(Number(sqrtRatioX96), sqrtRatioAX96, sqrtRatioBX96, liquidity);
    const decimal = (coin0.decimals + coin1.decimals) / 2;
    const amount1 = amountA / (10 ** decimal);
    const amount2 = amountB / (10 ** decimal);
    return [amount1, amount2];
}

async function getMaxAmountOfCoins(coin0, coin1, max0, max1, walletAddress) {
    if (max0) {
        if (coin0.isEth) {
            coin0.amount = await getBalance(walletAddress, BLOCKCHAIN.ethereum);
        } else {
            coin0.amount = await getFullBalanceOfToken(walletAddress, coin0.address, BLOCKCHAIN.ethereum);
        }
    } else {
        coin0.amount = parseUnits(coin0.amount, coin0.decimals);
    }

    if (max1) {
        if (coin1.isEth) {
            coin1.amount = await getBalance(walletAddress, BLOCKCHAIN.ethereum);
        } else {
            coin1.amount = await getFullBalanceOfToken(walletAddress, coin1.address, BLOCKCHAIN.ethereum);
        }
    } else {
        coin1.amount = parseUnits(coin1.amount, coin1.decimals);
    }
}

/**
 * Convert number to hex
 * @param {Number} num - The number
 * @return {string} - The converted type
 */
function numberToHexadecimal(num) {
    return '0x' + num.toString(16);
}

/**
 * Convert number to hex
 * @param {Object} txRaw - The Transaction object
 * @param {String} type - The transaction type
 * @return {Object}  The object of transaction
 */
function wrappedTransaction(txRaw, type) {
    if (type === TRANSACTION_FLOW_TYPES.DEFI) {
        txRaw.value = numberToHexadecimal(Number(txRaw.value));
        txRaw.gas = numberToHexadecimal(Math.round(Number(txRaw.gas)));
        txRaw.gasPrice = numberToHexadecimal(Number(txRaw.gasPrice));
    }

    return txRaw;
}

module.exports = {
    getDecimalsOfToken,
    parseUnits,
    getTxStatus,
    getFullBalanceOfToken,
    getApproveData,
    createPoolMint,
    getCollectFee,
    decreaseLiquidityPool,
    increaseLiquidityPool,
    getLPEarnedFee,
    getLPPairAmount,
    restakeFees,
    getPoolContract,
    getPositionContract,
    getAmountsByCoin,
    getBalance,
}
