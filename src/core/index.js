const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  parseCSS,
} = require("./parsers");

const {
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
  processProjectWithCSSModules,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  checkCSSModuleCompliance,
} = require("./services");

module.exports = {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  parseCSS,
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
  processProjectWithCSSModules,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  checkCSSModuleCompliance,
};
