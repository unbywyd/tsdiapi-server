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
exports.findAvailablePort = findAvailablePort;
const http_1 = require("http");
function findAvailablePort(startingPort_1) {
    return __awaiter(this, arguments, void 0, function* (startingPort, maxAttempts = 10) {
        return new Promise((resolve) => {
            let attempt = 0;
            let currentPort = startingPort;
            function tryPort() {
                const testServer = (0, http_1.createServer)();
                testServer.listen(currentPort, () => {
                    testServer.close(() => resolve(currentPort));
                });
                testServer.on("error", (err) => {
                    if (err.code === "EADDRINUSE") {
                        attempt++;
                        if (attempt >= maxAttempts) {
                            resolve(null);
                        }
                        else {
                            console.warn(`⚠️ Port ${currentPort} is in use. Trying port ${currentPort + 1}...`);
                            currentPort++;
                            tryPort();
                        }
                    }
                    else {
                        resolve(null);
                    }
                });
            }
            tryPort();
        });
    });
}
//# sourceMappingURL=find-port.js.map