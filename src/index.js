const { handleCheckRequest } = require("./api");
const { loadExercise } = require("./api/handlers");

const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  parseCSS,
  processFiles,
  extractMetadata,
  processProjectWithCSSModules,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  checkCSSModuleCompliance,
} = require("./core");

const { createProcessor } = require("./processors");

const {
  createTempFileWithContent,
  getFileType,
  readFileContent,
  validateCSSModuleUsage,
  generateCSSModuleTypeDefinitions,
  bundleCSSModules,
  findCSSModulesInDirectory,
} = require("./utils");

module.exports = {
  handleCheckRequest,
  loadExercise,
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  parseCSS,
  processFiles,
  extractMetadata,
  processProjectWithCSSModules,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  checkCSSModuleCompliance,
  createProcessor,
  createTempFileWithContent,
  getFileType,
  readFileContent,
  validateCSSModuleUsage,
  generateCSSModuleTypeDefinitions,
  bundleCSSModules,
  findCSSModulesInDirectory,
};
