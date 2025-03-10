import { AppContext } from "./AppContext.js";
import { AppOptions } from "./AppOptions.js";
import { AppPlugin } from "./Plugin.js";

export * from "./AppContext.js";
export * from "./AppOptions.js";
export * from "./Plugin.js";


export interface CreateAppOptions {
    config?: Partial<AppOptions> | ((options: AppOptions) => AppOptions);
    plugins?: AppPlugin[];
    onInit?(ctx: AppContext): Promise<void> | void;
    beforeStart?(ctx: AppContext): Promise<void> | void;
    afterStart?(ctx: AppContext): Promise<void> | void;
}
