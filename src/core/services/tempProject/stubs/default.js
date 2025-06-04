module.exports = function (moduleName) {
  return `// Type definitions for ${moduleName}
declare module "${moduleName}" {
  const _default: any;
  export = _default;
}

export = {};
export {};`;
};
