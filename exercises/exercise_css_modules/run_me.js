const { runMochaTests, showTestResults } = require("../../runMocha.js");
const path = require("path");

const testPath = path.join(__dirname, "test_css_modules.js");
runMochaTests(testPath).then((results) => {
  showTestResults(results);
});
