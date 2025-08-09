const defaultRateLimit = {
    global: false, // Allows per-route rate limit configuration
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        expiresIn: context.after
    }),
    keyGenerator: (request) => {
        return request.ip;
    },
    skipOnError: true,
    onBanReach: (req, key) => {
        console.warn(`Rate limit ban reached for key: ${key}, IP: ${req.ip}`);
    },
    onExceeding: (req, key) => {
        console.warn(`Rate limit exceeded for key: ${key}, IP: ${req.ip}`);
    }
};
export function setupRateLimit(rateLimitOptions) {
    let options = defaultRateLimit;
    if (rateLimitOptions === false)
        return false;
    if ('function' === typeof rateLimitOptions) {
        options = rateLimitOptions(defaultRateLimit);
    }
    else if ('object' === typeof rateLimitOptions) {
        options = { ...defaultRateLimit, ...rateLimitOptions };
    }
    return options;
}
//# sourceMappingURL=rate-limit.js.map