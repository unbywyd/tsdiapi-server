import { glob } from "glob";
import path from "path";
import Container from "typedi";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

/**
 * Returns the absolute path to the root directory or a subdirectory.
 * @param {string} relativePath - Relative path from the root directory.
 * @returns {string} - The absolute path.
 */
export function getAppPath(relativePath: string = ""): string {
    const rootDir = path.resolve(__dirname, "../");
    return relativePath ? path.join(rootDir, relativePath) : rootDir;
}

/**
 * Dynamically imports a file if it exists, otherwise returns an empty object.
 * @param {string} filePath - The absolute path of the file to import.
 * @returns {Promise<any>} - The imported module or an empty object.
 */
export const fileImport = async (filePath: string): Promise<any> => {
    try {
        if (!existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return {}; // Return empty object if file does not exist
        }
        const module = await import(filePath);
        return module.default || module;
    } catch (error) {
        console.error(`Error importing file: ${filePath}`, error);
        return {}; // Return empty object on error
    }
};

/**
 * Loads and imports a project file by resolving its absolute path.
 * @param {string} relativePath - Relative path to the project file.
 * @returns {Promise<any>} - The imported module.
 */
export const loadProjectFile = async (relativePath: string): Promise<any> => {
    const fullPath = getAppPath(relativePath);
    return await fileImport(fullPath);
};


export const loadProjectConfigFile = async (relativePath: string): Promise<any> => {
    const fullPath = getAppPath('/config/' + relativePath);
    const module = await fileImport(fullPath);
    return module;
}

/**
 * Reads a file as plain text from the project directory.
 * @param {string} relativePath - Relative path to the file.
 * @returns {Promise<string>} - The file content as a string.
 */
export const fileLoadAsText = async (relativePath: string): Promise<string> => {
    const fullPath = getAppPath(relativePath);
    return await readFile(fullPath, "utf-8");
};

/**
 * Loads all matching files using glob, imports them, and optionally registers them with Typedi.
 * @param {string} pattern - Glob pattern to match files.
 * @param {boolean} [setToContainer=false] - Whether to register modules with Typedi.
 * @returns {Promise<any[]>} - An array of imported modules.
 */
export const fileLoader = async (pattern: string, setToContainer: boolean = false): Promise<any[]> => {
    const safePattern = pattern.replace(/\\/g, "/").replace(/\/+/g, "/");
    const files = await glob(safePattern, { cwd: getAppPath() });
    const modules: any[] = [];

    for (const file of files) {
        const absolutePath = path.isAbsolute(file) ? file : path.join(getAppPath(), file);
        const module = await fileImport(absolutePath);

        if (module) {
            modules.push(module);
        }

        if (setToContainer && module?.default) {
            Container.get(module.default);
        }
    }

    return modules;
};

export default fileLoader;
