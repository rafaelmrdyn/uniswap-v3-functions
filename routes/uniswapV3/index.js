const express = require('express');
const router = express.Router();

const transform = require("../../middlewares/transform");
const validate = require("../../middlewares/validate");

const uniswapV3PoolValidation = require('../../validations/uniswapV3');
const UniV3Controller = require('../../modules/uniV3Pool/index');
const {ResponseCodes} = require("../../constants");

/**
 * @swagger
 * /uniV3/add-position:
 *   post:
 *     summary: Get Uniswap v3 pool approve.
 *     description: Get Uniswap v3 pool approve..
 *     tags: [UniV3]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               amount:
 *                  type: number
 *               pair:
 *                  type: string
 *               range:
 *                  type: number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                      txHash:
 *                          type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/add-position', validate(uniswapV3PoolValidation.addPosition), async (req, res) => {

    const { amount, pair, range } = req.body;

    try {
        const data = await UniV3Controller.addPosition(amount, pair, range);
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }
});

/**
 * @swagger
 * /uniV3/tokenId/{txHash}:
 *   get:
 *     summary: Get Uniswap v3 pool tokenId.
 *     description: Get Uniswap v3 pool tokenId.
 *     tags: [UniV3]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: transaction hash
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                      tokenId:
 *                          type: number
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/tokenId/:txHash', validate(uniswapV3PoolValidation.getTokenId), async (req, res) => {

    const { txHash } = req.params;

    try {
        const data = await UniV3Controller.getTokenId(txHash);
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }
});

/**
 * @swagger
 * /uniV3/allocation/{tokenId}:
 *   get:
 *     summary: Get Uniswap v3 current allocation.
 *     description: Get Uniswap v3 current allocation.
 *     tags: [UniV3]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: token id
 *       - in: query
 *         name: pair
 *         required: true
 *         schema:
 *           type: string
 *         description: pair
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/getAllocation'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/allocation/:tokenId', transform(), validate(uniswapV3PoolValidation.getAllocation), async (req, res) => {

    const { tokenId } = req.params;
    const { pair } = req.query;

    try {
        const data = await UniV3Controller.getAllocation(tokenId, pair);
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }

});


/**
 * @swagger
 * /uniV3/rewards/{tokenId}:
 *   get:
 *     summary: Get Uniswap v3 current rewards.
 *     description: Get Uniswap v3 current rewards.
 *     tags: [UniV3]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: token id
 *       - in: query
 *         name: pair
 *         required: true
 *         schema:
 *           type: string
 *         description: pair
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/getRewards'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/rewards/:tokenId', transform(), validate(uniswapV3PoolValidation.getRewards), async (req, res) => {

    const { tokenId } = req.params;
    const { pair } = req.query;

    try {
        const data = await UniV3Controller.getRewards(tokenId, pair);
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }
});

// /**
//  * @swagger
//  * /uniV3/subscribe-price-change:
//  *   post:
//  *     summary: Subscribe price change.
//  *     description: Subscribe price change.
//  *     tags: [UniV3]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             properties:
//  *               pair:
//  *                  type: string
//  *               fee:
//  *                  type: number
//  *     responses:
//  *       "200":
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *                 $ref: '#/components/schemas/getAllocation'
//  *       "400":
//  *         $ref: '#/components/responses/BadRequest'
//  */
router.post('/subscribe-price-change', validate(uniswapV3PoolValidation.subscribePriceChange), async (req, res) => {

    const { pair, fee } = req.body;

    try {
        const data = await UniV3Controller.subscribePriceChange(pair, fee);
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }
});

/**
 * @swagger
 * /uniV3/exit-position:
 *   post:
 *     summary: Exit position.
 *     description: Exit position.
 *     tags: [UniV3]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               tokenId:
 *                  type: number
 *               pair:
 *                  type: string
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/exitPosition'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/exit-position', validate(uniswapV3PoolValidation.exitPosition), async (req, res) => {

    const { tokenId, pair } = req.body;

    try {
        const data = await UniV3Controller.exitPosition(tokenId, pair);
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }
});

/**
 * @swagger
 * /uniV3/balance:
 *   get:
 *     summary: Get wallet balance.
 *     description: Get wallet balance.
 *     tags: [UniV3]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/getBalance'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/balance', async (req, res) => {

    try {
        const data = await UniV3Controller.getWalletBalance();
        res.status(ResponseCodes.OK).json(data);
    } catch (err) {
        res.status(ResponseCodes.BAD_REQUEST).json({
            message: err.message
        });
    }
});

module.exports = router;
