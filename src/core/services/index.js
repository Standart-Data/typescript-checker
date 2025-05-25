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
};
