class BadRequestException extends Error {
    constructor(message) {
        super(message);
    }
}

module.exports = BadRequestException;
