export type BrandedString<T> = string & { __brand: T }

export type Events<T> = { [K in keyof T]: (payload: any) => void }

export type ChangeFieldType<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V }
export interface ILogger {
    fatal(msg: string, metadata?: Record<string, unknown>): void
    error(msg: string, metadata?: Record<string, unknown>): void
    warn(msg: string, metadata?: Record<string, unknown>): void
    info(msg: string, metadata?: Record<string, unknown>): void
    debug(msg: string, metadata?: Record<string, unknown>): void
    trace(msg: string, metadata?: Record<string, unknown>): void
}
