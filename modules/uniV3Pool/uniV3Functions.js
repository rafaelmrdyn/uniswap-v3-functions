const JSBI = require('jsbi');
const {
    Price
} = require('@uniswap/sdk-core');
const {
    priceToClosestTick,
    encodeSqrtRatioX96,
    nearestUsableTick,
    TickMath,
    TICK_SPACINGS
} = require('@uniswap/v3-sdk');

const poolPairModels = require('./model');

const Q96 = 1;

function tryParseTick(baseToken, quoteToken, feeAmount, value) {
    if (!baseToken || !quoteToken || !feeAmount || !value) {
        return;
    }

    const price = _tryParsePrice(baseToken, quoteToken, value);

    if (!price) {
        return;
    }

    let tick;

    // check price is within min/max bounds, if outside return min/max
    const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator);

    if (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)) {
        tick = TickMath.MAX_TICK
    } else if (JSBI.lessThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO)) {
        tick = TickMath.MIN_TICK
    } else {
        // this function is agnostic to the base, will always return the correct tick
        tick = priceToClosestTick(price);
    }

    return nearestUsableTick(tick, TICK_SPACINGS[feeAmount]);
}

function _tryParsePrice(baseToken, quoteToken, value) {
    if (!baseToken || !quoteToken || !value) {
        return;
    }

    if (!String(value).match(/^\d*\.?\d+$/)) {
        return;
    }

    const [whole, fraction] = String(value).split('.');

    const decimals = fraction?.length ?? 0;
    const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''));

    return new Price(
        baseToken,
        quoteToken,
        JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)),
        JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals))
    );
}

function mulDiv(a, b, multiplier) {
    return a * b / multiplier;
}

function getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0) {
    if (sqrtRatioAX96 > sqrtRatioBX96)[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    const intermediate = mulDiv(sqrtRatioAX96, sqrtRatioBX96, Q96);
    return mulDiv(amount0, intermediate, sqrtRatioBX96 - sqrtRatioAX96);
}

function getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1) {
    if (sqrtRatioAX96 > sqrtRatioBX96)[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    return mulDiv(amount1, Q96, sqrtRatioBX96 - sqrtRatioAX96);
}

function getLiquidityForAmounts(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1) {
    let liquidity;
    if (sqrtRatioAX96 > sqrtRatioBX96)[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    if (sqrtRatioX96 <= sqrtRatioAX96) {
        liquidity = getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
    } else {
        if (sqrtRatioX96 < sqrtRatioBX96) {
            const liquidity0 = getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0);
            const liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1);
            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        } else {
            liquidity = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
        }
    }
    return liquidity;
}

function getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
    if (sqrtRatioAX96 > sqrtRatioBX96)[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    return mulDiv(liquidity, sqrtRatioBX96 - sqrtRatioAX96, sqrtRatioBX96) / sqrtRatioAX96;
}

function getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
    if (sqrtRatioAX96 > sqrtRatioBX96)[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    return mulDiv(liquidity, sqrtRatioBX96 - sqrtRatioAX96, Q96);
}

function getAmountsForLiquidity(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, liquidity) {
    let amount0;
    let amount1;
    if (sqrtRatioAX96 > sqrtRatioBX96)[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
    if (sqrtRatioX96 <= sqrtRatioAX96) {
        amount0 = getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
    } else if (sqrtRatioX96 < sqrtRatioBX96) {
        amount0 = getAmount0ForLiquidity(sqrtRatioX96, sqrtRatioBX96, liquidity);
        amount1 = getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioX96, liquidity);
    } else {
        amount1 = getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
    }
    return [amount0, amount1];
}

function getCoinsByPair(pair, amount0, amount1) {
    const coins = poolPairModels.find(item => item.type === pair);
    if (!coins) {
        throw new Error('invalid tokens pair');
    }
    const coin0 = coins.coin0;
    const coin1 = coins.coin1;
    coin0.amount = amount0 ?? 0;
    coin1.amount = amount1 ?? 0;

    return {
        coin0,
        coin1
    }
}

function getLiquidityByPercent(liquidity, percent) {
    return (BigInt(liquidity) * BigInt(percent) / BigInt(100)).toString();
}

module.exports = {
    getAmountsForLiquidity,
    tryParseTick,
    getCoinsByPair,
    getLiquidityByPercent,
    getLiquidityForAmount0,
    getLiquidityForAmount1
}

