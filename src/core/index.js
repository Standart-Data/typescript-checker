// Parsers
const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
} = require("./parsers");

// Services
const {
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
} = require("./services");

module.exports = {
  // Parsers
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,

  // Services
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
};
