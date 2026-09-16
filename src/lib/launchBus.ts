// Routes files supplied at launch (CLI / context menu) to whichever page owns
// the matching tool. If the page isn't mounted yet, files are buffered until it
// registers.
type Handler = (files: string[]) => void;

const handlers: Record<string, Handler> = {};
const pending: Record<string, string[]> = {};

export function registerLaunchTarget(tool: string, handler: Handler): () => void {
  handlers[tool] = handler;
  if (pending[tool]?.length) {
    handler(pending[tool]);
    delete pending[tool];
  }
  return () => {
    if (handlers[tool] === handler) delete handlers[tool];
  };
}

export function dispatchLaunch(tool: string, files: string[]): void {
  if (!files.length) return;
  const handler = handlers[tool];
  if (handler) {
    handler(files);
  } else {
    pending[tool] = [...(pending[tool] ?? []), ...files];
  }
}
