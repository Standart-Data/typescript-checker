const fs = require("fs");
const path = require("path");
const { parseFiles } = require("../parsers");
const { parseCSS } = require("../parsers/css");
const {
  validateCSSModuleUsage,
  generateCSSModuleTypeDefinitions,
  bundleCSSModules,
  findCSSModulesInDirectory,
  analyzeCSSClassUsage,
} = require("../../utils/cssModuleUtils");
const { getFileType } = require("../../utils");
const { createTempFileWithContent } = require("../../utils");

function processProjectWithCSSModules(projectDir) {
  const cssModules = findCSSModulesInDirectory(projectDir);
  const tsFiles = findTypeScriptFiles(projectDir);

  const results = {
    cssModules: {},
    typeScriptFiles: {},
    validations: [],
    bundle: null,
    typeDefinitions: {},
  };

  cssModules.forEach((cssPath) => {
    const fileName = path.basename(cssPath);
    try {
      const fileExt = getFileType(fileName);
      const metadata = parseFiles(fileExt, [cssPath]);
      results.cssModules[fileName] = metadata;

      results.typeDefinitions[fileName] =
        generateCSSModuleTypeDefinitions(cssPath);
    } catch (error) {
      console.warn(`Ошибка обработки CSS модуля ${cssPath}:`, error.message);
    }
  });

  tsFiles.forEach((tsPath) => {
    const fileName = path.basename(tsPath);
    try {
      const fileExt = getFileType(fileName);
      const metadata = parseFiles(fileExt, [tsPath]);
      results.typeScriptFiles[fileName] = metadata;
    } catch (error) {
      console.warn(
        `Ошибка обработки TypeScript файла ${tsPath}:`,
        error.message
      );
    }
  });

  cssModules.forEach((cssPath) => {
    tsFiles.forEach((tsPath) => {
      const validation = validateCSSModuleUsage(tsPath, cssPath);
      if (validation.usedClasses.length > 0 || validation.errors.length > 0) {
        results.validations.push({
          cssFile: path.basename(cssPath),
          tsFile: path.basename(tsPath),
          ...validation,
        });
      }
    });
  });

  if (cssModules.length > 0) {
    results.bundle = bundleCSSModules(cssModules);
  }

  return results;
}

function findTypeScriptFiles(directory) {
  const tsFiles = [];

  function scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          tsFiles.push(filePath);
        }
      });
    } catch (error) {
      console.warn(`Ошибка сканирования директории ${dir}:`, error.message);
    }
  }

  scanDirectory(directory);
  return tsFiles;
}

function validateCSSModuleIntegration(cssModulePath, typeScriptFiles) {
  const validations = [];

  typeScriptFiles.forEach((tsPath) => {
    const validation = validateCSSModuleUsage(tsPath, cssModulePath);
    if (validation.usedClasses.length > 0 || validation.errors.length > 0) {
      validations.push({
        tsFile: path.basename(tsPath),
        cssFile: path.basename(cssModulePath),
        ...validation,
      });
    }
  });

  return validations;
}

function createCSSModuleBundle(projectDir, outputDir = "./dist") {
  const cssModules = findCSSModulesInDirectory(projectDir);

  if (cssModules.length === 0) {
    return null;
  }

  const bundle = bundleCSSModules(cssModules);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const bundlePath = path.join(outputDir, "bundle.css");
  fs.writeFileSync(bundlePath, bundle.css);

  const exportsPath = path.join(outputDir, "css-modules.json");
  fs.writeFileSync(exportsPath, JSON.stringify(bundle.exports, null, 2));

  return {
    bundlePath,
    exportsPath,
    bundle,
  };
}

function generateProjectTypeDefinitions(projectDir, outputDir = "./types") {
  const cssModules = findCSSModulesInDirectory(projectDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const typeFiles = [];

  cssModules.forEach((cssPath) => {
    const baseName = path.basename(cssPath, path.extname(cssPath));
    const typeDefinition = generateCSSModuleTypeDefinitions(cssPath);
    const typeFilePath = path.join(outputDir, `${baseName}.d.ts`);

    fs.writeFileSync(typeFilePath, typeDefinition);
    typeFiles.push(typeFilePath);
  });

  return typeFiles;
}

function checkCSSModuleCompliance(projectDir) {
  const results = processProjectWithCSSModules(projectDir);

  const compliance = {
    totalCSSModules: Object.keys(results.cssModules).length,
    totalTSFiles: Object.keys(results.typeScriptFiles).length,
    validationResults: results.validations,
    issues: [],
    score: 0,
  };

  let totalValidations = results.validations.length;
  let validValidations = 0;

  results.validations.forEach((validation) => {
    if (validation.valid) {
      validValidations++;
    } else {
      compliance.issues.push({
        type: "error",
        cssFile: validation.cssFile,
        tsFile: validation.tsFile,
        errors: validation.errors,
      });
    }

    if (validation.warnings.length > 0) {
      compliance.issues.push({
        type: "warning",
        cssFile: validation.cssFile,
        tsFile: validation.tsFile,
        warnings: validation.warnings,
      });
    }
  });

  compliance.score =
    totalValidations > 0 ? (validValidations / totalValidations) * 100 : 100;

  return compliance;
}

/**
 * Обрабатывает отдельный CSS файл для API эндпоинта
 * @param {string} filename - имя CSS файла
 * @param {string} content - содержимое CSS файла
 * @returns {Object} результат обработки CSS
 */
function processSingleCSSFile(filename, content) {
  try {
    // Создаем временный файл для парсинга
    const tempFile = createTempFileWithContent(content, path.extname(filename));

    // Парсим CSS
    const cssMetadata = parseCSS([tempFile]);

    // Определяем, является ли файл CSS модулем
    const isCSSModule = /\.module\.(css|scss|sass)$/.test(filename);

    // Анализируем структуру классов
    const classAnalysis = {};
    Object.keys(cssMetadata.classes).forEach((className) => {
      classAnalysis[className] = analyzeCSSClassUsage(
        cssMetadata.classes[className]
      );
    });

    // Генерируем типы TypeScript для CSS модулей
    let typeDefinitions = null;
    if (isCSSModule) {
      typeDefinitions = generateCSSModuleTypeDefinitions(tempFile);
    }

    const result = {
      success: true,
      filename: filename,
      isCSSModule: isCSSModule,
      metadata: cssMetadata,
      analysis: {
        totalClasses: Object.keys(cssMetadata.classes).length,
        totalProperties: cssMetadata.allProperties.length,
        totalVariables: Object.keys(cssMetadata.variables).length,
        mediaQueries: Object.keys(cssMetadata.mediaQueries).length,
        keyframes: Object.keys(cssMetadata.keyframes).length,
        classDetails: classAnalysis,
      },
      typeDefinitions: typeDefinitions,
      exports: isCSSModule ? cssMetadata.exports : [],
      errors: [],
    };

    return result;
  } catch (error) {
    return {
      success: false,
      filename: filename,
      isCSSModule: false,
      metadata: {},
      analysis: {},
      typeDefinitions: null,
      exports: [],
      errors: [{ message: `Ошибка обработки CSS файла: ${error.message}` }],
    };
  }
}

module.exports = {
  processProjectWithCSSModules,
  findTypeScriptFiles,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  generateProjectTypeDefinitions,
  checkCSSModuleCompliance,
  processSingleCSSFile,
};
