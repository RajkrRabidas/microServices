const { Redis } = require("ioredis");

if (!process.env.REDIS_HOST) {
    const noop = {
        on: () => {},
        set: async () => {},
        get: async () => null,
        quit: async () => {},
        disconnect: async () => {},
    };
    module.exports = noop;
} else {
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    redis.on("connect", () => {
        console.log("Connected to Redis");
    });

    module.exports = redis;
}