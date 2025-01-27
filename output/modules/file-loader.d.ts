/**
 * Returns the absolute path to the root directory or a subdirectory.
 * @param {string} relativePath - Relative path from the root directory.
 * @returns {string} - The absolute path.
 */
export declare function getAppPath(relativePath?: string): string;
/**
 * Dynamically imports a file if it exists, otherwise returns an empty object.
 * @param {string} filePath - The absolute path of the file to import.
 * @returns {Promise<any>} - The imported module or an empty object.
 */
export declare const fileImport: (filePath: string) => Promise<any>;
/**
 * Loads and imports a project file by resolving its absolute path.
 * @param {string} relativePath - Relative path to the project file.
 * @returns {Promise<any>} - The imported module.
 */
export declare const loadProjectFile: (relativePath: string) => Promise<any>;
export declare const loadProjectConfigFile: (relativePath: string) => Promise<any>;
/**
 * Reads a file as plain text from the project directory.
 * @param {string} relativePath - Relative path to the file.
 * @returns {Promise<string>} - The file content as a string.
 */
export declare const fileLoadAsText: (relativePath: string) => Promise<string>;
/**
 * Loads all matching files using glob, imports them, and optionally registers them with Typedi.
 * @param {string} pattern - Glob pattern to match files.
 * @param {boolean} [setToContainer=false] - Whether to register modules with Typedi.
 * @returns {Promise<any[]>} - An array of imported modules.
 */
export declare const fileLoader: (pattern: string, setToContainer?: boolean) => Promise<any[]>;
export default fileLoader;
//# sourceMappingURL=file-loader.d.ts.map