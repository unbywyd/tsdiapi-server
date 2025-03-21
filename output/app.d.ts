import { FastifyInstance } from "fastify";
import { AppContext, AppOptions } from "./types.js";
export declare function initApp<T extends object = Record<string, any>>(cwd: string, options: AppOptions<T>, fastify: FastifyInstance): Promise<Partial<AppContext<T>>>;
//# sourceMappingURL=app.d.ts.map