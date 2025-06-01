const {
  createTempFileWithContent,
  readFileContent,
  getFileType,
} = require("./fileUtils");
const jsxUtils = require("./jsxUtils");
const cssModuleUtils = require("./cssModuleUtils");

module.exports = {
  createTempFileWithContent,
  readFileContent,
  getFileType,
  ...jsxUtils,
  ...cssModuleUtils,
};
