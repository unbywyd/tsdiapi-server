import { AsyncLocalStorage } from 'async_hooks';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Request context type - stores arbitrary key-value pairs per request
 */
export type RequestContext = Record<string, any>;

/**
 * Maximum context size in bytes (approximate estimation)
 * Used to warn about potential memory issues
 */
const MAX_CONTEXT_SIZE = 1024 * 1024; // 1MB

/**
 * AsyncLocalStorage instance for request-scoped context
 * Single instance per application - safe to use across all requests
 */
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get current request context
 * @returns RequestContext or null if called outside request handler
 */
export function getRequestContext(): RequestContext | null {
    return requestContextStorage.getStore() || null;
}

/**
 * Get value from request context by key
 * @param key - Key to retrieve value for
 * @returns Value or undefined if key not found or context unavailable
 */
export function getRequestContextValue<T = any>(key: string): T | undefined {
    const context = requestContextStorage.getStore();
    return context?.[key] as T | undefined;
}

/**
 * Set value in request context
 * @param key - Key to store value under
 * @param value - Value to store
 * @throws Error if called outside request handler or value too large
 */
export function setRequestContextValue<T = any>(key: string, value: T): void {
    const context = requestContextStorage.getStore();
    if (!context) {
        throw new Error('Request context is not available. This function must be called within a request handler.');
    }
    
    // Check size (approximate)
    const valueSize = estimateSize(value);
    const currentSize = estimateSize(context);
    if (currentSize + valueSize > MAX_CONTEXT_SIZE) {
        console.warn(`⚠️ Request context size limit exceeded for key "${key}". Consider using smaller values or external storage.`);
    }
    
    // Warn about potentially problematic data types
    if (value && typeof value === 'object') {
        if (value instanceof Buffer && value.length > 100 * 1024) {
            console.warn(`⚠️ Large Buffer stored in request context (${value.length} bytes). Consider storing file references instead.`);
        }
    }
    
    context[key] = value;
}

/**
 * Set entire request context (replaces existing)
 * @param context - Context object
 * @throws Error if called outside request handler
 */
export function setRequestContext(context: RequestContext): void {
    const store = requestContextStorage.getStore();
    if (!store) {
        throw new Error('Request context is not available. This function must be called within a request handler.');
    }
    
    const newSize = estimateSize(context);
    if (newSize > MAX_CONTEXT_SIZE) {
        console.warn(`⚠️ Request context size limit exceeded. Consider using smaller values or external storage.`);
    }
    
    Object.assign(store, context);
}

/**
 * Delete value from request context
 * @param key - Key to delete
 */
export function deleteRequestContextValue(key: string): void {
    const context = requestContextStorage.getStore();
    if (context) {
        delete context[key];
    }
}

/**
 * Clear entire request context
 */
export function clearRequestContext(): void {
    const context = requestContextStorage.getStore();
    if (context) {
        Object.keys(context).forEach(key => delete context[key]);
    }
}

/**
 * Execute function within request context
 * @param context - Initial context object
 * @param fn - Function to execute
 * @returns Result of function execution
 */
export function runInRequestContext<T>(
    context: RequestContext,
    fn: () => T | Promise<T>
): T | Promise<T> {
    return requestContextStorage.run(context, fn);
}

/**
 * Create global hook for initializing request context
 * Should be registered at Fastify level via addHook('onRequest')
 */
export function createRequestContextHook() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        // Initialize empty context for each request
        const context: RequestContext = {
            requestId: request.id,
            url: request.url,
            method: request.method,
            ip: request.ip,
            // Don't store full headers - they can be large
            // Store only needed headers instead
            userAgent: request.headers['user-agent'],
            // Timestamp for debugging
            startTime: Date.now(),
        };
        
        // Use enterWith to set context for the entire request lifecycle
        // This ensures context persists through all async operations
        // until the next enterWith call or until async operation chain breaks
        requestContextStorage.enterWith(context);
        
        // Context is now available for all subsequent handlers in this request
    };
}

/**
 * Hook for cleaning up context after request completion
 * Should be registered via addHook('onResponse')
 */
export function createRequestContextCleanupHook() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        // Clear context after request completion
        // This helps garbage collector free memory faster
        const context = requestContextStorage.getStore();
        if (context) {
            // Remove potentially large objects
            const keysToRemove: string[] = [];
            for (const key in context) {
                const value = context[key];
                // Remove large buffers and objects
                if (value instanceof Buffer && value.length > 10 * 1024) {
                    keysToRemove.push(key);
                } else if (value && typeof value === 'object' && estimateSize(value) > 50 * 1024) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => delete context[key]);
        }
    };
}

/**
 * Get entire request context as object (copy)
 * @returns Copy of current context or null
 */
export function getAllRequestContext(): RequestContext | null {
    const context = requestContextStorage.getStore();
    return context ? { ...context } : null;
}

/**
 * Approximate estimation of object size in bytes
 */
function estimateSize(obj: any): number {
    if (obj === null || obj === undefined) {
        return 0;
    }
    
    if (typeof obj === 'string') {
        return obj.length * 2; // UTF-16
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return 8;
    }
    
    if (obj instanceof Buffer) {
        return obj.length;
    }
    
    if (Array.isArray(obj)) {
        return obj.reduce((size, item) => size + estimateSize(item), 0);
    }
    
    if (typeof obj === 'object') {
        let size = 0;
        for (const key in obj) {
            size += key.length * 2; // key
            size += estimateSize(obj[key]); // value
        }
        return size;
    }
    
    return 0;
}

/**
 * Disable AsyncLocalStorage (for testing or debugging)
 * WARNING: This will disable functionality for all requests!
 */
export function disableRequestContext(): void {
    requestContextStorage.disable();
}

