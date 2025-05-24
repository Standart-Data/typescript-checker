const { createProcessor } = require("./processors");

const {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
} = require("./parsers");

// Утилиты
const {
  createTempFileWithContent,
  getFileType,
  readFileContent,
} = require("./utils");

module.exports = {
  createProcessor,
  getParser,
  parseFiles,

  parseTypeScript,
  parseReact,

  createTempFileWithContent,
  getFileType,
  readFileContent,
};
