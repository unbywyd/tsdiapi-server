import Helmet from 'helmet';
export function loadHelmetModule(app, helmetOptions) {
    return app.use(Helmet(helmetOptions));
}
//# sourceMappingURL=helmet.js.map