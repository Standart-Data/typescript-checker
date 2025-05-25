// API layer
const { handleCheckRequest } = require("./api");
const { loadExercise } = require("./api/handlers");

// Core layer
const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  processFiles,
  extractMetadata,
} = require("./core");

// Processors
const {
    createProcessor,
} = require("./processors");

// Utils
const {
  createTempFileWithContent,
  getFileType,
  readFileContent,
} = require("./utils");

module.exports = {
  // API
  handleCheckRequest,
  loadExercise,

  // Core
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  processFiles,
  extractMetadata,

  // Processors
  createProcessor,

  // Utils
  createTempFileWithContent,
  getFileType,
  readFileContent,
};
