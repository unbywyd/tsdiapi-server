import { AppContext } from "./AppContext.js";
export interface AppPlugin<T = any> {
    name: string;
    bootstrapFilesGlobPath?: string;
    globControllersPath?: string;
    globMiddlewaresPath?: string;
    config?: T;
    onInit?(ctx: AppContext): Promise<void> | void;
    beforeStart?(ctx: AppContext): Promise<void> | void;
    afterStart?(ctx: AppContext): Promise<void> | void;
}
//# sourceMappingURL=Plugin.d.ts.map