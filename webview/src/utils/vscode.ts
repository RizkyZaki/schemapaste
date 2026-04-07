import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from "../types/messages";

interface VsCodeApi<T> {
  postMessage(message: T): void;
  setState(state: unknown): void;
  getState(): unknown;
}

declare global {
  interface Window {
    acquireVsCodeApi?: <T>() => VsCodeApi<T>;
  }
}

export const vscodeApi = window.acquireVsCodeApi?.<WebviewToExtensionMessage>();

export function postToExtension(message: WebviewToExtensionMessage): void {
  vscodeApi?.postMessage(message);
}

export function listenFromExtension(handler: (message: ExtensionToWebviewMessage) => void): () => void {
  const listener = (event: MessageEvent<ExtensionToWebviewMessage>): void => {
    handler(event.data);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
