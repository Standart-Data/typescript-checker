module.exports = `// Type definitions for React 18
import * as React from 'react';

// Basic types
export type Key = string | number | bigint;
export type ReactText = string | number;
export type ReactNode = ReactElement | ReactText | ReactFragment | ReactPortal | boolean | null | undefined;
export type ReactFragment = {} | ReactNodeArray;
export type ReactNodeArray = ReadonlyArray<ReactNode>;

// React Element
export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
  type: T;
  props: P;
  key: Key | null;
}

export interface ReactPortal {
  key: Key | null;
  children: ReactNode;
}

// Component types
export type JSXElementConstructor<P> =
  | ((props: P) => ReactElement<any, any> | null)
  | (new (props: P) => Component<any, any>);

export type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;

export interface FunctionComponent<P = {}> {
  (props: P, context?: any): ReactElement<any, any> | null;
  propTypes?: WeakValidationMap<P>;
  contextTypes?: ValidationMap<any>;
  defaultProps?: Partial<P>;
  displayName?: string;
}

export type FC<P = {}> = FunctionComponent<P>;
export type VFC<P = {}> = FunctionComponent<P>;

export interface ComponentClass<P = {}, S = ComponentState> extends StaticLifecycle<P, S> {
  new (props: P, context?: any): Component<P, S>;
  propTypes?: WeakValidationMap<P>;
  contextTypes?: ValidationMap<any>;
  childContextTypes?: ValidationMap<any>;
  defaultProps?: Partial<P>;
  displayName?: string;
}

export type ComponentState = any;

// Component class
export class Component<P = {}, S = {}> {
  static contextType?: Context<any>;
  context: any;
  state: Readonly<S>;
  props: Readonly<P> & Readonly<{ children?: ReactNode }>;
  refs: { [key: string]: ReactInstance };

  constructor(props: P, context?: any);

  setState<K extends keyof S>(
    state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
    callback?: () => void,
  ): void;

  forceUpdate(callback?: () => void): void;
  render(): ReactNode;

  componentDidMount?(): void;
  shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
  componentWillUnmount?(): void;
  componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
  getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): any;
  componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: any): void;
  componentWillMount?(): void;
  componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
  componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
}

export class PureComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> {}

// Hooks
export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

export function useEffect(effect: EffectCallback, deps?: DependencyList): void;
export function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void;

export function useContext<T>(context: Context<T>): T;

export function useReducer<R extends Reducer<any, any>, I>(
  reducer: R,
  initializerArg: I,
  initializer: (arg: I) => ReducerState<R>,
): [ReducerState<R>, Dispatch<ReducerAction<R>>];
export function useReducer<R extends Reducer<any, any>>(
  reducer: R,
  initialState: ReducerState<R>,
  initializer?: undefined,
): [ReducerState<R>, Dispatch<ReducerAction<R>>];

export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T;
export function useMemo<T>(factory: () => T, deps: DependencyList): T;

export function useRef<T>(initialValue: T): MutableRefObject<T>;
export function useRef<T>(initialValue: T | null): RefObject<T>;
export function useRef<T = undefined>(): MutableRefObject<T | undefined>;

export function useImperativeHandle<T, R extends T>(ref: Ref<T> | undefined, init: () => R, deps?: DependencyList): void;

export function useDebugValue<T>(value: T, format?: (value: T) => any): void;

export function useDeferredValue<T>(value: T): T;
export function useTransition(): [boolean, TransitionStartFunction];
export function useId(): string;

export function useSyncExternalStore<Snapshot>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot?: () => Snapshot,
): Snapshot;

export function useInsertionEffect(effect: EffectCallback, deps?: DependencyList): void;

// Hook types
export type Dispatch<A> = (value: A) => void;
export type SetStateAction<S> = S | ((prevState: S) => S);
export type EffectCallback = () => (void | (() => void | undefined));
export type DependencyList = ReadonlyArray<any>;

export type Reducer<S, A> = (prevState: S, action: A) => S;
export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;

export interface MutableRefObject<T> {
  current: T;
}

export interface RefObject<T> {
  readonly current: T | null;
}

export type Ref<T> = RefCallback<T> | RefObject<T> | null;
export type RefCallback<T> = (instance: T | null) => void;

export type TransitionStartFunction = (callback: () => void) => void;

// Context
export interface Context<T> {
  Provider: Provider<T>;
  Consumer: Consumer<T>;
  displayName?: string;
}

export interface Provider<T> {
  (props: { value: T; children?: ReactNode }): ReactElement | null;
}

export interface Consumer<T> {
  (props: { children: (value: T) => ReactNode }): ReactElement | null;
}

export function createContext<T>(defaultValue: T): Context<T>;

// Error boundary
export interface ErrorInfo {
  componentStack: string;
}

// Lifecycle
export interface StaticLifecycle<P, S> {
  getDerivedStateFromProps?(props: P, state: S): Partial<S> | null;
  getDerivedStateFromError?(error: any): Partial<S> | null;
}

// Props validation
export interface ValidationMap<T> {
  [key: string]: Validator<T>;
}

export interface WeakValidationMap<T> {
  [key: string]: null | undefined | Validator<T>;
}

export type Validator<T> = (props: any, propName: string, componentName: string, location: string, propFullName: string) => Error | null;

// Core functions
export function createElement<P extends {}>(
  type: FunctionComponent<P> | ComponentClass<P> | string,
  props?: Attributes & P | null,
  ...children: ReactNode[]
): ReactElement<P>;

export function cloneElement<P extends {}>(
  element: ReactElement<P>,
  props?: Partial<P> & Attributes | null,
  ...children: ReactNode[]
): ReactElement<P>;

export function isValidElement<P>(object: {} | null | undefined): object is ReactElement<P>;

export interface Attributes {
  key?: Key;
}

// Fragment
export const Fragment: ExoticComponent<{ children?: ReactNode }>;

// StrictMode
export const StrictMode: ExoticComponent<{ children?: ReactNode }>;

// Suspense
export interface SuspenseProps {
  children?: ReactNode;
  fallback: NonNullable<ReactNode> | null;
}

export const Suspense: ExoticComponent<SuspenseProps>;

// Exotic components
export interface ExoticComponent<P = {}> {
  (props: P): ReactElement | null;
  readonly $$typeof: symbol;
}

// Memo
export function memo<P extends object>(
  Component: FunctionComponent<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): NamedExoticComponent<P>;

export interface NamedExoticComponent<P = {}> extends ExoticComponent<P> {
  displayName?: string;
}

// Forward ref
export function forwardRef<T, P = {}>(
  render: ForwardRefRenderFunction<T, P>,
): ForwardRefExoticComponent<P & RefAttributes<T>>;

export interface ForwardRefRenderFunction<T, P = {}> {
  (props: P, ref: Ref<T>): ReactElement | null;
  displayName?: string;
  defaultProps?: never;
  propTypes?: never;
}

export interface ForwardRefExoticComponent<P> extends NamedExoticComponent<P> {
  defaultProps?: never;
  propTypes?: never;
}

export interface RefAttributes<T> extends Attributes {
  ref?: Ref<T>;
}

// Lazy
export function lazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T>;

export interface LazyExoticComponent<T extends ComponentType<any>> extends ExoticComponent<ComponentProps<T>> {
  readonly _result: T;
}

export type ComponentProps<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>> =
  T extends JSXElementConstructor<infer P>
    ? P
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : {};

// React instance
export type ReactInstance = Component<any> | Element;

// Portal
export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: null | string): ReactPortal;

// Children utilities
export interface ReactChildren {
  map<T, C>(children: C | ReadonlyArray<C>, fn: (child: C, index: number) => T): C extends null | undefined ? C : Array<Exclude<T, boolean | null | undefined>>;
  forEach<C>(children: C | ReadonlyArray<C>, fn: (child: C, index: number) => void): void;
  count(children: any): number;
  only<C>(children: C): C extends any[] ? never : C;
  toArray(children: ReactNode | ReactNode[]): Array<Exclude<ReactNode, boolean | null | undefined>>;
}

export const Children: ReactChildren;

// JSX namespace - handled automatically by global modules system

// Version
export const version: string;

// Default export
declare const React: {
  createElement: typeof createElement;
  cloneElement: typeof cloneElement;
  createContext: typeof createContext;
  forwardRef: typeof forwardRef;
  lazy: typeof lazy;
  memo: typeof memo;
  useState: typeof useState;
  useEffect: typeof useEffect;
  useContext: typeof useContext;
  useReducer: typeof useReducer;
  useCallback: typeof useCallback;
  useMemo: typeof useMemo;
  useRef: typeof useRef;
  useImperativeHandle: typeof useImperativeHandle;
  useLayoutEffect: typeof useLayoutEffect;
  useDebugValue: typeof useDebugValue;
  useDeferredValue: typeof useDeferredValue;
  useTransition: typeof useTransition;
  useId: typeof useId;
  useSyncExternalStore: typeof useSyncExternalStore;
  useInsertionEffect: typeof useInsertionEffect;
  Component: typeof Component;
  PureComponent: typeof PureComponent;
  Fragment: typeof Fragment;
  StrictMode: typeof StrictMode;
  Suspense: typeof Suspense;
  Children: typeof Children;
  isValidElement: typeof isValidElement;
  createPortal: typeof createPortal;
  version: typeof version;
};

export default React;`;
