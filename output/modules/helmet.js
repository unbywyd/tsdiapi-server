"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadHelmetModule = loadHelmetModule;
const helmet_1 = __importDefault(require("helmet"));
const helmet_config_1 = __importDefault(require("../config/helmet.config"));
function loadHelmetModule(app) {
    return app.use((0, helmet_1.default)(helmet_config_1.default));
}
//# sourceMappingURL=helmet.js.map