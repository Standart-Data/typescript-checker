module.exports = `// Type definitions for React
import * as React from 'react';

export interface FC<P = {}> {
  (props: P): JSX.Element | null;
}

export interface Component<P = {}, S = {}> {}
export class Component<P = {}, S = {}> {}

export function useState<T>(initialState: T): [T, (value: T) => void];
export function useEffect(effect: () => void, deps?: any[]): void;
export function createElement(type: any, props?: any, ...children: any[]): any;

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare const React: typeof import('react');
export default React;`;
