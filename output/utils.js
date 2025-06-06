export function removeTrailingSlash(path) {
    if (typeof path !== 'string' || path.length === 0) {
        return path;
    }
    const trailingSlashRegex = /[\/\\]$/;
    return path.replace(trailingSlashRegex, '');
}
export const makeLoadPath = (appDir, ext) => {
    return `${appDir ? appDir + '/' : ''}**/*.${ext}.*s`;
};
//# sourceMappingURL=utils.js.map