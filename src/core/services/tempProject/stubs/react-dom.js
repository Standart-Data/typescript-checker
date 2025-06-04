module.exports = `// Type definitions for ReactDOM
export function render(element: any, container: any): void;
export function createRoot(container: any): any;

declare const ReactDOM: {
  render: typeof render;
  createRoot: typeof createRoot;
};

export default ReactDOM;`;
