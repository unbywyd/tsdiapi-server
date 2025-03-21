import helmet, { FastifyHelmetOptions } from '@fastify/helmet';
import { FastifyInstance } from "fastify";
import { AppOptions } from "./types.js";

const defaultHelmet: FastifyHelmetOptions = {
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
}

export async function setupHelmet(fastify: FastifyInstance, helmetOptions?: AppOptions['helmetOptions']) {
    let options: FastifyHelmetOptions = defaultHelmet;
    if (helmetOptions === false) return;
    if ('function' === typeof helmetOptions) {
        options = helmetOptions(defaultHelmet);
    } else if ('object' === typeof helmetOptions) {
        options = helmetOptions
    }
    await fastify.register(helmet, options);
}
