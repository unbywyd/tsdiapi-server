import path from 'node:path';
export function setupStatic(context, appOptions) {
    if (!appOptions?.staticOptions)
        return false;
    const staticOptions = 'function' === typeof appOptions?.staticOptions ? appOptions?.staticOptions : (defaultOptions) => defaultOptions;
    return staticOptions({
        root: path.join(context.appDir, 'public'),
        prefix: '/',
        index: ["index.html"],
    });
}
//# sourceMappingURL=static.js.map