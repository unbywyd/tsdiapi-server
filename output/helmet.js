const defaultHelmet = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: [
                "'self'",
                /** @by-us - adds graphiql support over helmet's default CSP */
                "'unsafe-inline'",
            ],
            baseUri: ["'self'"],
            blockAllMixedContent: [],
            fontSrc: ["'self'", 'https:', 'data:'],
            frameAncestors: ["'self'", '*'],
            imgSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            scriptSrc: [
                "'self'",
                /** @by-us - adds graphiql support over helmet's default CSP */
                "'unsafe-inline'",
                /** @by-us - adds graphiql support over helmet's default CSP */
                "'unsafe-eval'",
            ],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
};
export function setupHelmet(helmetOptions) {
    let options = defaultHelmet;
    if (helmetOptions === false)
        return false;
    if ('function' === typeof helmetOptions) {
        options = helmetOptions(defaultHelmet);
    }
    else if ('object' === typeof helmetOptions) {
        options = helmetOptions;
    }
    return options;
}
//# sourceMappingURL=helmet.js.map