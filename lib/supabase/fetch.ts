import "server-only";

export function createServerFetch(timeoutMs = 10_000): typeof fetch {
  return (input, init) => {
    const callerSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const deadline = AbortSignal.timeout(timeoutMs);
    const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline;

    return globalThis.fetch(input, { ...init, signal });
  };
}

export const serverFetch = createServerFetch();
