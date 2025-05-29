const {
  createTempFileWithContent,
  readFileContent,
  getFileType,
} = require("./fileUtils");
const jsxUtils = require("./jsxUtils");

module.exports = {
  createTempFileWithContent,
  readFileContent,
  getFileType,
  ...jsxUtils,
};
