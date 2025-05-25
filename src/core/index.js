const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
} = require("./parsers");

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
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
};
