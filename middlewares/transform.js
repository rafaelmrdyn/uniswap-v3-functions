const transform = () => (req, res, next) => {
    const transformArray = ['fee', 'tokenId', 'amount0', 'amount1', 'percent', 'gasPrice', 'minPrice', 'maxPrice'];
    if (req.query) {
        for (const key in req.query) {
            if (req.query.hasOwnProperty(key) && transformArray.includes(key)) {
                req.query[key] = Number(req.query[key]);
            }
        }
    }

    return next();
};


module.exports = transform;
