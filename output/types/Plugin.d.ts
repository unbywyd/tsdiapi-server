import { AppContext } from "./AppContext";
export interface AppPlugin<T = any> {
    name: string;
    bootstrapFilesGlobPath?: string;
    config?: T;
    onInit?(ctx: AppContext): Promise<void> | void;
    beforeStart?(ctx: AppContext): Promise<void> | void;
    afterStart?(ctx: AppContext): Promise<void> | void;
}
//# sourceMappingURL=Plugin.d.ts.map