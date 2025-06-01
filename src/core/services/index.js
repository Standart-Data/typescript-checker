const {
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
} = require("./fileService");
const {
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
} = require("./metadataService");
const {
  resolveModulePath,
  extractImports,
  extractExports,
  buildDependencyGraph,
  createUnifiedContext,
} = require("./dependencyService");
const {
  createTempProject,
  validateTypeScriptInProject,
  validateBabelInProject,
  processFileInProject,
  processMultipleFiles,
} = require("./multiFileService");
const {
  processProjectWithCSSModules,
  findTypeScriptFiles,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  generateProjectTypeDefinitions,
  checkCSSModuleCompliance,
} = require("./cssModuleService");

module.exports = {
  // File service
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,

  // Metadata service
  getMainFileName,
  extractFileMetadata,
  extractMetadata,

  // Dependency service
  resolveModulePath,
  extractImports,
  extractExports,
  buildDependencyGraph,
  createUnifiedContext,

  // MultiFile service
  createTempProject,
  validateTypeScriptInProject,
  validateBabelInProject,
  processFileInProject,
  processMultipleFiles,

  // CSS Module service
  processProjectWithCSSModules,
  findTypeScriptFiles,
  validateCSSModuleIntegration,
  createCSSModuleBundle,
  generateProjectTypeDefinitions,
  checkCSSModuleCompliance,
};
