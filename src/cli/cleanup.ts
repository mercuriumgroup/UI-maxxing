type CleanupFn = () => Promise<void>

const handlers: CleanupFn[] = []

export function registerCleanup(fn: CleanupFn): void {
  handlers.push(fn)
}

export async function runCleanup(): Promise<void> {
  await Promise.allSettled(handlers.map(fn => fn()))
}
