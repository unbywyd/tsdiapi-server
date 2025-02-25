"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMorganModule = loadMorganModule;
const morgan_1 = __importDefault(require("morgan"));
function loadMorganModule(app, logger) {
    return app.use((0, morgan_1.default)("combined", {
        stream: { write: (message) => logger.info(message.trim()) },
    }));
}
//# sourceMappingURL=morgan.js.map