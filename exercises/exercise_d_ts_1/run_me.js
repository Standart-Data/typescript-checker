const { runMochaTests, showTestResults } = require("../../runMocha.js");

runMochaTests("test_ast.js").then((results) => {
  showTestResults(results);
});
