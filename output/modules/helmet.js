"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadHelmetModule = loadHelmetModule;
const helmet_1 = __importDefault(require("helmet"));
function loadHelmetModule(app, helmetOptions) {
    return app.use((0, helmet_1.default)(helmetOptions));
}
//# sourceMappingURL=helmet.js.map