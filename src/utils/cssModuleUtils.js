const { parseCSS } = require("../core/parsers/css");
const { parseTypeScript, parseReact } = require("../core/parsers");
const fs = require("fs");
const path = require("path");

function extractCSSModuleImports(tsCode) {
  const importRegex =
    /import\s+(?:(\w+)|{\s*([^}]+)\s*})\s+from\s+['"](.*\.module\.(?:css|scss|sass))['"];?/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(tsCode)) !== null) {
    const [fullMatch, defaultImport, namedImports, modulePath] = match;
    imports.push({
      defaultImport: defaultImport || null,
      namedImports: namedImports
        ? namedImports.split(",").map((s) => s.trim())
        : [],
      modulePath: modulePath,
      fullMatch: fullMatch,
    });
  }

  return imports;
}

function extractUsedCSSClasses(tsCode, cssImportName) {
  const usageRegex = new RegExp(`\\b${cssImportName}\\.(\\w+)\\b`, "g");
  const usedClasses = [];
  let match;

  while ((match = usageRegex.exec(tsCode)) !== null) {
    usedClasses.push(match[1]);
  }

  return [...new Set(usedClasses)];
}

function validateCSSModuleUsage(tsFilePath, cssFilePath) {
  try {
    const tsCode = fs.readFileSync(tsFilePath, "utf8");
    const cssCode = fs.readFileSync(cssFilePath, "utf8");

    const cssMetadata = parseCSS([cssFilePath]);

    // Получаем список доступных классов из новой структуры
    const availableClasses = Object.keys(cssMetadata.classes);

    const cssImports = extractCSSModuleImports(tsCode);
    const cssImport = cssImports.find((imp) =>
      imp.modulePath.includes(path.basename(cssFilePath))
    );

    if (!cssImport) {
      return {
        valid: false,
        errors: [`CSS модуль ${cssFilePath} не импортирован в ${tsFilePath}`],
        warnings: [],
        availableClasses,
        usedClasses: [],
        cssDetails: cssMetadata.classes, // Добавляем детальную информацию о CSS
      };
    }

    const importName = cssImport.defaultImport || "styles";
    const usedClasses = extractUsedCSSClasses(tsCode, importName);

    const errors = [];
    const warnings = [];

    usedClasses.forEach((className) => {
      if (!availableClasses.includes(className)) {
        errors.push(
          `Класс '${className}' используется в TypeScript, но не найден в CSS модуле`
        );
      }
    });

    availableClasses.forEach((className) => {
      if (!usedClasses.includes(className)) {
        warnings.push(
          `Класс '${className}' определен в CSS модуле, но не используется в TypeScript`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      availableClasses,
      usedClasses,
      importName,
      cssDetails: cssMetadata.classes, // Детальная информация о CSS классах
      cssVariables: cssMetadata.variables, // Информация о CSS переменных
      mediaQueries: cssMetadata.mediaQueries, // Информация о media queries
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Ошибка валидации: ${error.message}`],
      warnings: [],
      availableClasses: [],
      usedClasses: [],
      cssDetails: {},
    };
  }
}

function generateCSSModuleTypeDefinitions(cssFilePath) {
  try {
    const cssMetadata = parseCSS([cssFilePath]);
    const classes = Object.keys(cssMetadata.classes);

    const typeDefinitions = classes
      .map((className) => `  readonly ${className}: string;`)
      .join("\n");

    return `declare const styles: {
${typeDefinitions}
};

export default styles;
`;
  } catch (error) {
    console.error(`Ошибка генерации типов для ${cssFilePath}:`, error);
    return `declare const styles: any;
export default styles;
`;
  }
}

function bundleCSSModules(cssModulePaths) {
  const bundledCSS = [];
  const moduleExports = {};
  const detailedMetadata = {
    classes: {},
    variables: {},
    mediaQueries: {},
    keyframes: {},
  };

  cssModulePaths.forEach((cssPath) => {
    try {
      const cssCode = fs.readFileSync(cssPath, "utf8");
      const cssMetadata = parseCSS([cssPath]);

      bundledCSS.push(`/* ${path.basename(cssPath)} */`);
      bundledCSS.push(cssCode);
      bundledCSS.push("");

      const moduleName = path.basename(cssPath, path.extname(cssPath));

      // Создаем экспорты в старом формате для обратной совместимости
      moduleExports[moduleName] = Object.keys(cssMetadata.classes).reduce(
        (acc, className) => {
          acc[className] = className;
          return acc;
        },
        {}
      );

      // Добавляем детальную метаинформацию
      detailedMetadata.classes[moduleName] = cssMetadata.classes;
      detailedMetadata.variables[moduleName] = cssMetadata.variables;
      detailedMetadata.mediaQueries[moduleName] = cssMetadata.mediaQueries;
      detailedMetadata.keyframes[moduleName] = cssMetadata.keyframes;
    } catch (error) {
      console.warn(`Ошибка обработки CSS модуля ${cssPath}:`, error.message);
    }
  });

  return {
    css: bundledCSS.join("\n"),
    exports: moduleExports,
    metadata: detailedMetadata, // Новое: детальная метаинформация
  };
}

function findCSSModulesInDirectory(directory) {
  const cssModules = [];

  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (
          file.includes(".module.") &&
          (file.endsWith(".css") ||
            file.endsWith(".scss") ||
            file.endsWith(".sass"))
        ) {
          cssModules.push(filePath);
        }
      });
    } catch (error) {
      console.warn(`Ошибка сканирования директории ${dir}:`, error.message);
    }
  }

  scanDirectory(directory);
  return cssModules;
}

function analyzeCSSClassUsage(cssClassData, usageContext = {}) {
  const analysis = {
    hasBaseStyles: Object.keys(cssClassData.properties).length > 0,
    hasPseudoClasses: Object.keys(cssClassData.pseudoClasses).length > 0,
    hasMediaQueries: Object.keys(cssClassData.mediaQueries).length > 0,
    totalProperties: cssClassData.context.reduce(
      (total, ctx) => total + ctx.properties.length,
      0
    ),
    contextBreakdown: {
      base: cssClassData.context.filter((ctx) => !ctx.media && !ctx.pseudo)
        .length,
      pseudo: cssClassData.context.filter((ctx) => ctx.pseudo && !ctx.media)
        .length,
      media: cssClassData.context.filter((ctx) => ctx.media && !ctx.pseudo)
        .length,
      mediaPseudo: cssClassData.context.filter((ctx) => ctx.media && ctx.pseudo)
        .length,
    },
    usedProperties: Object.keys(cssClassData.properties),
    pseudoClassList: Object.keys(cssClassData.pseudoClasses),
    mediaQueryList: Object.keys(cssClassData.mediaQueries),
    recommendation: generateUsageRecommendation(cssClassData),
  };

  return analysis;
}

function generateUsageRecommendation(cssClassData) {
  const recommendations = [];

  if (Object.keys(cssClassData.properties).length === 0) {
    recommendations.push("Класс не содержит базовых стилей");
  }

  if (Object.keys(cssClassData.pseudoClasses).length > 0) {
    recommendations.push(
      `Имеет ${Object.keys(cssClassData.pseudoClasses).length} псевдо-классов`
    );
  }

  if (Object.keys(cssClassData.mediaQueries).length > 0) {
    recommendations.push(
      `Адаптивен для ${
        Object.keys(cssClassData.mediaQueries).length
      } media queries`
    );
  }

  return recommendations.join(", ");
}

function compareCSSModuleStructures(cssModule1Path, cssModule2Path) {
  try {
    const css1 = parseCSS([cssModule1Path]);
    const css2 = parseCSS([cssModule2Path]);

    const classes1 = Object.keys(css1.classes);
    const classes2 = Object.keys(css2.classes);

    const common = classes1.filter((cls) => classes2.includes(cls));
    const unique1 = classes1.filter((cls) => !classes2.includes(cls));
    const unique2 = classes2.filter((cls) => !classes1.includes(cls));

    return {
      commonClasses: common,
      uniqueToFirst: unique1,
      uniqueToSecond: unique2,
      similarity: common.length / Math.max(classes1.length, classes2.length),
      detailedComparison: common.map((className) => ({
        className,
        propertiesMatch:
          JSON.stringify(css1.classes[className].properties) ===
          JSON.stringify(css2.classes[className].properties),
        module1Properties: Object.keys(css1.classes[className].properties),
        module2Properties: Object.keys(css2.classes[className].properties),
      })),
    };
  } catch (error) {
    return {
      error: `Ошибка сравнения: ${error.message}`,
      similarity: 0,
    };
  }
}

module.exports = {
  extractCSSModuleImports,
  extractUsedCSSClasses,
  validateCSSModuleUsage,
  generateCSSModuleTypeDefinitions,
  bundleCSSModules,
  findCSSModulesInDirectory,
  analyzeCSSClassUsage,
  compareCSSModuleStructures,
};
