"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmetOptions = void 0;
exports.helmetOptions = {
    /**
     * Default helmet policy + own customizations - graphiql support
     * https://helmetjs.github.io/
     */
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
const getHelmetOptions = () => __awaiter(void 0, void 0, void 0, function* () {
    return exports.helmetOptions;
});
exports.default = getHelmetOptions;
//# sourceMappingURL=helmet.config.js.map