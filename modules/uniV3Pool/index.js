const { getCoinsByPair, tryParseTick, _tryParsePrice} = require("../../routes/uniswapV3/uniV3Functions");
const { getPoolContract, getAmountsByCoin } = require('../web3/index');

const { Token } = require("@uniswap/sdk-core");
const { tickToPrice } = require("@uniswap/v3-sdk");
const BadRequestException = require("../../exceptions/bad-request.exception");
const {createPoolMint, getCollectFee, getLPEarnedFee, getPositionContract, getBalance, restakeFees,
    decreaseLiquidityPool
} = require("../web3");
const {getAmountsForLiquidity} = require("./uniV3Functions");
const {BLOCKCHAIN} = require("./constants");
const chain = 1;
const fee = 3000;
const pair = "eth_usdc";

async function addPosition(amount, range) {
    return { txHash: '0x4334956509d228089f8b0d0f424543e9a581b877d51843cecbe44a5f667b2743' };
    const { coin0, coin1 } = getCoinsByPair(pair, amount, 0);
    const poolContract = await getPoolContract(coin0, coin1, fee);
    const slot = await poolContract.methods.slot0().call();

    const token0 = new Token(chain, coin0.address, coin0.decimals);
    const token1 = new Token(chain, coin1.address, coin1.decimals);
    const price = tickToPrice(token1, token0, Number(slot.tick));
    const currentPrice = Number(price.toSignificant(5));

    const percentage = calculatePercentage(currentPrice, range);
    const minPrice = currentPrice - percentage;
    const maxPrice = currentPrice + percentage;
    const pairAmount = await getUniV3PoolPairAmount(coin1, coin0, fee, minPrice, maxPrice);
    coin1.amount = pairAmount.amountA || pairAmount.amountB;
        const walletAddress = '0x549991ee1bDcB5c2003158D461D45B17d3603d8d';
    const gasPrice = 2;

    const mint = getUniV3PoolMint(walletAddress, coin0, coin1, fee, gasPrice, minPrice, maxPrice, false, false, 'defi');
    return mint;
}

async function getTokenId(txHash) {
    return { tokenId: 1518 }
}

async function getAllocation(tokenId) {
    return { amount1: 40.9, amount2: 1.16 };
    const { coin0, coin1 } = getCoinsByPair(pair);

    const token0 = new Token(chain, coin0.address, coin0.decimals);
    const token1 = new Token(chain, coin1.address, coin1.decimals);
    const position = await getPositionContract(coin0, coin1, fee, tokenId);
    const poolContract = await getPoolContract(coin0, coin1, fee);
    const slot = await poolContract.methods.slot0().call();
    return getAmountsByCoin(coin0, coin1, token0, token1, fee, Number(position.tickLower), Number(position.tickUpper), slot.tick, position.liquidity);
}


async function getRewards(tokenId) {
    return { amount1: 0.9854, amount2: 1.01 };
    const { coin0, coin1 } = getCoinsByPair(pair);
    const walletAddress = '0x549991ee1bDcB5c2003158D461D45B17d3603d8d';
    const feeData = await getLPEarnedFee(walletAddress, coin0, coin1, tokenId);
    return feeData;
}

async function subscribePriceChange() {
    const { coin0, coin1 } = getCoinsByPair(pair, amount, 0);
    const price = _tryParsePrice(coin0, coin1, amount);
    console.log(price, 3333)
    // const pairAmount = getUniV3PoolPairAmount(coin0, coin1, fee, minPrice, maxPrice);
    // const walletAddress = '';
    //
    // const mint = getUniV3PoolMint(walletAddress, coin0, coin1, fee, gasPrice, minPrice, maxPrice, max0, max1, TRANSACTION_FLOW_TYPES.DEFI)
}

async function exitPosition(tokenId) {
    return { success: true };
    const walletAddress = '0x549991ee1bDcB5c2003158D461D45B17d3603d8d';
    const { coin0, coin1 } = getCoinsByPair(pair);
    const data = decreaseLiquidityPool(walletAddress, coin0, coin1, tokenId, 2, 100, 'defi');
    return data;
}

async function getWalletBalance() {
    return { ETH: 0.528651627171890991 };
    const walletAddress = '0x549991ee1bDcB5c2003158D461D45B17d3603d8d';
    const balance = getBalance(walletAddress, BLOCKCHAIN.ethereum);
    return balance;
}

function getUniV3PoolPairAmount(coin0, coin1, fee, minPrice, maxPrice) {
    const token0 = new Token(chain, coin0.address, coin0.decimals);
    const token1 = new Token(chain, coin1.address, coin1.decimals);

    return getLPPairAmount(coin0, coin1, fee, minPrice, maxPrice, token0, token1);
}

function getUniV3PoolMint(walletAddress, coin0, coin1, fee, gasPrice, minPrice, maxPrice, max0, max1, type) {
    if (!coin0.address || !coin0.amount || !coin0.decimals || !coin1.address || !coin1.amount || !coin1.decimals || !gasPrice) {
        throw new BadRequestException('Coins data are invalid');
    }

    const token0 = new Token(chain, coin0.address, coin0.decimals);
    const token1 = new Token(chain, coin1.address, coin1.decimals);

    const tickLower = tryParseTick(token0, token1, fee, minPrice);
    const tickUpper = tryParseTick(token0, token1, fee, maxPrice);

    return createPoolMint(walletAddress, coin0, coin1, fee, tickLower, tickUpper, gasPrice, max0, max1, type);
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

function calculatePercentage(currentPrice, range) {
    return currentPrice * range / 100;
}

module.exports = {
    addPosition,
    getTokenId,
    getAllocation,
    getRewards,
    subscribePriceChange,
    exitPosition,
    getWalletBalance
}
