module.exports = `// Type definitions for ReactDOM 18
import * as React from 'react';

// Root API (React 18)
export interface Root {
  render(children: React.ReactNode): void;
  unmount(): void;
}

export interface CreateRootOptions {
  identifierPrefix?: string;
  onRecoverableError?: (error: unknown) => void;
}

export function createRoot(container: Element | DocumentFragment, options?: CreateRootOptions): Root;

// Legacy API (React 17 and below)
export function render(
  element: React.ReactElement,
  container: Element | DocumentFragment,
  callback?: () => void,
): React.Component<any, any> | Element | void;

export function hydrate(
  element: React.ReactElement,
  container: Element | DocumentFragment,
  callback?: () => void,
): React.Component<any, any> | Element | void;

export function unmountComponentAtNode(container: Element | DocumentFragment): boolean;

// Server-side rendering
export function renderToString(element: React.ReactElement): string;
export function renderToStaticMarkup(element: React.ReactElement): string;

// Utilities
export function findDOMNode(instance: React.Component<any, any> | Element | null | undefined): Element | null;

export function flushSync<R>(fn: () => R): R;
export function flushSync<A, R>(fn: (a: A) => R, a: A): R;

export function unstable_batchedUpdates<A, R>(fn: (a: A) => R, a: A): R;
export function unstable_batchedUpdates<R>(fn: () => R): R;

// Portal
export function createPortal(children: React.ReactNode, container: Element | DocumentFragment, key?: string | null): React.ReactPortal;

// Preload resources (React 18.3+)
export function preload(href: string, options: { as: string; crossOrigin?: string; integrity?: string; type?: string }): void;
export function preinit(href: string, options: { as: string; crossOrigin?: string; integrity?: string; precedence?: string }): void;

// Version
export const version: string;

// Default export
declare const ReactDOM: {
  createRoot: typeof createRoot;
  render: typeof render;
  hydrate: typeof hydrate;
  unmountComponentAtNode: typeof unmountComponentAtNode;
  renderToString: typeof renderToString;
  renderToStaticMarkup: typeof renderToStaticMarkup;
  findDOMNode: typeof findDOMNode;
  flushSync: typeof flushSync;
  unstable_batchedUpdates: typeof unstable_batchedUpdates;
  createPortal: typeof createPortal;
  preload: typeof preload;
  preinit: typeof preinit;
  version: typeof version;
};

export default ReactDOM;`;
