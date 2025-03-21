// file-loader.ts
import { pathToFileURL, fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import { Container } from "typedi";
import { readFile } from "fs/promises";
import { find, pathExists } from "fsesm";
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
        if (!await pathExists(filePath)) {
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
export async function fileLoaderWithContext(pattern, context, cwd = __dirname) {
    const matchedFiles = await find(pattern, { cwd, absolute: true });
    for (const file of matchedFiles) {
        const fileUrl = pathToFileURL(file).href;
        const imported = await import(fileUrl);
        if (imported.default && typeof imported.default === 'function') {
            await imported.default(context);
        }
    }
}
export async function fileLoader(pattern, cwd, setToContainer = false) {
    // Fix slashes to work on Windows / POSIX
    // Find files by pattern
    const matchedFiles = await find(pattern, { cwd, absolute: true });
    const modules = [];
    for (const file of matchedFiles) {
        const imported = await fileImport(file);
        if (imported) {
            modules.push(imported);
        }
        // If DI is needed – register default export in the container
        if (setToContainer && imported instanceof Object) {
            Container.get(imported);
        }
    }
    return modules;
}
/**
 * Default export, if needed
 */
export default fileLoader;
//# sourceMappingURL=file-loader.js.map