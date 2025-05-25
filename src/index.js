const { handleCheckRequest } = require("./api");
const { loadExercise } = require("./api/handlers");

const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  processFiles,
  extractMetadata,
} = require("./core");

const { createProcessor } = require("./processors");

const {
  createTempFileWithContent,
  getFileType,
  readFileContent,
} = require("./utils");

module.exports = {
  handleCheckRequest,
  loadExercise,
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
  processFiles,
  extractMetadata,
  createProcessor,
  createTempFileWithContent,
  getFileType,
  readFileContent,
};
