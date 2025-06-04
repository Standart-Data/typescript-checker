const fs = require("fs");
const path = require("path");

const stubsMap = {
  "class-transformer": require("./class-transformer"),
  "class-validator": require("./class-validator"),
  react: require("./react"),
  "react-dom": require("./react-dom"),
  "react-hook-form": require("./react-hook-form"),
  "reflect-metadata": require("./reflect-metadata"),
  express: require("./express"),
  lodash: require("./lodash"),
  moment: require("./moment"),
  axios: require("./axios"),
  uuid: require("./uuid"),
};

function getStub(moduleName) {
  if (stubsMap[moduleName]) {
    return stubsMap[moduleName];
  }

  const defaultStub = require("./default");
  return defaultStub(moduleName);
}

function loadAllStubs() {
  const stubsDir = __dirname;
  const files = fs
    .readdirSync(stubsDir)
    .filter(
      (file) =>
        file.endsWith(".js") && file !== "index.js" && file !== "default.js"
    )
    .map((file) => path.basename(file, ".js"));

  const stubs = {};
  files.forEach((moduleName) => {
    try {
      stubs[moduleName] = require(`./${moduleName}`);
    } catch (error) {
      console.warn(
        `Не удалось загрузить заглушку для ${moduleName}:`,
        error.message
      );
    }
  });

  return stubs;
}

module.exports = {
  getStub,
  loadAllStubs,
  stubsMap,
};
