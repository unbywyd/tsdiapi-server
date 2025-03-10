/**
 * Returns the absolute path to the root folder (one level above the current file)
 * or to a file/folder if relativePath is specified.
 *
 * @param {string} [relativePath=""] - Relative path from the root directory
 * @returns {string} Absolute path
 */
export declare function getAppPath(relativePath?: string): string;
/**
 * Dynamically imports a file if it exists,
 * otherwise returns an empty object.
 *
 * @param {string} filePath Absolute path to the file
 * @returns {Promise<any>} Module or {}
 */
export declare function fileImport(filePath: string): Promise<any>;
/**
 * Loads a module from a relative path (relative to the root).
 *
 * @param {string} relativePath Relative path
 * @returns {Promise<any>} Imported module
 */
export declare function loadProjectFile(relativePath: string): Promise<any>;
/**
 * Loads a config file from /config/<relativePath>
 *
 * @param {string} relativePath File name in the /config folder
 * @returns {Promise<any>}
 */
export declare function loadProjectConfigFile(relativePath: string): Promise<any>;
/**
 * Reads a file as text
 *
 * @param {string} relativePath Relative path to the file
 * @returns {Promise<string>} File content
 */
export declare function fileLoadAsText(relativePath: string): Promise<string>;
export declare function fileLoader(pattern: string, setToContainer?: boolean): Promise<any[]>;
/**
 * Default export, if needed
 */
export default fileLoader;
//# sourceMappingURL=file-loader.d.ts.map