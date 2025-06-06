export function removeTrailingSlash(path: string): string {
    if (typeof path !== 'string' || path.length === 0) {
        return path;
    }
    const trailingSlashRegex = /[\/\\]$/;
    return path.replace(trailingSlashRegex, '');
}
export const makeLoadPath = (appDir: string, ext: string) => {
    return `${appDir ? appDir + '/' : ''}**/*.${ext}.*s`;
}