// file-loader.ts
import { glob } from "glob";
import { pathToFileURL, fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import { Container } from "typedi";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
/**
 * In ESM, there is no __filename and __dirname, so we calculate them via import.meta.url
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Returns the absolute path to the root folder (one level above the current file)
 * or to a file/folder if relativePath is specified.
 *
 * @param {string} [relativePath=""] - Relative path from the root directory
 * @returns {string} Absolute path
 */
export function getAppPath(relativePath = "") {
    const rootDir = path.resolve(__dirname, "../");
    return relativePath ? path.join(rootDir, relativePath) : rootDir;
}
/**
 * Dynamically imports a file if it exists,
 * otherwise returns an empty object.
 *
 * @param {string} filePath Absolute path to the file
 * @returns {Promise<any>} Module or {}
 */
export async function fileImport(filePath) {
    try {
        if (!existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return {};
        }
        // Convert path to file:// URL – ESM import requires URL
        const fileUrl = pathToFileURL(filePath).href;
        const importedModule = await import(fileUrl);
        return importedModule.default || importedModule;
    }
    catch (error) {
        console.error(`Error importing file: ${filePath}`, error);
        return {};
    }
}
/**
 * Loads a module from a relative path (relative to the root).
 *
 * @param {string} relativePath Relative path
 * @returns {Promise<any>} Imported module
 */
export async function loadProjectFile(relativePath) {
    const fullPath = getAppPath(relativePath);
    return fileImport(fullPath);
}
/**
 * Loads a config file from /config/<relativePath>
 *
 * @param {string} relativePath File name in the /config folder
 * @returns {Promise<any>}
 */
export async function loadProjectConfigFile(relativePath) {
    const fullPath = getAppPath("/config/" + relativePath);
    return fileImport(fullPath);
}
/**
 * Reads a file as text
 *
 * @param {string} relativePath Relative path to the file
 * @returns {Promise<string>} File content
 */
export async function fileLoadAsText(relativePath) {
    const fullPath = getAppPath(relativePath);
    return readFile(fullPath, "utf-8");
}
export async function fileLoader(pattern, setToContainer = false) {
    // Fix slashes to work on Windows / POSIX
    const safePattern = pattern.replace(/\\/g, "/").replace(/\/+/g, "/");
    // Find files by pattern
    // By default, glob will be relative to `cwd: getAppPath()`
    const matchedFiles = await glob(safePattern, { cwd: getAppPath() });
    const modules = [];
    for (const file of matchedFiles) {
        // If glob returns a relative path – convert to absolute
        const absolutePath = path.isAbsolute(file)
            ? file
            : path.join(getAppPath(), file);
        const imported = await fileImport(absolutePath);
        if (imported) {
            modules.push(imported);
        }
        // If DI is needed – register default export in the container
        if (setToContainer && imported?.default) {
            Container.get(imported.default);
        }
    }
    return modules;
}
/**
 * Default export, if needed
 */
export default fileLoader;
//# sourceMappingURL=file-loader.js.map