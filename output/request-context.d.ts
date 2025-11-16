import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Request context type - stores arbitrary key-value pairs per request
 */
export type RequestContext = Record<string, any>;
/**
 * Get current request context
 * @returns RequestContext or null if called outside request handler
 */
export declare function getRequestContext(): RequestContext | null;
/**
 * Get value from request context by key
 * @param key - Key to retrieve value for
 * @returns Value or undefined if key not found or context unavailable
 */
export declare function getRequestContextValue<T = any>(key: string): T | undefined;
/**
 * Set value in request context
 * @param key - Key to store value under
 * @param value - Value to store
 * @throws Error if called outside request handler or value too large
 */
export declare function setRequestContextValue<T = any>(key: string, value: T): void;
/**
 * Set entire request context (replaces existing)
 * @param context - Context object
 * @throws Error if called outside request handler
 */
export declare function setRequestContext(context: RequestContext): void;
/**
 * Delete value from request context
 * @param key - Key to delete
 */
export declare function deleteRequestContextValue(key: string): void;
/**
 * Clear entire request context
 */
export declare function clearRequestContext(): void;
/**
 * Execute function within request context
 * @param context - Initial context object
 * @param fn - Function to execute
 * @returns Result of function execution
 */
export declare function runInRequestContext<T>(context: RequestContext, fn: () => T | Promise<T>): T | Promise<T>;
/**
 * Create global hook for initializing request context
 * Should be registered at Fastify level via addHook('onRequest')
 */
export declare function createRequestContextHook(): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
/**
 * Hook for cleaning up context after request completion
 * Should be registered via addHook('onResponse')
 */
export declare function createRequestContextCleanupHook(): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
/**
 * Get entire request context as object (copy)
 * @returns Copy of current context or null
 */
export declare function getAllRequestContext(): RequestContext | null;
/**
 * Disable AsyncLocalStorage (for testing or debugging)
 * WARNING: This will disable functionality for all requests!
 */
export declare function disableRequestContext(): void;
//# sourceMappingURL=request-context.d.ts.map