"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileLoader = exports.fileLoadAsText = exports.loadProjectConfigFile = exports.loadProjectFile = exports.fileImport = void 0;
exports.getAppPath = getAppPath;
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const typedi_1 = __importDefault(require("typedi"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
/**
 * Returns the absolute path to the root directory or a subdirectory.
 * @param {string} relativePath - Relative path from the root directory.
 * @returns {string} - The absolute path.
 */
function getAppPath(relativePath = "") {
    const rootDir = path_1.default.resolve(__dirname, "../");
    return relativePath ? path_1.default.join(rootDir, relativePath) : rootDir;
}
/**
 * Dynamically imports a file if it exists, otherwise returns an empty object.
 * @param {string} filePath - The absolute path of the file to import.
 * @returns {Promise<any>} - The imported module or an empty object.
 */
const fileImport = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(0, fs_1.existsSync)(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return {}; // Return empty object if file does not exist
        }
        const module = yield Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
        return module.default || module;
    }
    catch (error) {
        console.error(`Error importing file: ${filePath}`, error);
        return {}; // Return empty object on error
    }
});
exports.fileImport = fileImport;
/**
 * Loads and imports a project file by resolving its absolute path.
 * @param {string} relativePath - Relative path to the project file.
 * @returns {Promise<any>} - The imported module.
 */
const loadProjectFile = (relativePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fullPath = getAppPath(relativePath);
    return yield (0, exports.fileImport)(fullPath);
});
exports.loadProjectFile = loadProjectFile;
const loadProjectConfigFile = (relativePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fullPath = getAppPath('/config/' + relativePath);
    const module = yield (0, exports.fileImport)(fullPath);
    return module;
});
exports.loadProjectConfigFile = loadProjectConfigFile;
/**
 * Reads a file as plain text from the project directory.
 * @param {string} relativePath - Relative path to the file.
 * @returns {Promise<string>} - The file content as a string.
 */
const fileLoadAsText = (relativePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fullPath = getAppPath(relativePath);
    return yield (0, promises_1.readFile)(fullPath, "utf-8");
});
exports.fileLoadAsText = fileLoadAsText;
/**
 * Loads all matching files using glob, imports them, and optionally registers them with Typedi.
 * @param {string} pattern - Glob pattern to match files.
 * @param {boolean} [setToContainer=false] - Whether to register modules with Typedi.
 * @returns {Promise<any[]>} - An array of imported modules.
 */
const fileLoader = (pattern_1, ...args_1) => __awaiter(void 0, [pattern_1, ...args_1], void 0, function* (pattern, setToContainer = false) {
    const safePattern = pattern.replace(/\\/g, "/").replace(/\/+/g, "/");
    const files = yield (0, glob_1.glob)(safePattern, { cwd: getAppPath() });
    const modules = [];
    for (const file of files) {
        const absolutePath = path_1.default.isAbsolute(file) ? file : path_1.default.join(getAppPath(), file);
        const module = yield (0, exports.fileImport)(absolutePath);
        if (module) {
            modules.push(module);
        }
        if (setToContainer && (module === null || module === void 0 ? void 0 : module.default)) {
            typedi_1.default.get(module.default);
        }
    }
    return modules;
});
exports.fileLoader = fileLoader;
exports.default = exports.fileLoader;
//# sourceMappingURL=file-loader.js.map