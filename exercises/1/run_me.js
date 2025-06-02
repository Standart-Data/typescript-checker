const { runMochaTests, showTestResults } = require("../../runMocha.js");
const path = require("path");

const testPath = path.join(__dirname, "test_ast.js");
runMochaTests(testPath).then((results) => {
  showTestResults(results);
});
