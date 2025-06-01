const postcss = require("postcss");
const fs = require("fs");

function validateCSS(code, options = {}) {
  try {
    const isModule = options.isModule || false;

    const result = postcss().process(code, { from: undefined });

    const errors = [];

    if (isModule) {
      const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
      const classes = [];
      let match;

      while ((match = classRegex.exec(code)) !== null) {
        classes.push(match[1]);
      }

      if (classes.length === 0) {
        errors.push({
          message: "CSS модуль должен содержать хотя бы один класс",
        });
      }
    }

    return errors;
  } catch (error) {
    return [
      {
        message: `Ошибка парсинга CSS: ${error.message}`,
      },
    ];
  }
}

function processCSS(code, options = {}) {
  try {
    const isModule = options.isModule || false;

    if (!isModule) {
      return code;
    }

    const result = postcss().process(code, { from: undefined });

    const classMap = {};
    const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
    let match;

    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      classMap[className] = className;
    }

    const moduleExports = `
/* CSS Module Exports */
module.exports = ${JSON.stringify(classMap, null, 2)};
`;

    return {
      css: result.css,
      exports: classMap,
      moduleCode: moduleExports,
    };
  } catch (error) {
    console.error("Ошибка обработки CSS:", error);
    return {
      css: code,
      exports: {},
      moduleCode: "module.exports = {};",
    };
  }
}

function generateCSSModuleTypes(exports, moduleName) {
  const typeDefinitions = Object.keys(exports)
    .map((className) => `  readonly ${className}: string;`)
    .join("\n");

  return `declare const styles: {
${typeDefinitions}
};

export default styles;
`;
}

module.exports = {
  validateCSS,
  processCSS,
  generateCSSModuleTypes,
};
