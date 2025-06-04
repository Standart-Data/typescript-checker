module.exports = `// Type definitions for UUID
export function v1(): string;
export function v3(name: string, namespace: string): string;
export function v4(): string;
export function v5(name: string, namespace: string): string;

declare const uuid: {
  v1: typeof v1;
  v3: typeof v3;
  v4: typeof v4;
  v5: typeof v5;
};

export default uuid;`;
